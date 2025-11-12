import { NextResponse } from "next/server";
import { supabaseServerClient } from "@/lib/supabase-client";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
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

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    // Handle JSON payload (link)
    if (contentType.includes("application/json")) {
      const body = await request.json();

      if (typeof body !== "object" || body === null) {
        return NextResponse.json({ error: "Payload invalide." }, { status: 400 });
      }

      // Link upload
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

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `Fichier trop volumineux. Maximum : ${MAX_FILE_SIZE / (1024 * 1024)} Mo.` },
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
      const supabase = supabaseServerClient();
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

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("lead-magnets")
        .getPublicUrl(uploadData.path);

      return NextResponse.json({
        uploadId: `upl_${randomStr}`,
        variant: "file",
        metadata: {
          filename: file.name,
          size: file.size,
          url: urlData.publicUrl,
          path: uploadData.path,
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
