import { NextResponse, NextRequest } from "next/server";
import { createApiSupabaseClient } from "../../../../lib/supabase-api-client";
import { createSupabaseAdminClient } from "../../../../lib/supabase-admin-client";

export async function GET(request: NextRequest) {
  try {
    const { supabase } = createApiSupabaseClient(request);

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: "user_id est requis." }, { status: 400 });
    }

    // Use admin client to get lead magnets
    const adminSupabase = createSupabaseAdminClient();
    const { data: leadMagnets, error: leadMagnetsError } = await adminSupabase
      .from('lead_magnets')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (leadMagnetsError) {
      console.error("[admin/user-lead-magnets][GET] error:", leadMagnetsError);
      return NextResponse.json({ error: "Impossible de récupérer les lead magnets." }, { status: 500 });
    }

    return NextResponse.json({ data: leadMagnets || [] });
  } catch (error) {
    console.error("[admin/user-lead-magnets][GET] error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

