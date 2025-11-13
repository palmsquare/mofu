"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { UserFilesModal } from "./user-files-modal";

interface User {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  planType: string;
  quota: {
    storageLimitMB: number;
    storageUsedMB: number;
    storageRemainingMB: number;
    downloadsLimit: number;
    downloadsUsed: number;
    downloadsRemaining: number;
    leadMagnetsLimit: number;
    leadMagnetsUsed: number;
    leadMagnetsRemaining: number;
  } | null;
  stats: {
    leadMagnetsCount: number;
    downloadsCount: number;
    storageMB: number;
  };
}

interface Download {
  id: string;
  lead_magnet_slug: string;
  lead_email: string;
  lead_name: string;
  created_at: string;
  lead_magnets: {
    title: string;
    resource_type: string;
  } | null;
  owner: {
    email: string;
  } | null;
}

export function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'storage' | 'downloads'>('users');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showUserFiles, setShowUserFiles] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchDownloads();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch users:', errorData);
        throw new Error(errorData.error || 'Failed to fetch users');
      }
      const data = await response.json();
      console.log('Fetched users:', data);
      setUsers(data.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Erreur lors du chargement des utilisateurs. Vérifie la console pour plus de détails.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDownloads = async () => {
    try {
      const response = await fetch('/api/admin/downloads?limit=50');
      if (!response.ok) {
        throw new Error('Failed to fetch downloads');
      }
      const data = await response.json();
      setDownloads(data.data || []);
    } catch (error) {
      console.error('Error fetching downloads:', error);
    }
  };

  const handleImpersonate = async (userId: string) => {
    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetUserId: userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to impersonate user');
      }

      // Redirect to dashboard (handled by API response)
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error impersonating user:', error);
      alert('Erreur lors de la connexion en tant que cet utilisateur.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Es-tu sûr de vouloir supprimer ce compte utilisateur ? Cette action est irréversible.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }

      // Refresh users list
      fetchUsers();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Erreur lors de la suppression du compte.');
    }
  };

  const handleDeleteFile = async (filePath: string) => {
    if (!confirm('Es-tu sûr de vouloir supprimer ce fichier ? Cette action est irréversible.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/files', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete file');
      }

      // Refresh users list to update storage
      fetchUsers();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Erreur lors de la suppression du fichier.');
    }
  };

  // Calculate total storage
  const totalStorage = users.reduce((sum, user) => sum + user.stats.storageMB, 0);
  const totalUsers = users.length;
  const totalDownloads = users.reduce((sum, user) => sum + user.stats.downloadsCount, 0);
  const totalLeadMagnets = users.reduce((sum, user) => sum + user.stats.leadMagnetsCount, 0);

  // Filter downloads by user if selected
  const filteredDownloads = selectedUserId
    ? downloads.filter(d => d.owner?.email === users.find(u => u.id === selectedUserId)?.email)
    : downloads;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Gestion des utilisateurs et du stockage</p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                ← Retour au dashboard
              </Link>
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
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Utilisateurs</p>
                <p className="text-3xl font-bold text-gray-900">{totalUsers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Stockage total</p>
                <p className="text-3xl font-bold text-gray-900">{totalStorage.toFixed(1)} Mo</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Téléchargements</p>
                <p className="text-3xl font-bold text-gray-900">{totalDownloads}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Lead Magnets</p>
                <p className="text-3xl font-bold text-gray-900">{totalLeadMagnets}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('users')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'users'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Utilisateurs
              </button>
              <button
                onClick={() => setActiveTab('storage')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'storage'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Stockage
              </button>
              <button
                onClick={() => setActiveTab('downloads')}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === 'downloads'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Logs de téléchargement
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'users' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stockage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Téléchargements
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lead Magnets
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date de création
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                          <div className="flex flex-col items-center gap-2">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <p className="text-sm font-medium">Aucun utilisateur trouvé</p>
                            <p className="text-xs text-gray-400">Les utilisateurs apparaîtront ici une fois qu'ils auront créé un compte.</p>
                            <button
                              onClick={fetchUsers}
                              className="mt-2 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                            >
                              Actualiser
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.planType === 'pro' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.planType === 'pro' ? 'Pro' : 'Gratuit'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.quota ? (
                            <div>
                              <div className="flex items-center gap-2">
                                <span>{user.stats.storageMB.toFixed(1)} Mo</span>
                                <span className="text-gray-400">/</span>
                                <span>{user.quota.storageLimitMB === Infinity ? '∞' : `${user.quota.storageLimitMB} Mo`}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                <div
                                  className={`h-1 rounded-full ${
                                    user.quota.storageUsedMB / user.quota.storageLimitMB > 0.9
                                      ? 'bg-red-500'
                                      : user.quota.storageUsedMB / user.quota.storageLimitMB > 0.75
                                      ? 'bg-orange-500'
                                      : 'bg-green-500'
                                  }`}
                                  style={{
                                    width: `${Math.min((user.quota.storageUsedMB / user.quota.storageLimitMB) * 100, 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.quota ? (
                            <span>{user.stats.downloadsCount} / {user.quota.downloadsLimit === Infinity ? '∞' : user.quota.downloadsLimit}</span>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.quota ? (
                            <span>{user.stats.leadMagnetsCount} / {user.quota.leadMagnetsLimit === Infinity ? '∞' : user.quota.leadMagnetsLimit}</span>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleImpersonate(user.id)}
                              className="text-indigo-600 hover:text-indigo-900 font-medium"
                            >
                              Se connecter en tant que
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'storage' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Monitoring du stockage</h3>
                  <div className="text-sm text-gray-600">
                    Total: <span className="font-semibold">{totalStorage.toFixed(1)} Mo</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Utilisateur
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stockage utilisé
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Limite
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pourcentage
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users
                        .sort((a, b) => b.stats.storageMB - a.stats.storageMB)
                        .map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.stats.storageMB.toFixed(1)} Mo
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.quota?.storageLimitMB === Infinity ? '∞' : `${user.quota?.storageLimitMB || 0} Mo`}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.quota ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-32 bg-gray-200 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full ${
                                        (user.quota.storageUsedMB / user.quota.storageLimitMB) * 100 > 90
                                          ? 'bg-red-500'
                                          : (user.quota.storageUsedMB / user.quota.storageLimitMB) * 100 > 75
                                          ? 'bg-orange-500'
                                          : 'bg-green-500'
                                      }`}
                                      style={{
                                        width: `${Math.min((user.quota.storageUsedMB / user.quota.storageLimitMB) * 100, 100)}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {((user.quota.storageUsedMB / user.quota.storageLimitMB) * 100).toFixed(1)}%
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-400">N/A</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => setShowUserFiles(user.id)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Voir fichiers
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'downloads' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Logs de téléchargement</h3>
                  <div className="flex items-center gap-4">
                    <select
                      value={selectedUserId || ''}
                      onChange={(e) => setSelectedUserId(e.target.value || null)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="">Tous les utilisateurs</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.email}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={fetchDownloads}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                      Actualiser
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Utilisateur
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Lead Magnet
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email du lead
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nom du lead
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredDownloads.map((download) => (
                        <tr key={download.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(download.created_at).toLocaleString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {download.owner?.email || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {download.lead_magnets?.title || download.lead_magnet_slug}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {download.lead_email || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {download.lead_name || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredDownloads.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Aucun téléchargement trouvé.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* User Files Modal */}
      {showUserFiles && (
        <UserFilesModal
          userId={showUserFiles}
          userEmail={users.find(u => u.id === showUserFiles)?.email || ''}
          onClose={() => setShowUserFiles(null)}
          onFileDeleted={() => {
            fetchUsers();
            setShowUserFiles(null);
          }}
        />
      )}
    </div>
  );
}

