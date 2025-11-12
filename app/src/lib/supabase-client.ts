import { createBrowserClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase URL ou anon key manquante. Vérifie que NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont définies."
  );
}

export const supabaseBrowserClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    const error = `Supabase n'est pas configuré côté client. URL: ${supabaseUrl ? '✅' : '❌'}, Key: ${supabaseAnonKey ? '✅' : '❌'}`;
    console.error(error);
    throw new Error(error);
  }

  // Use @supabase/ssr for proper cookie handling that works with middleware
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
};

export const supabaseServerClient = () => {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase n'est pas configuré côté serveur.");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
};

