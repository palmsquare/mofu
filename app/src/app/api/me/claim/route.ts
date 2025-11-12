import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function POST() {
  try {
    const supabase = await createServerSupabase();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Claim all lead magnets with no owner (created anonymously in this session)
    // Note: In a real scenario, you'd track session IDs or use a more sophisticated method
    // For now, we'll just claim magnets created in the last hour with no owner
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: claimedMagnets, error: updateError } = await supabase
      .from('lead_magnets')
      .update({ owner_id: user.id })
      .is('owner_id', null)
      .gte('created_at', oneHourAgo)
      .select();

    if (updateError) {
      console.error('Error claiming magnets:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Also update leads
    if (claimedMagnets && claimedMagnets.length > 0) {
      const magnetSlugs = claimedMagnets.map((m) => m.slug);
      await supabase
        .from('leads')
        .update({ owner_id: user.id })
        .in('lead_magnet_slug', magnetSlugs)
        .is('owner_id', null);
    }

    return NextResponse.json({
      success: true,
      claimed: claimedMagnets?.length || 0,
    });
  } catch (error) {
    console.error('Claim error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la réclamation des lead magnets' },
      { status: 500 }
    );
  }
}


