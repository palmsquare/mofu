import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin-client';
import { AdminDashboard } from './admin-dashboard';

export default async function AdminPage() {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Use admin client to bypass RLS and check if user is admin
  // This allows us to check admin status even if RLS policies are restrictive
  try {
    const adminSupabase = createSupabaseAdminClient();
    
    // Check if user is admin using admin client (bypasses RLS)
    const { data: adminUser, error: adminError } = await adminSupabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Log error for debugging
    if (adminError) {
      console.error('[admin/page] Admin check error:', adminError);
      console.error('[admin/page] Error code:', adminError.code);
      console.error('[admin/page] Error message:', adminError.message);
      console.error('[admin/page] User ID:', user.id);
      console.error('[admin/page] User email:', user.email);
      
      // If table doesn't exist, show a helpful error message
      if (adminError.code === '42P01' || adminError.message?.includes('does not exist')) {
        console.error('[admin/page] Table admin_users does not exist. Run supabase-admin.sql first.');
        redirect('/dashboard');
      }
      
      // If no admin user found (PGRST116 = no rows returned), redirect to dashboard
      if (adminError.code === 'PGRST116') {
        console.log('[admin/page] User is not an admin. Redirecting to dashboard.');
        redirect('/dashboard');
      }
      
      // For other errors, also redirect but log the error
      console.error('[admin/page] Unknown error. Redirecting to dashboard.');
      redirect('/dashboard');
    }

    if (!adminUser) {
      console.log('[admin/page] No admin user found. Redirecting to dashboard.');
      redirect('/dashboard');
    }
    
    console.log('[admin/page] User is admin. Access granted.');
  } catch (error) {
    console.error('[admin/page] Unexpected error:', error);
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <AdminDashboard />
    </div>
  );
}

