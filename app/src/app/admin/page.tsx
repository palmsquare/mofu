import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import { AdminDashboard } from './admin-dashboard';

export default async function AdminPage() {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is admin
  const { data: adminUser, error: adminError } = await supabase
    .from('admin_users')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (adminError || !adminUser) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <AdminDashboard />
    </div>
  );
}

