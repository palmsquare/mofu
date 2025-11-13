import { createSupabaseAdminClient } from './supabase-admin-client';

/**
 * Vérifie si un email, IP ou user_id est banni
 * @param type - Type de ban: 'email', 'ip', ou 'user_id'
 * @param value - Valeur à vérifier (email, IP, ou user_id)
 * @returns true si banni, false sinon
 */
export async function isBanned(type: 'email' | 'ip' | 'user_id', value: string): Promise<boolean> {
  try {
    const adminSupabase = createSupabaseAdminClient();
    
    const { data, error } = await adminSupabase
      .from('bans')
      .select('id')
      .eq('type', type)
      .eq('value', value)
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which means not banned
      console.error(`[check-ban] Error checking ban for ${type}:${value}`, error);
      return false; // En cas d'erreur, on n'interdit pas (fail open)
    }

    return !!data; // Si data existe, c'est banni
  } catch (error) {
    console.error(`[check-ban] Exception checking ban for ${type}:${value}`, error);
    return false; // En cas d'erreur, on n'interdit pas (fail open)
  }
}

/**
 * Récupère l'adresse IP depuis une requête Next.js
 */
export function getClientIP(request: Request): string | null {
  // Vérifier les headers X-Forwarded-For (utilisé par Vercel, Cloudflare, etc.)
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    // Prendre la première IP (l'IP client originale)
    return xForwardedFor.split(',')[0].trim();
  }

  // Vérifier X-Real-IP (utilisé par nginx)
  const xRealIP = request.headers.get('x-real-ip');
  if (xRealIP) {
    return xRealIP;
  }

  // Fallback sur CF-Connecting-IP (Cloudflare)
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return null;
}

