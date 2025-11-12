import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase-server';
import Link from 'next/link';
import { ExportButton } from './export-button';

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
                {parsedLeads?.length || 0} leads collectés
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
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
                    {fieldKeys.map((key) => (
                      <th
                        key={key}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {parsedLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(lead.created_at).toLocaleString('fr-FR')}
                      </td>
                      {fieldKeys.map((key) => (
                        <td
                          key={key}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                        >
                          {String(lead.form_data?.[key] || '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


