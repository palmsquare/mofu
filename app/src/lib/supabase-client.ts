import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase URL ou anon key manquante. Vérifie que NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont définies."
  );
}

let cachedBrowserClient: SupabaseClient | null = null;

export const supabaseBrowserClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    const error = `Supabase n'est pas configuré côté client. URL: ${supabaseUrl ? '✅' : '❌'}, Key: ${supabaseAnonKey ? '✅' : '❌'}`;
    console.error(error);
    throw new Error(error);
  }

  if (!cachedBrowserClient) {
    try {
      cachedBrowserClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (error) {
      console.error("Erreur lors de la création du client Supabase:", error);
      throw new Error("Impossible de créer le client Supabase. Vérifie tes variables d'environnement.");
    }
  }

  return cachedBrowserClient;
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

