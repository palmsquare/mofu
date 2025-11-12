import { notFound } from "next/navigation";
import { createAnonymousSupabase } from "../../../lib/supabase-server";
import { convertToProxyUrl } from "../../../lib/file-url";
import { CapturePageClient } from "./capture-page-client";

export default async function CapturePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // Use anonymous client to respect RLS policies that allow public read access
  const supabase = createAnonymousSupabase();

  const { data: leadMagnet, error } = await supabase
    .from("lead_magnets")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[capture-page] Supabase error:", error);
    notFound();
  }

  if (!leadMagnet) {
    console.error("[capture-page] Lead magnet not found for slug:", slug);
    notFound();
  }

  // Convert Supabase URL to proxy URL if it's a file
  const convertedLeadMagnet = {
    ...leadMagnet,
    resource_url: leadMagnet.resource_type === "file"
      ? convertToProxyUrl(leadMagnet.resource_url)
      : leadMagnet.resource_url,
  };

  return <CapturePageClient leadMagnet={convertedLeadMagnet} />;
}

