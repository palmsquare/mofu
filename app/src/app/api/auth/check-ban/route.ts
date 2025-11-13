import { NextResponse, NextRequest } from "next/server";
import { isBanned, getClientIP } from "../../../../lib/check-ban";

/**
 * API route to check if an email or IP is banned
 * Used by signup/login pages before attempting authentication
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: "Email requis." }, { status: 400 });
    }

    // Check for banned emails
    const emailBanned = await isBanned('email', email);

    // Check for banned IPs
    const clientIP = getClientIP(request);
    const ipBanned = clientIP ? await isBanned('ip', clientIP) : false;

    if (emailBanned || ipBanned) {
      return NextResponse.json({ 
        banned: true,
        reason: emailBanned ? 'email' : 'ip',
        message: "Accès refusé." 
      }, { status: 403 });
    }

    return NextResponse.json({ banned: false });
  } catch (error) {
    console.error("[auth/check-ban][POST] error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

