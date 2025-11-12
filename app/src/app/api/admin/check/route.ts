import { NextResponse, NextRequest } from "next/server";
import { createApiSupabaseClient } from "../../../../lib/supabase-api-client";

export async function GET(request: NextRequest) {
  try {
    const { supabase } = createApiSupabaseClient(request);

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ isAdmin: false, error: "Non authentifié." }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json({ isAdmin: false });
    }

    return NextResponse.json({ isAdmin: true, adminUser });
  } catch (error) {
    console.error("[admin/check][GET] error:", error);
    return NextResponse.json({ isAdmin: false, error: "Erreur serveur." }, { status: 500 });
  }
}

