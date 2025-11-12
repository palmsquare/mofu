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
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const userId = searchParams.get('user_id');
    const leadMagnetSlug = searchParams.get('lead_magnet_slug');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Use admin client to bypass RLS
    const adminSupabase = createSupabaseAdminClient();
    
    // Build query using admin client
    let query = adminSupabase
      .from('leads')
      .select(`
        *,
        lead_magnets (
          id,
          slug,
          title,
          resource_type,
          resource_url
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Get owner emails separately since we can't join auth.users directly
    // We'll get owner IDs and fetch emails separately

    // Apply filters
    if (userId) {
      query = query.eq('owner_id', userId);
    }

    if (leadMagnetSlug) {
      query = query.eq('lead_magnet_slug', leadMagnetSlug);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: downloads, error: downloadsError } = await query;

    if (downloadsError) {
      console.error("[admin/downloads][GET] error:", downloadsError);
      return NextResponse.json({ error: "Impossible de récupérer les logs." }, { status: 500 });
    }

    // Get owner emails for each download
    const ownerIds = [...new Set(downloads?.map(d => d.owner_id).filter(Boolean) || [])];
    const ownerEmails: Record<string, string> = {};
    
    if (ownerIds.length > 0) {
      const { data: ownerData } = await adminSupabase.auth.admin.listUsers();
      ownerData?.users.forEach(user => {
        if (ownerIds.includes(user.id)) {
          ownerEmails[user.id] = user.email || 'N/A';
        }
      });
    }

    // Add owner emails to downloads
    const downloadsWithEmails = downloads?.map(download => ({
      ...download,
      owner: download.owner_id ? { email: ownerEmails[download.owner_id] || 'N/A' } : null,
    })) || [];

    // Get total count using admin client
    let countQuery = adminSupabase
      .from('leads')
      .select('*', { count: 'exact', head: true });

    if (userId) {
      countQuery = countQuery.eq('owner_id', userId);
    }

    if (leadMagnetSlug) {
      countQuery = countQuery.eq('lead_magnet_slug', leadMagnetSlug);
    }

    if (startDate) {
      countQuery = countQuery.gte('created_at', startDate);
    }

    if (endDate) {
      countQuery = countQuery.lte('created_at', endDate);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error("[admin/downloads][GET] count error:", countError);
    }

    return NextResponse.json({
      data: downloadsWithEmails,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[admin/downloads][GET] error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

