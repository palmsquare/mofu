"use client";

interface StatsClientProps {
  views: number;
  conversions: number;
  conversionRate: number;
  dailyData: Array<{ date: string; views: number; conversions: number }>;
}

export function StatsClient({ views, conversions, conversionRate, dailyData }: StatsClientProps) {
  // Get max value for scaling
  const maxValue = Math.max(
    ...dailyData.map((d) => Math.max(d.views, d.conversions)),
    1
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Vues</p>
              <p className="text-3xl font-bold text-gray-900">{views}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Conversions</p>
              <p className="text-3xl font-bold text-gray-900">{conversions}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Taux de conversion</p>
              <p className="text-3xl font-bold text-gray-900">
                {conversionRate.toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Chart - Last 14 days */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activité des 14 derniers jours</h3>
        <div className="space-y-3">
          <div className="flex items-end gap-1 h-32">
            {dailyData.map((day, index) => {
              const viewsHeight = maxValue > 0 ? (day.views / maxValue) * 100 : 0;
              const conversionsHeight = maxValue > 0 ? (day.conversions / maxValue) * 100 : 0;
              
              return (
                <div key={index} className="flex-1 flex items-end gap-0.5 group relative">
                  <div
                    className="w-full bg-blue-200 rounded-t hover:bg-blue-300 transition-colors cursor-pointer"
                    style={{ height: `${viewsHeight}%` }}
                    title={`${day.date}: ${day.views} vues, ${day.conversions} conversions`}
                  />
                  {day.conversions > 0 && (
                    <div
                      className="w-full bg-green-400 rounded-t hover:bg-green-500 transition-colors cursor-pointer"
                      style={{ height: `${conversionsHeight}%` }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{dailyData[0]?.date.split(' ')[0] || ''}</span>
            <span>{dailyData[Math.floor(dailyData.length / 2)]?.date.split(' ')[0] || ''}</span>
            <span>{dailyData[dailyData.length - 1]?.date.split(' ')[0] || ''}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-600 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-200 rounded"></div>
              <span>Vues</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded"></div>
              <span>Conversions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

