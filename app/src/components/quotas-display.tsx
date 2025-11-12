"use client";

import { useEffect, useState } from "react";
import { QuotaUsage } from "@/lib/quotas";

export function QuotasDisplay() {
  const [usage, setUsage] = useState<QuotaUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuotas = async () => {
      try {
        const response = await fetch("/api/quotas");
        if (!response.ok) {
          throw new Error("Impossible de récupérer les quotas.");
        }
        const data = await response.json();
        setUsage(data.data);
      } catch (err) {
        console.error("Error fetching quotas:", err);
        setError("Erreur lors du chargement des quotas.");
      } finally {
        setLoading(false);
      }
    };

    fetchQuotas();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !usage) {
    return null;
  }

  const getUsageColor = (percent: number) => {
    if (percent >= 90) return "bg-red-500";
    if (percent >= 75) return "bg-orange-500";
    if (percent >= 50) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getUsageTextColor = (percent: number) => {
    if (percent >= 90) return "text-red-600";
    if (percent >= 75) return "text-orange-600";
    if (percent >= 50) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Quotas</h3>
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">
          Plan {usage.planType === 'free' ? 'Gratuit' : 'Pro'}
        </span>
      </div>

      <div className="space-y-4">
        {/* Storage Quota */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Stockage</span>
            <span className={`text-sm font-semibold ${getUsageTextColor(usage.storageUsagePercent)}`}>
              {usage.storageUsedMB.toFixed(1)} / {usage.storageLimitMB === Infinity ? '∞' : `${usage.storageLimitMB} Mo`}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${getUsageColor(usage.storageUsagePercent)}`}
              style={{ width: `${Math.min(usage.storageUsagePercent, 100)}%` }}
            />
          </div>
          {usage.storageRemainingMB < 10 && usage.storageLimitMB !== Infinity && (
            <p className="text-xs text-orange-600 mt-1">
              Il te reste {usage.storageRemainingMB.toFixed(1)} Mo
            </p>
          )}
        </div>

        {/* Downloads Quota */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Téléchargements</span>
            <span className={`text-sm font-semibold ${getUsageTextColor(usage.downloadsUsagePercent)}`}>
              {usage.downloadsUsed} / {usage.downloadsLimit === Infinity ? '∞' : `${usage.downloadsLimit}`}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${getUsageColor(usage.downloadsUsagePercent)}`}
              style={{ width: `${Math.min(usage.downloadsUsagePercent, 100)}%` }}
            />
          </div>
          {usage.downloadsRemaining < 5 && usage.downloadsLimit !== Infinity && (
            <p className="text-xs text-orange-600 mt-1">
              Il te reste {usage.downloadsRemaining} téléchargements
            </p>
          )}
        </div>

        {/* Lead Magnets Quota */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Pages de capture</span>
            <span className={`text-sm font-semibold ${getUsageTextColor(usage.leadMagnetsUsagePercent)}`}>
              {usage.leadMagnetsUsed} / {usage.leadMagnetsLimit === Infinity ? '∞' : `${usage.leadMagnetsLimit}`}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${getUsageColor(usage.leadMagnetsUsagePercent)}`}
              style={{ width: `${Math.min(usage.leadMagnetsUsagePercent, 100)}%` }}
            />
          </div>
          {usage.leadMagnetsRemaining === 0 && usage.leadMagnetsLimit !== Infinity && (
            <p className="text-xs text-red-600 mt-1">
              Limite atteinte. Passe au plan Pro pour créer plus de pages.
            </p>
          )}
        </div>
      </div>

      {/* Upgrade CTA (if free plan and near limits) */}
      {usage.planType === 'free' && (
        <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
          <p className="text-xs text-indigo-900 font-medium mb-1">
            Limites atteintes ?
          </p>
          <p className="text-xs text-indigo-700">
            Le plan Pro arrive bientôt avec des limites illimitées.
          </p>
        </div>
      )}
    </div>
  );
}

