import { notFound } from "next/navigation";
import { supabaseServerClient } from "../../../lib/supabase-client";
import { CapturePageClient } from "./capture-page-client";

export default async function CapturePage({ params }: { params: { slug: string } }) {
  const supabase = supabaseServerClient();

  const { data: leadMagnet, error } = await supabase
    .from("lead_magnets")
    .select("*")
    .eq("slug", params.slug)
    .maybeSingle();

  if (error) {
    console.error("[capture-page] error", error);
    notFound();
  }

  if (!leadMagnet) {
    notFound();
  }

  return <CapturePageClient leadMagnet={leadMagnet} />;
}

