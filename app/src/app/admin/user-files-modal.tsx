"use client";

import { useState, useEffect } from "react";

interface UserFile {
  id: string;
  name: string;
  size: number;
  created_at: string;
  resource_url: string;
  lead_magnet_title: string;
}

interface UserFilesModalProps {
  userId: string;
  userEmail: string;
  onClose: () => void;
  onFileDeleted: () => void;
}

export function UserFilesModal({ userId, userEmail, onClose, onFileDeleted }: UserFilesModalProps) {
  const [files, setFiles] = useState<UserFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchFiles();
  }, [userId]);

  const fetchFiles = async () => {
    try {
      // Get user's lead magnets with files
      const response = await fetch(`/api/admin/users`);
      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }
      const data = await response.json();
      const user = data.data.find((u: { id: string }) => u.id === userId);
      
      if (user) {
        // Get lead magnets for this user
        const leadMagnetsResponse = await fetch(`/api/admin/user-lead-magnets?user_id=${userId}`);
        if (leadMagnetsResponse.ok) {
          const leadMagnetsData = await leadMagnetsResponse.json();
          const fileLeadMagnets = leadMagnetsData.data.filter((lm: { resource_type: string }) => lm.resource_type === 'file');
          
          // Extract file information
          const fileList: UserFile[] = fileLeadMagnets.map((lm: any) => {
            const url = lm.resource_url;
            const match = url.match(/(\d+_[a-z0-9]+\.\w+)/);
            return {
              id: lm.id,
              name: match ? match[1] : 'Unknown',
              size: 0, // Will be fetched from storage
              created_at: lm.created_at,
              resource_url: lm.resource_url,
              lead_magnet_title: lm.title,
            };
          });
          
          setFiles(fileList);
        }
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async (filePath: string) => {
    if (!confirm('Es-tu sûr de vouloir supprimer ce fichier ? Cette action est irréversible.')) {
      return;
    }

    setDeleting(filePath);
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

      // Remove file from list
      setFiles(files.filter(f => f.resource_url !== filePath));
      onFileDeleted();
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Erreur lors de la suppression du fichier.');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Fichiers de {userEmail}</h2>
            <p className="text-sm text-gray-600 mt-1">{files.length} fichier(s)</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {files.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucun fichier trouvé.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{file.lead_magnet_title}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(file.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteFile(file.resource_url)}
                    disabled={deleting === file.resource_url}
                    className="ml-4 text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting === file.resource_url ? (
                      <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

