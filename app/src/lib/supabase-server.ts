import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseAdminClient } from './supabase-admin-client';

export async function createServerSupabase() {
  const cookieStore = await cookies();

  // Check if we're in impersonation mode
  const impersonateTargetUserId = cookieStore.get('impersonate_target_user_id')?.value;
  const impersonateAdminId = cookieStore.get('impersonate_admin_id')?.value;

  // If impersonating, we need to create a Supabase client that uses the target user's context
  // We'll use the admin client to fetch data as the target user
  if (impersonateTargetUserId && impersonateAdminId) {
    // Create a regular client first to get the current session
    const regularClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              // The `set` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch (error) {
              // The `remove` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

    // For impersonation, we'll use the admin client to bypass RLS
    // and filter data by the target user ID manually
    // This is a workaround since we can't easily switch the session
    return regularClient;
  }

  // Normal operation - use regular client
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // The `remove` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Get the effective user ID for impersonation
 * Returns the target user ID if impersonating, otherwise returns the actual user ID
 */
export async function getEffectiveUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const impersonateTargetUserId = cookieStore.get('impersonate_target_user_id')?.value;
  
  if (impersonateTargetUserId) {
    return impersonateTargetUserId;
  }

  // Get actual user ID from session
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

// Anonymous client for public pages (bypasses auth but respects RLS)
export function createAnonymousSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });
}


