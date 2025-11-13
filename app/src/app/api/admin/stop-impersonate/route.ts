import { NextResponse, NextRequest } from "next/server";
import { createApiSupabaseClient } from "../../../../lib/supabase-api-client";
import { createSupabaseAdminClient } from "../../../../lib/supabase-admin-client";

/**
 * API route to stop impersonating a user (admin only)
 * This clears the impersonation cookies and redirects back to admin
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase } = createApiSupabaseClient(request);

    // Check if current user is authenticated
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !currentUser) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    // Check if there's an impersonation cookie
    const impersonateUserId = request.cookies.get('impersonate_user_id')?.value;
    const impersonateAdminId = request.cookies.get('impersonate_admin_id')?.value;

    if (!impersonateUserId || !impersonateAdminId) {
      return NextResponse.json({ error: "Aucune impersonation active." }, { status: 400 });
    }

    // Verify that the current user is the admin who started the impersonation
    if (impersonateAdminId !== currentUser.id) {
      // Check if current user is admin
      try {
        const adminSupabaseCheck = createSupabaseAdminClient();
        const { data: adminUser } = await adminSupabaseCheck
          .from('admin_users')
          .select('*')
          .eq('user_id', currentUser.id)
          .single();

        if (!adminUser) {
          return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
        }
      } catch (clientError) {
        console.error("[admin/stop-impersonate][POST] Failed to create admin client:", clientError);
        return NextResponse.json({ error: "Impossible de vérifier les droits admin." }, { status: 500 });
      }
    }

    // Clear impersonation cookies
    const response = NextResponse.json({ 
      success: true,
      redirectTo: '/admin',
    });

    response.cookies.delete('impersonate_user_id');
    response.cookies.delete('impersonate_admin_id');

    return response;
  } catch (error: any) {
    console.error("[admin/stop-impersonate][POST] error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

