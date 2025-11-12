import { NextResponse, NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { supabaseServerClient } from "../../../../lib/supabase-client";

// Create Supabase client for API routes using request cookies
function createApiSupabaseClient(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );
  
  return { supabase, response };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, leadMagnetSlug, metadata } = body;

    if (!event || !leadMagnetSlug) {
      return NextResponse.json({ error: "event et leadMagnetSlug sont requis." }, { status: 400 });
    }

    // Get user agent and IP from request
    const userAgent = request.headers.get("user-agent") || "";
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "";
    const referer = request.headers.get("referer") || "";

    // Extract UTM parameters from referer or metadata
    const url = new URL(referer || `https://example.com?${metadata?.utm || ""}`);
    const utmSource = url.searchParams.get("utm_source") || metadata?.utm_source || null;
    const utmMedium = url.searchParams.get("utm_medium") || metadata?.utm_medium || null;
    const utmCampaign = url.searchParams.get("utm_campaign") || metadata?.utm_campaign || null;

    // Get lead magnet to find owner
    const supabase = supabaseServerClient();
    const { data: leadMagnet } = await supabase
      .from("lead_magnets")
      .select("id, owner_id")
      .eq("slug", leadMagnetSlug)
      .single();

    if (!leadMagnet) {
      return NextResponse.json({ error: "Lead magnet introuvable." }, { status: 404 });
    }

    // Track the event
    const { error: trackError } = await supabase
      .from("page_views")
      .insert({
        lead_magnet_id: leadMagnet.id,
        lead_magnet_slug: leadMagnetSlug,
        event_type: event, // 'view', 'click', 'conversion'
        user_agent: userAgent,
        ip_address: ip.split(",")[0].trim(), // Take first IP if multiple
        referer: referer || null,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        metadata: metadata || {},
        owner_id: leadMagnet.owner_id,
      });

    if (trackError) {
      console.error("[analytics/track] insert error:", trackError);
      return NextResponse.json({ error: "Impossible d'enregistrer l'événement." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[analytics/track] error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

