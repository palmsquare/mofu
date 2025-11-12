import { NextResponse, NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from '@supabase/ssr';

import { convertToProxyUrl } from "../../../lib/file-url";

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

const SHARE_URL_BASE = process.env.NEXT_PUBLIC_SITE_URL 
  ? `${process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")}/c/`
  : "http://localhost:3000/c/";
const DEFAULT_DOWNLOAD_LIMIT = 50;
const DEFAULT_CTA = "Recevoir la ressource";
const DEFAULT_NOTE = "+ 1000 personnes accompagnées";

type LeadMagnetPayload = {
  title: string;
  description: string;
  resourceType: "file" | "link";
  resourceUrl: string;
  downloadLimit?: number;
  templateId?: string;
  fields: Array<{
    id: string;
    label: string;
    placeholder: string;
    type: string;
    required: boolean;
  }>;
  tagline?: string;
  ctaLabel?: string;
  footerNote?: string;
};

export async function GET(request: NextRequest) {
  const { supabase } = createApiSupabaseClient(request);

  const { data, error } = await supabase
    .from("lead_magnets")
    .select(
      `
        id,
        slug,
        title,
        description,
        resource_type,
        resource_url,
        download_limit,
        template_id,
        fields,
        tagline,
        cta_label,
        footer_note,
        created_at,
        leads:leads (
          id,
          data,
          consent_granted,
          created_at
        )
      `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[lead-magnets][GET]", error);
    return NextResponse.json({ error: "Impossible de récupérer les lead magnets." }, { status: 500 });
  }

  return NextResponse.json({
    data: (data ?? []).map((leadMagnet) => ({
      ...leadMagnet,
      resource_url: leadMagnet.resource_type === "file" 
        ? convertToProxyUrl(leadMagnet.resource_url)
        : leadMagnet.resource_url,
      shareUrl: leadMagnet.slug ? `${SHARE_URL_BASE}${leadMagnet.slug}` : null,
    })),
  });
}

export async function POST(request: NextRequest) {
  let body: LeadMagnetPayload;

  try {
    body = (await request.json()) as LeadMagnetPayload;
  } catch (error) {
    console.error("[lead-magnets][POST] parse error", error);
    return NextResponse.json({ error: "Payload JSON invalide." }, { status: 400 });
  }

  if (
    !body ||
    typeof body.title !== "string" ||
    typeof body.description !== "string" ||
    typeof body.resourceType !== "string" ||
    typeof body.resourceUrl !== "string"
  ) {
    return NextResponse.json({ error: "Champs requis manquants." }, { status: 422 });
  }

  if (body.resourceType !== "file" && body.resourceType !== "link") {
    return NextResponse.json({ error: "`resourceType` doit être `file` ou `link`." }, { status: 422 });
  }

  const { supabase } = createApiSupabaseClient(request);
  const slug = `lm_${Math.random().toString(36).slice(2, 10)}`;

  // Check if user is authenticated using cookies from request
  // First refresh the session
  await supabase.auth.getUser();
  
  // Then get the user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError) {
    console.error("[lead-magnets][POST] auth error:", authError);
    console.error("[lead-magnets][POST] auth error details:", JSON.stringify(authError, null, 2));
  }
  
  console.log("[lead-magnets][POST] User ID:", user?.id || "anonymous");
  console.log("[lead-magnets][POST] Cookies:", request.cookies.getAll().map(c => ({ name: c.name, hasValue: !!c.value })));

  const insertPayload = {
    slug,
    title: body.title,
    description: body.description,
    resource_type: body.resourceType,
    resource_url: body.resourceUrl,
    template_id: body.templateId ?? body.resourceType,
    fields: body.fields ?? [],
    download_limit: typeof body.downloadLimit === "number" ? body.downloadLimit : DEFAULT_DOWNLOAD_LIMIT,
    tagline: body.tagline ?? "",
    cta_label: body.ctaLabel ?? DEFAULT_CTA,
    footer_note: body.footerNote ?? DEFAULT_NOTE,
    owner_id: user?.id || null, // Assign owner if authenticated, null otherwise
  };

  const { data, error } = await supabase
    .from("lead_magnets")
    .insert(insertPayload)
    .select(
      `
        id,
        slug,
        title,
        description,
        resource_type,
        resource_url,
        download_limit,
        template_id,
        fields,
        tagline,
        cta_label,
        footer_note,
        created_at
      `
    )
    .single();

  if (error) {
    console.error("[lead-magnets][POST] insert error", error);
    return NextResponse.json({ error: "Impossible d'enregistrer le lead magnet." }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      ...data,
      resource_url: data.resource_type === "file"
        ? convertToProxyUrl(data.resource_url)
        : data.resource_url,
      shareUrl: data.slug ? `${SHARE_URL_BASE}${data.slug}` : null,
      slug: data.slug,
    },
  });
}

