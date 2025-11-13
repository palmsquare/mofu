"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ImpersonationBannerProps {
  targetUserEmail: string;
  adminUserId?: string;
}

export function ImpersonationBanner({ targetUserEmail, adminUserId }: ImpersonationBannerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStopImpersonate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/stop-impersonate', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to stop impersonation');
      }

      const data = await response.json();
      
      // Redirect to admin dashboard
      router.push('/admin');
      router.refresh();
    } catch (error) {
      console.error('Error stopping impersonation:', error);
      alert('Erreur lors de l\'arrêt de l\'impersonation.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg
            className="w-5 h-5 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-yellow-800">
              Mode impersonation actif
            </p>
            <p className="text-xs text-yellow-600">
              Tu es connecté en tant que <strong>{targetUserEmail}</strong>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin')}
            className="text-xs text-yellow-700 hover:text-yellow-900 font-medium underline"
          >
            Retour à l'admin
          </button>
          <button
            onClick={handleStopImpersonate}
            disabled={loading}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
          >
            {loading ? 'Chargement...' : "Arrêter l'impersonation"}
          </button>
        </div>
      </div>
    </div>
  );
}

