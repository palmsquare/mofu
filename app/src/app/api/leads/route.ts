import { NextResponse } from "next/server";

import { supabaseServerClient } from "../../../lib/supabase-client";
import { convertToProxyUrl } from "../../../lib/file-url";

export async function POST(request: Request) {
  let body: { leadMagnetId?: string; leadMagnetSlug?: string; data?: unknown; consentGranted?: unknown };

  try {
    body = (await request.json()) as typeof body;
  } catch (error) {
    console.error("[leads][POST] parse error", error);
    return NextResponse.json({ error: "Payload JSON requis." }, { status: 400 });
  }

  if (!body || (!body.leadMagnetId && !body.leadMagnetSlug)) {
    return NextResponse.json({ error: "leadMagnetId ou leadMagnetSlug est requis." }, { status: 422 });
  }

  if (typeof body.data !== "object" || body.data === null) {
    return NextResponse.json({ error: "Les données de formulaire sont manquantes." }, { status: 422 });
  }

  const supabase = supabaseServerClient();

  // Query by ID or slug - include owner_id to assign leads to the lead magnet owner
  let query = supabase
    .from("lead_magnets")
    .select("id, slug, download_limit, resource_url, resource_type, owner_id");

  if (body.leadMagnetId) {
    query = query.eq("id", body.leadMagnetId);
  } else if (body.leadMagnetSlug) {
    query = query.eq("slug", body.leadMagnetSlug);
  }

  const { data: leadMagnet, error: leadMagnetError } = await query.maybeSingle();

  if (leadMagnetError) {
    console.error("[leads][POST] lead magnet lookup error", leadMagnetError);
    return NextResponse.json({ error: "Impossible de vérifier le lead magnet." }, { status: 500 });
  }

  if (!leadMagnet) {
    return NextResponse.json({ error: "Lead magnet introuvable." }, { status: 404 });
  }

  const { count: existingCount, error: countError } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("lead_magnet_id", leadMagnet.id);

  if (countError) {
    console.error("[leads][POST] count error", countError);
    return NextResponse.json({ error: "Impossible de vérifier le quota." }, { status: 500 });
  }

  const currentCount = existingCount ?? 0;

  if (typeof leadMagnet.download_limit === "number" && leadMagnet.download_limit > 0 && currentCount >= leadMagnet.download_limit) {
    return NextResponse.json({ error: "Quota de téléchargements atteint." }, { status: 429 });
  }

  // Assign lead to the lead magnet owner (not the prospect who submitted the form)
  // This way leads appear in the dashboard of the lead magnet creator
  const { data: insertResult, error: insertError } = await supabase
    .from("leads")
    .insert({
      lead_magnet_id: leadMagnet.id,
      lead_magnet_slug: leadMagnet.slug,
      form_data: body.data,
      consent_granted: Boolean(body.consentGranted),
      owner_id: leadMagnet.owner_id || null, // Assign to lead magnet owner
    })
    .select("id, created_at")
    .single();

  if (insertError) {
    console.error("[leads][POST] insert error", insertError);
    return NextResponse.json({ error: "Impossible d'enregistrer le lead." }, { status: 500 });
  }

  // Convert Supabase URL to proxy URL if it's a file
  const resourceUrl = leadMagnet.resource_type === "file"
    ? convertToProxyUrl(leadMagnet.resource_url)
    : leadMagnet.resource_url;

  return NextResponse.json({
    data: {
      id: insertResult.id,
      createdAt: insertResult.created_at,
      resourceUrl,
      resourceType: leadMagnet.resource_type,
    },
  });
}
