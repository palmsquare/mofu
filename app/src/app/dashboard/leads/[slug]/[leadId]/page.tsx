import { redirect, notFound } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import Link from 'next/link';

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ slug: string; leadId: string }>;
}) {
  const { slug, leadId } = await params;
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch the lead
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .eq('lead_magnet_slug', slug)
    .eq('owner_id', user.id)
    .single();

  if (leadError || !lead) {
    notFound();
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

  // Parse form_data
  let formData = lead.form_data;
  if (typeof formData === 'string') {
    try {
      formData = JSON.parse(formData);
    } catch (e) {
      formData = {};
    }
  }

  // Get lead activity for this lead magnet (all activity)
  // Note: We can't track individual lead visits, so we show all activity for the lead magnet
  const { data: activity } = await supabase
    .from('page_views')
    .select('*')
    .eq('lead_magnet_slug', slug)
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  // Calculate lead score (based on lead magnet engagement and lead age)
  const leadAge = Math.floor((Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24)); // days
  const totalViews = activity?.filter((a) => a.event_type === 'view').length || 0;
  const totalConversions = activity?.filter((a) => a.event_type === 'conversion').length || 0;
  
  // Score calculation: base score from conversion, bonus from views, penalty from age
  let score = 50; // Base score
  if (totalConversions > 0) score += 30; // Conversion bonus
  if (totalViews > 10) score += 20; // High views bonus
  if (leadAge < 7) score += 10; // Recent lead bonus
  if (leadAge > 30) score -= 20; // Old lead penalty
  if (lead.consent_granted) score += 10; // Consent bonus
  
  score = Math.max(0, Math.min(100, score));
  const scoreLabel = score < 25 ? 'Cold' : score < 50 ? 'Warm' : score < 75 ? 'Hot' : 'Very Hot';
  
  // Get unique days with activity
  const activeDays = activity
    ? new Set(activity.map((a) => new Date(a.created_at).toDateString())).size
    : 0;

  // Get email and name from form data
  const leadEmail = lead.lead_email || formData?.['field-email'] || formData?.['email'] || '';
  const leadName = lead.lead_name || formData?.['field-name'] || formData?.['name'] || '';

  // Get UTM source from first view
  const firstView = activity?.find((a) => a.event_type === 'view');
  const utmSource = firstView?.utm_source || 'Direct';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href={`/dashboard/leads/${slug}`}
                className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block"
              >
                ← Retour aux leads
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{leadName || leadEmail || 'Lead'}</h1>
              <p className="text-sm text-gray-600 mt-1">{leadEmail}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lead Scoring */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead Scoring</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Score</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {score}/100 ({scoreLabel})
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        score < 25
                          ? 'bg-blue-500'
                          : score < 50
                          ? 'bg-yellow-500'
                          : score < 75
                          ? 'bg-orange-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{totalViews}</p>
                    <p className="text-xs text-gray-600">Vues totales</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{totalConversions}</p>
                    <p className="text-xs text-gray-600">Conversions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{activeDays}</p>
                    <p className="text-xs text-gray-600">Jours actifs</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Activité récente</h2>
                <span className="text-xs text-gray-500">Dernière mise à jour: {new Date().toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="space-y-6">
                {activity && activity.length > 0 ? (
                  <>
                    {/* Recent Conversions */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Conversions ({totalConversions})</h3>
                      <div className="space-y-2">
                        {activity
                          .filter((e) => e.event_type === 'conversion')
                          .slice(0, 5)
                          .map((event) => (
                            <div key={event.id} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">Nouvelle conversion</p>
                                <p className="text-xs text-gray-600">via {leadMagnet.slug}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(event.created_at).toLocaleString('fr-FR')}
                                </p>
                              </div>
                            </div>
                          ))}
                        {activity.filter((e) => e.event_type === 'conversion').length === 0 && (
                          <p className="text-sm text-gray-500">Aucune conversion récente</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Recent Views */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Vues récentes ({totalViews})</h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {activity
                          .filter((e) => e.event_type === 'view')
                          .slice(0, 10)
                          .map((event) => (
                            <div key={event.id} className="flex items-start gap-3 p-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 rounded">
                              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-600">
                                  {event.referer ? (
                                    <>
                                      via <span className="font-medium">{new URL(event.referer).hostname}</span>
                                      {event.utm_source && (
                                        <span className="ml-2 text-xs text-gray-500">({event.utm_source})</span>
                                      )}
                                    </>
                                  ) : (
                                    'Direct'
                                  )}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(event.created_at).toLocaleString('fr-FR')}
                                </p>
                              </div>
                            </div>
                          ))}
                        {activity.filter((e) => e.event_type === 'view').length === 0 && (
                          <p className="text-sm text-gray-500">Aucune vue récente</p>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-600">Aucune activité récente</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Détails</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Email</p>
                  <p className="text-sm font-medium text-gray-900">{leadEmail || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Nom</p>
                  <p className="text-sm font-medium text-gray-900">{leadName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Date de création</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(lead.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Source UTM</p>
                  <p className="text-sm font-medium text-gray-900">{utmSource}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Consentement</p>
                  <p className="text-sm font-medium text-gray-900">
                    {lead.consent_granted ? '✅ Accordé' : '❌ Non accordé'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Données du formulaire</h2>
              <div className="space-y-3">
                {formData && typeof formData === 'object' ? (
                  Object.entries(formData).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-xs text-gray-600 mb-1">{key}</p>
                      <p className="text-sm font-medium text-gray-900">{String(value || 'N/A')}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-600">Aucune donnée</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

