import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import Link from 'next/link';
import { ExportButton } from './export-button';
import { StatsClient } from './stats-client';

export default async function LeadsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch the lead magnet
  const { data: leadMagnet } = await supabase
    .from('lead_magnets')
    .select('*')
    .eq('slug', slug)
    .eq('owner_id', user.id)
    .single();

  if (!leadMagnet) {
    redirect('/dashboard');
  }

  // Fetch leads for this magnet (only leads owned by the user)
  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('*')
    .eq('lead_magnet_slug', slug)
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (leadsError) {
    console.error('Error fetching leads:', leadsError);
  }

  // Parse form_data if it's a string (JSON)
  const parsedLeads = (leads || []).map((lead) => {
    let formData = lead.form_data;
    if (typeof formData === 'string') {
      try {
        formData = JSON.parse(formData);
      } catch (e) {
        console.error('Error parsing form_data:', e);
        formData = {};
      }
    }
    return {
      ...lead,
      form_data: formData as Record<string, unknown> | null,
    };
  });

  // Get all unique field keys from all leads
  const allFieldKeys = new Set<string>();
  parsedLeads.forEach((lead) => {
    if (lead.form_data && typeof lead.form_data === 'object') {
      Object.keys(lead.form_data).forEach((key) => allFieldKeys.add(key));
    }
  });
  const fieldKeys = Array.from(allFieldKeys);

  // Fetch analytics data
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  // Get page views and conversions (get all, not just last 14 days for lead source matching)
  const { data: pageViews, error: viewsError } = await supabase
    .from('page_views')
    .select('*')
    .eq('lead_magnet_slug', slug)
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true });
  
  // Also get last 14 days for chart
  const { data: pageViewsLast14Days } = await supabase
    .from('page_views')
    .select('*')
    .eq('lead_magnet_slug', slug)
    .eq('owner_id', user.id)
    .gte('created_at', fourteenDaysAgo.toISOString())
    .order('created_at', { ascending: true });

  if (viewsError) {
    console.error('Error fetching page views:', viewsError);
  }

  // Calculate stats (use last 14 days for display)
  const views = pageViewsLast14Days?.filter((pv) => pv.event_type === 'view').length || 0;
  const conversions = pageViewsLast14Days?.filter((pv) => pv.event_type === 'conversion').length || 0;
  const conversionRate = views > 0 ? (conversions / views) * 100 : 0;
  
  // Total stats (all time)
  const totalViews = pageViews?.filter((pv) => pv.event_type === 'view').length || 0;
  const totalConversions = pageViews?.filter((pv) => pv.event_type === 'conversion').length || 0;

  // Group by day for chart
  const dailyDataMap = new Map<string, { views: number; conversions: number }>();
  
  // Initialize last 14 days
  for (let i = 13; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    dailyDataMap.set(dateStr, { views: 0, conversions: 0 });
  }

  // Fill with actual data (use last 14 days)
  pageViewsLast14Days?.forEach((pv) => {
    const date = new Date(pv.created_at);
    const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    const dayData = dailyDataMap.get(dateStr) || { views: 0, conversions: 0 };
    
    if (pv.event_type === 'view') {
      dayData.views++;
    } else if (pv.event_type === 'conversion') {
      dayData.conversions++;
    }
    
    dailyDataMap.set(dateStr, dayData);
  });

  const dailyData = Array.from(dailyDataMap.entries()).map(([date, data]) => ({
    date,
    views: data.views,
    conversions: data.conversions,
  }));

  // Create a map of lead creation times to UTM sources for faster lookup
  const leadUtmMap = new Map<string, string>();
  parsedLeads.forEach((lead) => {
    const leadTime = new Date(lead.created_at).getTime();
    // Find conversion event closest to lead creation
    const matchingConversion = pageViews?.find((pv) => 
      pv.event_type === 'conversion' && 
      Math.abs(new Date(pv.created_at).getTime() - leadTime) < 5 * 60 * 1000
    );
    const matchingView = !matchingConversion 
      ? pageViews?.find((pv) => 
          pv.event_type === 'view' && 
          new Date(pv.created_at).getTime() <= leadTime &&
          leadTime - new Date(pv.created_at).getTime() < 24 * 60 * 60 * 1000
        )
      : null;
    leadUtmMap.set(lead.id, matchingConversion?.utm_source || matchingView?.utm_source || 'Direct');
  });

  // Get UTM sources
  const utmSources = new Map<string, number>();
  pageViews?.forEach((pv) => {
    if (pv.utm_source) {
      utmSources.set(pv.utm_source, (utmSources.get(pv.utm_source) || 0) + 1);
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block"
              >
                ← Retour au dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                {leadMagnet.title}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {parsedLeads?.length || 0} leads collectés • {totalViews} vues totales • {totalConversions} conversions totales
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href={`/c/${slug}`}
                target="_blank"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Voir la page
              </Link>
              <ExportButton leads={parsedLeads} slug={slug} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Section */}
        <div className="mb-8">
          <StatsClient
            views={views}
            conversions={conversions}
            conversionRate={conversionRate}
            dailyData={dailyData}
          />
        </div>

        {/* UTM Sources */}
        {utmSources.size > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sources de trafic</h3>
            <div className="space-y-2">
              {Array.from(utmSources.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{source}</span>
                    <span className="text-sm font-semibold text-gray-900">{count} visites</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Leads Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Leads collectés</h3>
          </div>
          {!parsedLeads || parsedLeads.length === 0 ? (
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun lead pour le moment
              </h3>
              <p className="text-gray-600">
                Partage ton lien pour commencer à collecter des leads
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    {fieldKeys.filter(key => key !== 'field-email' && key !== 'field-name' && key !== 'email' && key !== 'name').map((key) => (
                      <th
                        key={key}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {key}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {parsedLeads.map((lead) => {
                    const leadEmail = lead.lead_email || lead.form_data?.['field-email'] || lead.form_data?.['email'] || '';
                    const leadName = lead.lead_name || lead.form_data?.['field-name'] || lead.form_data?.['name'] || '';
                    const leadUtmSource = leadUtmMap.get(lead.id) || 'Direct';
                    
                    const otherFields = fieldKeys.filter(key => 
                      key !== 'field-email' && key !== 'field-name' && key !== 'email' && key !== 'name'
                    );
                    
                    return (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <Link href={`/dashboard/leads/${slug}/${lead.id}`} className="hover:text-blue-600">
                            {new Date(lead.created_at).toLocaleString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link href={`/dashboard/leads/${slug}/${lead.id}`} className="hover:text-blue-600 block">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-semibold text-indigo-600 flex-shrink-0">
                                {(leadName || leadEmail || 'L').charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{leadName || 'Sans nom'}</p>
                                <p className="text-xs text-gray-500 truncate">{leadEmail || 'Sans email'}</p>
                              </div>
                            </div>
                          </Link>
                        </td>
                        {otherFields.map((key) => (
                          <td
                            key={key}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                          >
                            <Link href={`/dashboard/leads/${slug}/${lead.id}`} className="hover:text-blue-600 block truncate max-w-xs">
                              {String(lead.form_data?.[key] || '')}
                            </Link>
                          </td>
                        ))}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <Link href={`/dashboard/leads/${slug}/${lead.id}`} className="hover:text-blue-600">
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                              {leadUtmSource}
                            </span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


