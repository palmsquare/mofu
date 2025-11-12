import { NextResponse, NextRequest } from "next/server";
import { createApiSupabaseClient } from "@/lib/supabase-api-client";
import { canUploadFile, calculateQuotaUsage, FREE_PLAN_QUOTAS } from "@/lib/quotas";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB (temporary limit per file)
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/zip",
  "application/x-zip-compressed",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
];

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    // Handle JSON payload (link)
    if (contentType.includes("application/json")) {
      const body = await request.json();

      if (typeof body !== "object" || body === null) {
        return NextResponse.json({ error: "Payload invalide." }, { status: 400 });
      }

      // Link upload - no quota check needed for links
      if (body.url && typeof body.url === "string") {
        return NextResponse.json({
          uploadId: `upl_${Math.random().toString(36).slice(2, 10)}`,
          variant: "link",
          metadata: {
            url: body.url,
            titleSuggestion: body.titleSuggestion ?? "Lead magnet sans friction",
          },
        });
      }

      return NextResponse.json(
        { error: "Format attendu : { url } pour un lien externe." },
        { status: 422 }
      );
    }

    // Handle multipart/form-data (file upload)
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "Aucun fichier fourni." }, { status: 400 });
      }

      // Check authentication and quotas
      const { supabase } = createApiSupabaseClient(request);
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
          console.error("[uploads][POST] create quota error:", createError);
          return NextResponse.json({ error: "Impossible de créer le quota." }, { status: 500 });
        }

        userQuota = newQuota;
      } else {
        userQuota = quota;
      }

      // Calculate actual storage usage by querying Supabase Storage
      const { data: leadMagnets } = await supabase
        .from('lead_magnets')
        .select('id, resource_type, resource_url')
        .eq('owner_id', user.id)
        .eq('resource_type', 'file');

      // Get actual file sizes from Supabase Storage
      let storageUsedBytes = 0;
      if (leadMagnets && leadMagnets.length > 0) {
        // Extract file paths from resource_url (format: /api/files/... or direct Supabase URL)
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
      const fileSizeMB = file.size / (1024 * 1024);

      // Calculate quota usage
      const usage = calculateQuotaUsage(
        userQuota,
        storageUsedMB,
        0, // Downloads not relevant here
        0 // Lead magnets not relevant here
      );

      // Check if user can upload this file
      if (!canUploadFile(usage, fileSizeMB)) {
        return NextResponse.json(
          { error: `Espace de stockage insuffisant. Tu as utilisé ${usage.storageUsedMB.toFixed(1)}/${usage.storageLimitMB} Mo. Il te reste ${usage.storageRemainingMB.toFixed(1)} Mo. Passe au plan Pro pour plus d'espace.` },
          { status: 413 }
        );
      }

      // Validate file size (per-file limit)
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `Fichier trop volumineux. Maximum : ${MAX_FILE_SIZE / (1024 * 1024)} Mo par fichier.` },
          { status: 413 }
        );
      }

      // Validate file type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Type de fichier non autorisé : ${file.type}` },
          { status: 415 }
        );
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).slice(2, 10);
      const extension = file.name.split(".").pop() || "bin";
      const fileName = `${timestamp}_${randomStr}.${extension}`;

      // Upload to Supabase Storage
      const fileBuffer = await file.arrayBuffer();
      const fileData = new Uint8Array(fileBuffer);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("lead-magnets")
        .upload(fileName, fileData, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("[uploads][POST] Supabase upload error:", uploadError);
        return NextResponse.json(
          { error: "Erreur lors de l'upload du fichier." },
          { status: 500 }
        );
      }

      // Get public URL from Supabase (for reference)
      const { data: urlData } = supabase.storage
        .from("lead-magnets")
        .getPublicUrl(uploadData.path);

      // Create proxy URL using custom domain
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      const proxyUrl = `${siteUrl}/api/files/${uploadData.path}`;

      return NextResponse.json({
        uploadId: `upl_${randomStr}`,
        variant: "file",
        metadata: {
          filename: file.name,
          size: file.size,
          url: proxyUrl, // Use proxy URL instead of Supabase URL
          path: uploadData.path,
          supabaseUrl: urlData.publicUrl, // Keep Supabase URL for reference
          quotaRemainingBytes: MAX_FILE_SIZE - file.size,
        },
      });
    }

    return NextResponse.json(
      { error: "Content-Type non supporté. Utilise multipart/form-data ou application/json." },
      { status: 415 }
    );
  } catch (error) {
    console.error("[uploads][POST] Error:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'upload." },
      { status: 500 }
    );
  }
}
