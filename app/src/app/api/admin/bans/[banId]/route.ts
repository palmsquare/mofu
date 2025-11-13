import { NextResponse, NextRequest } from "next/server";
import { createApiSupabaseClient } from "../../../../../lib/supabase-api-client";
import { createSupabaseAdminClient } from "../../../../../lib/supabase-admin-client";

/**
 * DELETE - Supprime/désactive un ban
 * PATCH - Met à jour un ban
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ banId: string }> }
) {
  try {
    const { banId } = await params;
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
      console.error("[admin/bans/[banId]][DELETE] Failed to create admin client:", clientError);
      return NextResponse.json({ error: "Impossible de vérifier les droits admin." }, { status: 500 });
    }

    // Use admin client to delete/disable ban
    const adminSupabase = createSupabaseAdminClient();

    // Instead of deleting, we'll deactivate the ban
    const { error: updateError } = await adminSupabase
      .from('bans')
      .update({ is_active: false })
      .eq('id', banId);

    if (updateError) {
      console.error("[admin/bans/[banId]][DELETE] Error deactivating ban:", updateError);
      return NextResponse.json({ error: "Impossible de désactiver le ban." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Ban désactivé avec succès." });
  } catch (error) {
    console.error("[admin/bans/[banId]][DELETE] error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ banId: string }> }
) {
  try {
    const { banId } = await params;
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
      console.error("[admin/bans/[banId]][PATCH] Failed to create admin client:", clientError);
      return NextResponse.json({ error: "Impossible de vérifier les droits admin." }, { status: 500 });
    }

    // Get update data from request body
    const body = await request.json();
    const { reason, expires_at, is_active } = body;

    // Use admin client to update ban
    const adminSupabase = createSupabaseAdminClient();

    const updateData: any = {};
    if (reason !== undefined) updateData.reason = reason;
    if (expires_at !== undefined) updateData.expires_at = expires_at;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: updatedBan, error: updateError } = await adminSupabase
      .from('bans')
      .update(updateData)
      .eq('id', banId)
      .select()
      .single();

    if (updateError) {
      console.error("[admin/bans/[banId]][PATCH] Error updating ban:", updateError);
      return NextResponse.json({ error: "Impossible de mettre à jour le ban." }, { status: 500 });
    }

    return NextResponse.json({ data: updatedBan, message: "Ban mis à jour avec succès." });
  } catch (error) {
    console.error("[admin/bans/[banId]][PATCH] error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

