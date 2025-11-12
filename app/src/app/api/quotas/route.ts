import { NextResponse, NextRequest } from "next/server";
import { createApiSupabaseClient } from "../../../lib/supabase-api-client";
import { calculateQuotaUsage, FREE_PLAN_QUOTAS } from "../../../lib/quotas";

export async function GET(request: NextRequest) {
  try {
    const { supabase } = createApiSupabaseClient(request);

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    // Get or create user quota
    const { data: quota, error: quotaError } = await supabase
      .from('user_quotas')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // If no quota exists, create one
    let userQuota;
    if (quotaError || !quota) {
      const { data: newQuota, error: createError } = await supabase
        .from('user_quotas')
        .insert({
          user_id: user.id,
          plan_type: 'free',
          storage_limit_mb: FREE_PLAN_QUOTAS.storageLimitMB,
          downloads_limit: FREE_PLAN_QUOTAS.downloadsLimit,
          lead_magnets_limit: FREE_PLAN_QUOTAS.leadMagnetsLimit,
          storage_used_mb: 0,
          downloads_used: 0,
          lead_magnets_used: 0,
        })
        .select()
        .single();

      if (createError) {
        console.error("[quotas][GET] create error:", createError);
        return NextResponse.json({ error: "Impossible de créer le quota." }, { status: 500 });
      }

      userQuota = newQuota;
    } else {
      userQuota = quota;
    }

    // Calculate actual usage
    // 1. Storage usage: sum of file sizes for user's lead magnets
    const { data: leadMagnets } = await supabase
      .from('lead_magnets')
      .select('id, resource_type, resource_url')
      .eq('owner_id', user.id)
      .eq('resource_type', 'file');

    // Get actual file sizes from Supabase Storage
    let storageUsedBytes = 0;
    if (leadMagnets && leadMagnets.length > 0) {
      // Extract file paths from resource_url
      const filePaths = leadMagnets
        .map(lm => {
          const url = lm.resource_url;
          // Extract path from URL (e.g., "1762952749991_qv2i6ck7.jpg")
          const match = url.match(/(\d+_[a-z0-9]+\.\w+)/);
          return match ? match[1] : null;
        })
        .filter((path): path is string => path !== null);

      // List files in storage bucket and get their sizes
      if (filePaths.length > 0) {
        const { data: fileList, error: listError } = await supabase.storage
          .from('lead-magnets')
          .list('', {
            limit: 1000,
            offset: 0,
          });

        if (!listError && fileList) {
          // Filter files that belong to this user and sum their sizes
          const userFiles = fileList.filter(f => filePaths.includes(f.name));
          storageUsedBytes = userFiles.reduce((sum, f) => sum + (f.metadata?.size || 0), 0);
        }
      }
    }

    const storageUsedMB = storageUsedBytes / (1024 * 1024);

    // 2. Downloads usage: count of leads for user's lead magnets
    const { count: downloadsUsed } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', user.id);

    // 3. Lead magnets usage: count of user's lead magnets
    const { count: leadMagnetsUsed } = await supabase
      .from('lead_magnets')
      .select('*', { count: 'exact', head: true })
      .eq('owner_id', user.id);

    // Update quota with actual usage
    const { error: updateError } = await supabase
      .from('user_quotas')
      .update({
        storage_used_mb: storageUsedMB,
        downloads_used: downloadsUsed || 0,
        lead_magnets_used: leadMagnetsUsed || 0,
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error("[quotas][GET] update error:", updateError);
    }

    // Calculate quota usage
    const usage = calculateQuotaUsage(
      userQuota,
      storageUsedMB,
      downloadsUsed || 0,
      leadMagnetsUsed || 0
    );

    return NextResponse.json({ data: usage });
  } catch (error) {
    console.error("[quotas][GET] error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

