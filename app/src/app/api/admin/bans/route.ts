import { NextResponse, NextRequest } from "next/server";
import { createApiSupabaseClient } from "../../../../lib/supabase-api-client";
import { createSupabaseAdminClient } from "../../../../lib/supabase-admin-client";

/**
 * GET - Liste tous les bans actifs
 * POST - Crée un nouveau ban
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase } = createApiSupabaseClient(request);

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    // Check if user is admin using admin client to bypass RLS
    let isAdmin = false;
    try {
      const adminSupabaseCheck = createSupabaseAdminClient();
      const { data: adminUser } = await adminSupabaseCheck
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!adminUser) {
        return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
      }
      isAdmin = true;
    } catch (clientError) {
      console.error("[admin/bans][GET] Failed to create admin client:", clientError);
      return NextResponse.json({ error: "Impossible de vérifier les droits admin." }, { status: 500 });
    }

    // Use admin client to fetch bans
    const adminSupabase = createSupabaseAdminClient();
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'email', 'ip', 'user_id', or null for all
    const activeOnly = searchParams.get('active_only') !== 'false'; // Default to true

    let query = adminSupabase.from('bans').select('*');

    if (type) {
      query = query.eq('type', type);
    }

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    query = query.order('created_at', { ascending: false });

    const { data: bans, error: bansError } = await query;

    if (bansError) {
      console.error("[admin/bans][GET] Error fetching bans:", bansError);
      return NextResponse.json({ error: "Impossible de récupérer les bans." }, { status: 500 });
    }

    // Get admin emails for banned_by
    const adminIds = bans?.map(b => b.banned_by).filter((id): id is string => !!id) || [];
    const adminEmails = new Map<string, string>();

    if (adminIds.length > 0) {
      const { data: admins } = await adminSupabase.auth.admin.listUsers();
      if (admins?.users) {
        admins.users.forEach(admin => {
          if (adminIds.includes(admin.id)) {
            adminEmails.set(admin.id, admin.email || '');
          }
        });
      }
    }

    // Add admin email to each ban
    const bansWithAdminEmail = bans?.map(ban => ({
      ...ban,
      banned_by_email: ban.banned_by ? adminEmails.get(ban.banned_by) || null : null,
    })) || [];

    return NextResponse.json({ data: bansWithAdminEmail });
  } catch (error) {
    console.error("[admin/bans][GET] error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase } = createApiSupabaseClient(request);

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    // Check if user is admin using admin client to bypass RLS
    let isAdmin = false;
    try {
      const adminSupabaseCheck = createSupabaseAdminClient();
      const { data: adminUser } = await adminSupabaseCheck
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!adminUser) {
        return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
      }
      isAdmin = true;
    } catch (clientError) {
      console.error("[admin/bans][POST] Failed to create admin client:", clientError);
      return NextResponse.json({ error: "Impossible de vérifier les droits admin." }, { status: 500 });
    }

    // Get ban data from request body
    const { type, value, reason, expires_at } = await request.json();

    if (!type || !value) {
      return NextResponse.json({ error: "Type et valeur sont requis." }, { status: 400 });
    }

    if (!['email', 'ip', 'user_id'].includes(type)) {
      return NextResponse.json({ error: "Type invalide. Doit être: email, ip, ou user_id" }, { status: 400 });
    }

    // Use admin client to create ban
    const adminSupabase = createSupabaseAdminClient();

    // Check if ban already exists
    const { data: existingBan } = await adminSupabase
      .from('bans')
      .select('*')
      .eq('type', type)
      .eq('value', value)
      .single();

    if (existingBan) {
      // Update existing ban
      const { data: updatedBan, error: updateError } = await adminSupabase
        .from('bans')
        .update({
          reason: reason || existingBan.reason,
          expires_at: expires_at || existingBan.expires_at,
          is_active: true,
          banned_by: user.id,
        })
        .eq('id', existingBan.id)
        .select()
        .single();

      if (updateError) {
        console.error("[admin/bans][POST] Error updating ban:", updateError);
        return NextResponse.json({ error: "Impossible de mettre à jour le ban." }, { status: 500 });
      }

      return NextResponse.json({ data: updatedBan, message: "Ban mis à jour avec succès." });
    }

    // Create new ban
    const { data: newBan, error: createError } = await adminSupabase
      .from('bans')
      .insert({
        type,
        value,
        reason,
        expires_at: expires_at || null,
        banned_by: user.id,
        is_active: true,
      })
      .select()
      .single();

    if (createError) {
      console.error("[admin/bans][POST] Error creating ban:", createError);
      return NextResponse.json({ error: "Impossible de créer le ban." }, { status: 500 });
    }

    return NextResponse.json({ data: newBan, message: "Ban créé avec succès." }, { status: 201 });
  } catch (error) {
    console.error("[admin/bans][POST] error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

