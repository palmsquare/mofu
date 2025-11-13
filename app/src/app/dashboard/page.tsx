import { redirect } from 'next/navigation';
import { createServerSupabase, getEffectiveUserId } from '@/lib/supabase-server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin-client';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { DashboardClient } from './dashboard-client';
import { QuotasDisplay } from '@/components/quotas-display';
import { AdminButtonClient } from '@/components/admin-button-client';
import { ImpersonationBanner } from '@/components/impersonation-banner';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = await createServerSupabase();

  // Check if we're in impersonation mode
  const impersonateTargetUserId = cookieStore.get('impersonate_target_user_id')?.value;
  const impersonateTargetUserEmail = cookieStore.get('impersonate_target_user_email')?.value;
  const impersonateAdminId = cookieStore.get('impersonate_admin_id')?.value;

  // Get effective user ID (target user if impersonating, otherwise current user)
  const effectiveUserId = await getEffectiveUserId();

  if (!effectiveUserId) {
    redirect('/login');
  }

  // If impersonating, we need to use the admin client to fetch data as the target user
  let user;
  let userEmail: string;
  let isImpersonating = false;
  
  if (impersonateTargetUserId && impersonateAdminId) {
    // We're impersonating - get target user info using admin client
    isImpersonating = true;
    const adminSupabase = createSupabaseAdminClient();
    const { data: targetUserData } = await adminSupabase.auth.admin.getUserById(impersonateTargetUserId);
    user = targetUserData?.user;
    userEmail = impersonateTargetUserEmail || targetUserData?.user?.email || '';
    
    if (!user) {
      redirect('/admin');
    }
  } else {
    // Normal mode - get current user
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    user = currentUser;
    userEmail = currentUser?.email || '';
    
    if (!user) {
      redirect('/login');
    }
  }

  // Use effective user ID for all queries
  const userId = effectiveUserId;
  
  // If impersonating, use admin client for data fetching
  const dataSupabase = isImpersonating ? createSupabaseAdminClient() : supabase;

  // Claim anonymous lead magnets created in the last hour (only if not impersonating)
  if (!isImpersonating) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: claimedMagnets } = await supabase
      .from('lead_magnets')
      .update({ owner_id: userId })
      .is('owner_id', null)
      .gte('created_at', oneHourAgo)
      .select();

    // Also update leads for claimed magnets
    if (claimedMagnets && claimedMagnets.length > 0) {
      const magnetSlugs = claimedMagnets.map((m) => m.slug);
      await supabase
        .from('leads')
        .update({ owner_id: userId })
        .in('lead_magnet_slug', magnetSlugs)
        .is('owner_id', null);
    }
  }

  // Fetch user's lead magnets with lead counts
  // Use left join to include lead magnets without leads
  // If impersonating, use admin client and filter by target user ID
  const { data: leadMagnets, error } = await dataSupabase
    .from('lead_magnets')
    .select(`
      *,
      leads(count)
    `)
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching lead magnets:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
  }

  // Format lead magnets to ensure consistent structure
  const allLeadMagnets = (leadMagnets || []).map(lm => ({
    ...lm,
    leads: lm.leads && lm.leads.length > 0 ? lm.leads : [{ count: 0 }],
  }));

  // Get analytics for each lead magnet (views and conversions)
  const leadMagnetsWithStats = await Promise.all(
    allLeadMagnets.map(async (lm) => {
      const { data: pageViews } = await dataSupabase
        .from('page_views')
        .select('event_type')
        .eq('lead_magnet_slug', lm.slug)
        .eq('owner_id', userId);

      const views = pageViews?.filter((pv) => pv.event_type === 'view').length || 0;
      const conversions = pageViews?.filter((pv) => pv.event_type === 'conversion').length || 0;
      const conversionRate = views > 0 ? (conversions / views) * 100 : 0;

      return {
        ...lm,
        stats: {
          views,
          conversions,
          conversionRate,
        },
      };
    })
  );

  // Check if user is admin using admin client to bypass RLS
  // Only check if not impersonating (we're already admin if impersonating)
  let isAdmin = false;
  if (!isImpersonating) {
    try {
      let adminSupabase;
      try {
        adminSupabase = createSupabaseAdminClient();
      } catch (clientError) {
        console.error('[dashboard] Failed to create admin client:', clientError);
        console.error('[dashboard] This usually means SUPABASE_SERVICE_ROLE_KEY is not set on Vercel');
        console.error('[dashboard] Check Vercel Environment Variables: Settings → Environment Variables');
        // If we can't create admin client, assume user is not admin
        isAdmin = false;
      }

      if (adminSupabase) {
        const { data: adminUser, error: adminError } = await adminSupabase
          .from('admin_users')
          .select('*')
          .eq('user_id', userId)
          .single();
      
      if (adminError) {
        console.error('[dashboard] Admin check error:', adminError);
        console.error('[dashboard] Error code:', adminError.code);
        console.error('[dashboard] Error message:', adminError.message);
        console.error('[dashboard] User ID:', user.id);
        console.error('[dashboard] User email:', user.email);
        
        // If table doesn't exist or no rows found, user is not admin
        if (adminError.code === '42P01' || adminError.code === 'PGRST116') {
          console.log('[dashboard] User is not an admin (table does not exist or no rows found)');
          isAdmin = false;
        } else {
          // For other errors, log and assume not admin
          console.error('[dashboard] Unknown error checking admin status');
          isAdmin = false;
        }
      } else {
        isAdmin = !!adminUser;
        console.log('[dashboard] Admin check result:', { isAdmin, userEmail: user.email, userId: user.id });
      }
    }
  } catch (error) {
    console.error('[dashboard] Unexpected error checking admin status:', error);
    // If error, assume user is not admin
    isAdmin = false;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Impersonation Banner */}
      {isImpersonating && impersonateTargetUserEmail && (
        <ImpersonationBanner 
          targetUserEmail={impersonateTargetUserEmail} 
          adminUserId={impersonateAdminId}
        />
      )}
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">{userEmail}</p>
            </div>
            <div className="flex items-center gap-4">
              <DashboardClient />
              {/* Client-side check (works even if server-side check fails) */}
              <AdminButtonClient />
              <form action="/api/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                >
                  Déconnexion
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quotas Display */}
        <div className="mb-8">
          <QuotasDisplay />
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Lead Magnets</p>
                <p className="text-3xl font-bold text-gray-900">
                  {leadMagnetsWithStats?.length || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Leads</p>
                <p className="text-3xl font-bold text-gray-900">
                  {leadMagnetsWithStats?.reduce(
                    (acc, lm) => acc + (lm.leads?.[0]?.count || 0),
                    0
                  ) || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Taux de conversion moyen</p>
                <p className="text-3xl font-bold text-gray-900">
                  {leadMagnetsWithStats && leadMagnetsWithStats.length > 0
                    ? (() => {
                        const magnetsWithViews = leadMagnetsWithStats.filter((lm) => lm.stats.views > 0);
                        if (magnetsWithViews.length === 0) return 0;
                        const totalRate = magnetsWithViews.reduce((acc, lm) => acc + lm.stats.conversionRate, 0);
                        return Math.round(totalRate / magnetsWithViews.length);
                      })()
                    : 0}
                  %
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Lead Magnets List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Mes Lead Magnets
            </h2>
          </div>

          {!leadMagnetsWithStats || leadMagnetsWithStats.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun lead magnet
              </h3>
              <p className="text-gray-600 mb-6">
                Crée ton premier lead magnet pour commencer à collecter des leads
              </p>
              <DashboardClient />
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {leadMagnetsWithStats.map((magnet) => (
                <div
                  key={magnet.slug}
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-900 mb-1">
                        {magnet.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {magnet.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          {magnet.resource_type === 'file' ? '📄 Fichier' : '🔗 Lien'}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(magnet.created_at).toLocaleDateString('fr-FR')}
                        </span>
                        <span>•</span>
                        <span className="font-medium text-blue-600">
                          {magnet.leads?.[0]?.count || 0} leads
                        </span>
                        {magnet.stats.views > 0 && (
                          <>
                            <span>•</span>
                            <span className="font-medium text-green-600">
                              {magnet.stats.views} vues
                            </span>
                            <span>•</span>
                            <span className="font-medium text-purple-600">
                              {magnet.stats.conversionRate.toFixed(1)}% conv.
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <Link
                        href={`/c/${magnet.slug}`}
                        target="_blank"
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Voir la page
                      </Link>
                      <Link
                        href={`/dashboard/leads/${magnet.slug}`}
                        className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        Voir les leads
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


