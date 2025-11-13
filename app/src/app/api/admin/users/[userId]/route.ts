import { NextResponse, NextRequest } from "next/server";
import { createApiSupabaseClient } from "../../../../../lib/supabase-api-client";
import { createSupabaseAdminClient } from "../../../../../lib/supabase-admin-client";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
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
      const { data: adminUser, error: adminError } = await adminSupabaseCheck
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (adminError || !adminUser) {
        console.error("[admin/users/[userId]][DELETE] Admin check failed:", adminError);
        return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
      }
      isAdmin = true;
    } catch (clientError) {
      console.error("[admin/users/[userId]][DELETE] Failed to create admin client for check:", clientError);
      return NextResponse.json({ error: "Impossible de vérifier les droits admin." }, { status: 500 });
    }

    // Prevent admin from deleting themselves
    if (userId === user.id) {
      return NextResponse.json({ error: "Tu ne peux pas supprimer ton propre compte." }, { status: 400 });
    }

    // Use admin client for all operations
    const adminSupabase = createSupabaseAdminClient();

    // Get user's lead magnets to delete files
    const { data: leadMagnets } = await adminSupabase
      .from('lead_magnets')
      .select('id, resource_type, resource_url')
      .eq('owner_id', userId)
      .eq('resource_type', 'file');

    // Delete files from storage
    if (leadMagnets && leadMagnets.length > 0) {
      const filePaths = leadMagnets
        .map(lm => {
          const url = lm.resource_url;
          const match = url.match(/(\d+_[a-z0-9]+\.\w+)/);
          return match ? match[1] : null;
        })
        .filter((path): path is string => path !== null);

      if (filePaths.length > 0) {
        const { error: deleteError } = await adminSupabase.storage
          .from('lead-magnets')
          .remove(filePaths);

        if (deleteError) {
          console.error("[admin/users][DELETE] delete files error:", deleteError);
          // Continue even if file deletion fails
        }
      }
    }

    // Delete user's data (leads, lead_magnets, quotas, analytics will be deleted)
    const { error: deletePageViewsError } = await adminSupabase
      .from('page_views')
      .delete()
      .eq('owner_id', userId);

    if (deletePageViewsError) {
      console.error("[admin/users][DELETE] delete page views error:", deletePageViewsError);
    }

    const { error: deleteLeadsError } = await adminSupabase
      .from('leads')
      .delete()
      .eq('owner_id', userId);

    if (deleteLeadsError) {
      console.error("[admin/users][DELETE] delete leads error:", deleteLeadsError);
    }

    const { error: deleteLeadMagnetsError } = await adminSupabase
      .from('lead_magnets')
      .delete()
      .eq('owner_id', userId);

    if (deleteLeadMagnetsError) {
      console.error("[admin/users][DELETE] delete lead magnets error:", deleteLeadMagnetsError);
    }

    const { error: deleteQuotaError } = await adminSupabase
      .from('user_quotas')
      .delete()
      .eq('user_id', userId);

    if (deleteQuotaError) {
      console.error("[admin/users][DELETE] delete quota error:", deleteQuotaError);
    }

    // Delete user account using admin API
    const { error: deleteUserError } = await adminSupabase.auth.admin.deleteUser(userId);

    if (deleteUserError) {
      console.error("[admin/users][DELETE] delete user error:", deleteUserError);
      return NextResponse.json({ error: "Impossible de supprimer le compte utilisateur." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Compte utilisateur supprimé avec succès." });
  } catch (error) {
    console.error("[admin/users][DELETE] error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

