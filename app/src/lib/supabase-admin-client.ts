import { createClient } from '@supabase/supabase-js';

/**
 * Create Supabase admin client with service role key
 * This client has full access to all data (bypasses RLS)
 * Use only in server-side code (API routes)
 */
export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    const missingVars = [];
    if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!serviceRoleKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
    
    const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}. Please check your Vercel environment variables.`;
    console.error('[supabase-admin-client]', errorMessage);
    throw new Error(errorMessage);
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

