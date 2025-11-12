import { NextResponse } from "next/server";

import { supabaseServerClient } from "../../../lib/supabase-client";

export async function POST(request: Request) {
  let body: { leadMagnetId?: string; data?: unknown; consentGranted?: unknown };

  try {
    body = (await request.json()) as typeof body;
  } catch (error) {
    console.error("[leads][POST] parse error", error);
    return NextResponse.json({ error: "Payload JSON requis." }, { status: 400 });
  }

  if (!body || typeof body.leadMagnetId !== "string") {
    return NextResponse.json({ error: "leadMagnetId est requis." }, { status: 422 });
  }

  if (typeof body.data !== "object" || body.data === null) {
    return NextResponse.json({ error: "Les données de formulaire sont manquantes." }, { status: 422 });
  }

  const supabase = supabaseServerClient();

  const { data: leadMagnet, error: leadMagnetError } = await supabase
    .from("lead_magnets")
    .select("id, slug, download_limit")
    .eq("id", body.leadMagnetId)
    .maybeSingle();

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

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();

  const { data: insertResult, error: insertError } = await supabase
    .from("leads")
    .insert({
      lead_magnet_id: leadMagnet.id,
      lead_magnet_slug: leadMagnet.slug,
      form_data: body.data,
      consent_granted: Boolean(body.consentGranted),
      owner_id: user?.id || null, // Assign owner if authenticated, null otherwise
    })
    .select("id, created_at")
    .single();

  if (insertError) {
    console.error("[leads][POST] insert error", insertError);
    return NextResponse.json({ error: "Impossible d'enregistrer le lead." }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      id: insertResult.id,
      createdAt: insertResult.created_at,
      downloadUrl: leadMagnet.slug ? `https://lead.plus/${leadMagnet.slug}` : null,
    },
  });
}
