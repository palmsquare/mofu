import { NextResponse, NextRequest } from "next/server";
import { createApiSupabaseClient } from "../../../../lib/supabase-api-client";
import { createSupabaseAdminClient } from "../../../../lib/supabase-admin-client";

export async function GET(request: NextRequest) {
  try {
    const { supabase } = createApiSupabaseClient(request);

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ isAdmin: false });
    }

    // Use admin client to bypass RLS and check if user is admin
    try {
      let adminSupabase;
      try {
        adminSupabase = createSupabaseAdminClient();
      } catch (clientError) {
        console.error("[auth/check-admin][GET] Failed to create admin client:", clientError);
        console.error("[auth/check-admin][GET] This usually means SUPABASE_SERVICE_ROLE_KEY is not set on Vercel");
        console.error("[auth/check-admin][GET] Check Vercel Environment Variables: Settings → Environment Variables");
        return NextResponse.json({ isAdmin: false, error: "Admin client not available" });
      }

      if (adminSupabase) {
        const { data: adminUser, error: adminError } = await adminSupabase
          .from('admin_users')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (adminError || !adminUser) {
          return NextResponse.json({ isAdmin: false });
        }

        return NextResponse.json({ isAdmin: true });
      }

      return NextResponse.json({ isAdmin: false });
    } catch (error) {
      console.error("[auth/check-admin][GET] Admin check error:", error);
      return NextResponse.json({ isAdmin: false });
    }
  } catch (error) {
    console.error("[auth/check-admin][GET] error:", error);
    return NextResponse.json({ isAdmin: false });
  }
}

