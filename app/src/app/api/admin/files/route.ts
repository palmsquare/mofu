import { NextResponse, NextRequest } from "next/server";
import { createApiSupabaseClient } from "../../../../lib/supabase-api-client";
import { createSupabaseAdminClient } from "../../../../lib/supabase-admin-client";

export async function DELETE(request: NextRequest) {
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

    // Get file path from request body
    const body = await request.json();
    const { filePath } = body;

    if (!filePath || typeof filePath !== 'string') {
      return NextResponse.json({ error: "filePath est requis." }, { status: 400 });
    }

    // Extract filename from path (e.g., "1762952749991_qv2i6ck7.jpg")
    const match = filePath.match(/(\d+_[a-z0-9]+\.\w+)/);
    const fileName = match ? match[1] : filePath;

    // Use admin client for operations
    const adminSupabase = createSupabaseAdminClient();

    // Delete file from storage
    const { error: deleteError } = await adminSupabase.storage
      .from('lead-magnets')
      .remove([fileName]);

    if (deleteError) {
      console.error("[admin/files][DELETE] error:", deleteError);
      return NextResponse.json({ error: "Impossible de supprimer le fichier." }, { status: 500 });
    }

    // Also delete lead magnet if it exists
    const { error: deleteLeadMagnetError } = await adminSupabase
      .from('lead_magnets')
      .delete()
      .eq('resource_url', filePath)
      .or(`resource_url.like.%${fileName}%`);

    if (deleteLeadMagnetError) {
      console.error("[admin/files][DELETE] lead magnet error:", deleteLeadMagnetError);
      // Don't fail if lead magnet doesn't exist
    }

    return NextResponse.json({ success: true, message: "Fichier supprimé avec succès." });
  } catch (error) {
    console.error("[admin/files][DELETE] error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

