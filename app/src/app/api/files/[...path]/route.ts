import { NextResponse } from "next/server";
import { supabaseServerClient } from "../../../../lib/supabase-client";

/**
 * Proxy route to serve files from Supabase Storage via custom domain
 * Usage: /api/files/1762952749991_qv2i6ck7.jpg
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const filePath = path.join("/");

    if (!filePath) {
      return NextResponse.json({ error: "Chemin de fichier manquant" }, { status: 400 });
    }

    // Security: Prevent directory traversal
    if (filePath.includes("..") || filePath.includes("//")) {
      return NextResponse.json({ error: "Chemin de fichier invalide" }, { status: 400 });
    }

    // Normalize path (remove leading slash if present)
    const normalizedPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;

    // Download file from Supabase Storage
    const supabase = supabaseServerClient();
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("lead-magnets")
      .download(normalizedPath);

    if (downloadError) {
      console.error("[api/files] Download error:", downloadError);
      return NextResponse.json(
        { error: "Fichier introuvable" },
        { status: 404 }
      );
    }

    if (!fileData) {
      return NextResponse.json(
        { error: "Fichier introuvable" },
        { status: 404 }
      );
    }

    // Convert blob to buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine content type from file extension
    const extension = normalizedPath.split(".").pop()?.toLowerCase();
    const contentTypeMap: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      pdf: "application/pdf",
      zip: "application/zip",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    };

    const contentType = contentTypeMap[extension || ""] || "application/octet-stream";

    // Return file with appropriate headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=3600, immutable",
        "Content-Disposition": `inline; filename="${normalizedPath.split("/").pop()}"`,
      },
    });
  } catch (error) {
    console.error("[api/files] Error:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération du fichier" },
      { status: 500 }
    );
  }
}

