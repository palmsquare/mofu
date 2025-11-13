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
        console.error("[admin/users][GET] Admin check failed:", adminError);
        return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
      }
      isAdmin = true;
    } catch (clientError) {
      console.error("[admin/users][GET] Failed to create admin client for check:", clientError);
      return NextResponse.json({ error: "Impossible de vérifier les droits admin." }, { status: 500 });
    }

    // Use admin client for all operations (bypasses RLS)
    const adminSupabase = createSupabaseAdminClient();
    
    // Get all users with their quotas
    const { data: usersData, error: usersError } = await adminSupabase.auth.admin.listUsers();

    if (usersError) {
      console.error("[admin/users][GET] users error:", usersError);
      return NextResponse.json({ error: "Impossible de récupérer les utilisateurs." }, { status: 500 });
    }

    const users = usersData?.users || [];

    // Get quotas for all users using admin client
    const { data: quotas, error: quotasError } = await adminSupabase
      .from('user_quotas')
      .select('*');

    if (quotasError) {
      console.error("[admin/users][GET] quotas error:", quotasError);
    }

    // Get lead magnets count for each user using admin client
    const { data: leadMagnets, error: leadMagnetsError } = await adminSupabase
      .from('lead_magnets')
      .select('owner_id')
      .not('owner_id', 'is', null);

    if (leadMagnetsError) {
      console.error("[admin/users][GET] lead magnets error:", leadMagnetsError);
    }

    // Get downloads count for each user using admin client
    const { data: downloads, error: downloadsError } = await adminSupabase
      .from('leads')
      .select('owner_id')
      .not('owner_id', 'is', null);

    if (downloadsError) {
      console.error("[admin/users][GET] downloads error:", downloadsError);
    }

    // Calculate storage for each user using admin client
    const { data: fileLeadMagnets } = await adminSupabase
      .from('lead_magnets')
      .select('owner_id, resource_type, resource_url')
      .eq('resource_type', 'file')
      .not('owner_id', 'is', null);

    // Get actual file sizes from storage
    let storageMap = new Map<string, number>();
    if (fileLeadMagnets && fileLeadMagnets.length > 0) {
      // Extract file paths
      const filePaths = fileLeadMagnets
        .map(lm => {
          const url = lm.resource_url;
          const match = url.match(/(\d+_[a-z0-9]+\.\w+)/);
          return match ? { path: match[1], ownerId: lm.owner_id } : null;
        })
        .filter((item): item is { path: string; ownerId: string } => item !== null);

      // List files in storage using admin client
      const { data: fileList } = await adminSupabase.storage
        .from('lead-magnets')
        .list('', { limit: 1000 });

      if (fileList) {
        // Group by owner and sum file sizes
        filePaths.forEach(({ path, ownerId }) => {
          const file = fileList.find(f => f.name === path);
          if (file && file.metadata?.size) {
            const currentSize = storageMap.get(ownerId) || 0;
            storageMap.set(ownerId, currentSize + (file.metadata.size || 0));
          }
        });
      }
    }

    // Combine user data with quotas and stats
    const usersWithStats = users.map((user) => {
      const quota = quotas?.find((q) => q.user_id === user.id);
      const leadMagnetsCount = leadMagnets?.filter((lm) => lm.owner_id === user.id).length || 0;
      const downloadsCount = downloads?.filter((d) => d.owner_id === user.id).length || 0;
      const storageBytes = storageMap.get(user.id) || 0;
      const storageMB = storageBytes / (1024 * 1024);

      return {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at,
        planType: quota?.plan_type || 'free',
        quota: quota ? {
          storageLimitMB: quota.storage_limit_mb,
          storageUsedMB: storageMB,
          storageRemainingMB: Math.max(0, quota.storage_limit_mb - storageMB),
          downloadsLimit: quota.downloads_limit,
          downloadsUsed: downloadsCount,
          downloadsRemaining: Math.max(0, quota.downloads_limit - downloadsCount),
          leadMagnetsLimit: quota.lead_magnets_limit,
          leadMagnetsUsed: leadMagnetsCount,
          leadMagnetsRemaining: Math.max(0, quota.lead_magnets_limit - leadMagnetsCount),
        } : null,
        stats: {
          leadMagnetsCount,
          downloadsCount,
          storageMB: Number(storageMB.toFixed(2)),
        },
      };
    });

    return NextResponse.json({ data: usersWithStats });
  } catch (error) {
    console.error("[admin/users][GET] error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

