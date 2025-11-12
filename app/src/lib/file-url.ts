/**
 * Utility functions for converting Supabase Storage URLs to custom domain proxy URLs
 */

const SUPABASE_STORAGE_URL_PATTERN = /https:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\/lead-magnets\/(.+)/;

/**
 * Get site URL (server-side only)
 */
function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

/**
 * Convert Supabase Storage URL to custom domain proxy URL
 * Example: https://xxx.supabase.co/storage/v1/object/public/lead-magnets/file.jpg
 * -> https://mofu.fr/api/files/file.jpg
 */
export function convertToProxyUrl(supabaseUrl: string): string {
  if (!supabaseUrl) return supabaseUrl;

  const siteUrl = getSiteUrl();

  // If it's already a proxy URL, return as is
  if (supabaseUrl.startsWith("/api/files/") || supabaseUrl.includes("/api/files/")) {
    return supabaseUrl.startsWith("http") ? supabaseUrl : `${siteUrl}${supabaseUrl}`;
  }

  // Extract file path from Supabase URL
  const match = supabaseUrl.match(SUPABASE_STORAGE_URL_PATTERN);
  if (match && match[1]) {
    const filePath = match[1];
    return `${siteUrl}/api/files/${filePath}`;
  }

  // If it's not a Supabase URL (external link), return as is
  return supabaseUrl;
}

/**
 * Extract file path from Supabase Storage URL
 * Example: https://xxx.supabase.co/storage/v1/object/public/lead-magnets/file.jpg
 * -> file.jpg
 */
export function extractFilePath(supabaseUrl: string): string | null {
  if (!supabaseUrl) return null;

  const match = supabaseUrl.match(SUPABASE_STORAGE_URL_PATTERN);
  return match && match[1] ? match[1] : null;
}

/**
 * Create proxy URL from file path
 * Example: file.jpg -> https://mofu.fr/api/files/file.jpg
 */
export function createProxyUrl(filePath: string): string {
  if (!filePath) return filePath;
  
  const siteUrl = getSiteUrl();
  
  // Remove leading slash if present
  const cleanPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;
  return `${siteUrl}/api/files/${cleanPath}`;
}
