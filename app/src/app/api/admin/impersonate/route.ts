import { NextResponse, NextRequest } from "next/server";
import { createApiSupabaseClient } from "../../../../lib/supabase-api-client";
import { createSupabaseAdminClient } from "../../../../lib/supabase-admin-client";

/**
 * API route to impersonate a user (admin only)
 * This allows an admin to sign in as another user to see their dashboard
 * Uses Supabase Admin API to create a session for the target user
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase } = createApiSupabaseClient(request);

    // Check if current user is authenticated
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !currentUser) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    // Check if current user is admin using admin client
    let isAdmin = false;
    try {
      const adminSupabaseCheck = createSupabaseAdminClient();
      const { data: adminUser } = await adminSupabaseCheck
        .from('admin_users')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      if (!adminUser) {
        return NextResponse.json({ error: "Accès non autorisé. Admin uniquement." }, { status: 403 });
      }
      isAdmin = true;
    } catch (clientError) {
      console.error("[admin/impersonate][POST] Failed to create admin client:", clientError);
      return NextResponse.json({ error: "Impossible de vérifier les droits admin." }, { status: 500 });
    }

    // Get target user ID from request body
    const { targetUserId } = await request.json();

    if (!targetUserId) {
      return NextResponse.json({ error: "ID utilisateur manquant." }, { status: 400 });
    }

    // Use admin client to get the target user
    const adminSupabase = createSupabaseAdminClient();

    // Get target user
    const { data: targetUserData, error: userError } = await adminSupabase.auth.admin.getUserById(targetUserId);

    if (userError || !targetUserData?.user) {
      console.error("[admin/impersonate][POST] Target user error:", userError);
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }

    const targetUser = targetUserData.user;

    // Create a response with redirect to dashboard
    const response = NextResponse.redirect(new URL('/dashboard', request.url));

    // Store impersonation data in cookies
    // We'll use these cookies to identify the target user in the dashboard
    response.cookies.set('impersonate_target_user_id', targetUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    response.cookies.set('impersonate_target_user_email', targetUser.email || '', {
      httpOnly: false, // Need to access this client-side for the banner
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    response.cookies.set('impersonate_admin_id', currentUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error("[admin/impersonate][POST] error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
