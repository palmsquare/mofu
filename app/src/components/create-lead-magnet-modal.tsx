"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { useRouter } from "next/navigation";

const MAX_FREE_BYTES = 20 * 1024 * 1024; // 20 MB

interface CreateLeadMagnetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateLeadMagnetModal({ isOpen, onClose }: CreateLeadMagnetModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [linkValue, setLinkValue] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"file" | "link">("file");

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    if (file.size > MAX_FREE_BYTES) {
      setError("Le fichier dépasse la limite gratuite de 20 Mo.");
      return;
    }

    setIsUploading(true);
    setError("");
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Simulate progress (in real app, you'd use XMLHttpRequest or fetch with progress tracking)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erreur d'upload" }));
        setError(errorData.error || "Erreur lors de l'upload du fichier.");
        setIsUploading(false);
        return;
      }

      const data = await response.json();

      // Navigate to builder with file URL
      const params = new URLSearchParams();
      params.set("source", "file");
      params.set("name", file.name);
      params.set("size", String(file.size));
      params.set("url", data.metadata.url);
      params.set("title", file.name.replace(/\.[^/.]+$/, ""));

      setTimeout(() => {
        router.push(`/builder?${params.toString()}`);
        onClose();
      }, 500);
    } catch (error) {
      console.error("Upload error:", error);
      setError("Erreur réseau lors de l'upload.");
      setIsUploading(false);
    }
  };

  const handleLinkSubmit = () => {
    if (!linkValue.trim()) {
      setError("Ajoute un lien valide avant de continuer.");
      return;
    }

    const params = new URLSearchParams();
    params.set("source", "link");
    params.set("url", linkValue.trim());
    params.set("title", "Lead magnet sans friction");

    router.push(`/builder?${params.toString()}`);
    onClose();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Créer un lead magnet</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isUploading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => {
                setMode("file");
                setError("");
              }}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                mode === "file"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              disabled={isUploading}
            >
              📄 Fichier
            </button>
            <button
              onClick={() => {
                setMode("link");
                setError("");
              }}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                mode === "link"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              disabled={isUploading}
            >
              🔗 Lien externe
            </button>
          </div>

          {/* File Upload */}
          {mode === "file" && (
            <div>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                  isDragging
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-300 hover:border-gray-400"
                } ${isUploading ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}
                onClick={() => !isUploading && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileInput}
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.zip,.docx,.pptx"
                  disabled={isUploading}
                />

                {isUploading ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-900">Upload en cours...</p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500">{uploadProgress}%</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 mb-2">
                      Glisse-dépose ton fichier ici
                    </p>
                    <p className="text-sm text-gray-500 mb-4">ou clique pour sélectionner</p>
                    <p className="text-xs text-gray-400">
                      PDF, images, ZIP, DOCX, PPTX (max 20 Mo)
                    </p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Link Input */}
          {mode === "link" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Colle ton lien externe
                </label>
                <input
                  type="url"
                  value={linkValue}
                  onChange={(e) => setLinkValue(e.target.value)}
                  placeholder="https://notion.so/... ou https://drive.google.com/..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  disabled={isUploading}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Notion, Google Drive, vidéo YouTube, etc.
                </p>
              </div>
              <button
                onClick={handleLinkSubmit}
                disabled={isUploading || !linkValue.trim()}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuer
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

