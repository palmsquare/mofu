"use client";

import { useRouter } from "next/navigation";
import { ChangeEvent, DragEvent, useRef, useState } from "react";

const MAX_FREE_BYTES = 20 * 1024 * 1024;

export function HomeHero() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [linkValue, setLinkValue] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const navigateToBuilder = (params: URLSearchParams) => {
    const query = params.toString();
    router.push(`/builder?${query}`);
  };

  const handleFile = async (file: File) => {
    if (file.size > MAX_FREE_BYTES) {
      setStatusMessage("Le fichier dépasse la limite gratuite de 20 Mo.");
      return;
    }

    setIsUploading(true);
    setStatusMessage("Upload en cours...");

    try {
      // Upload file to API
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Erreur d'upload" }));
        setStatusMessage(errorData.error || "Erreur lors de l'upload du fichier.");
        setIsUploading(false);
        return;
      }

      const data = await response.json();

      // Navigate to builder with file URL
      const params = new URLSearchParams();
      params.set("source", "file");
      params.set("name", file.name);
      params.set("size", String(file.size));
      params.set("url", data.metadata.url); // URL from Supabase Storage
      params.set("title", file.name.replace(/\.[^/.]+$/, ""));
      navigateToBuilder(params);
    } catch (error) {
      console.error("Upload error:", error);
      setStatusMessage("Erreur réseau lors de l'upload.");
      setIsUploading(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    handleFile(file);
  };

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    handleFile(file);
  };

  const handleLinkSubmit = () => {
    if (!linkValue.trim()) {
      setStatusMessage("Ajoute un lien valide avant de continuer.");
      return;
    }
    const cleaned = linkValue.trim();
    const params = new URLSearchParams();
    params.set("source", "link");
    params.set("url", cleaned);
    params.set("title", "Lead magnet sans friction");
    navigateToBuilder(params);
    setLinkValue("");
  };

  return (
    <section className="relative isolate overflow-hidden rounded-[48px] border border-zinc-200/60 bg-white/90 px-6 py-16 text-center shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5 sm:px-12 lg:px-20">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-60 w-[90%] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-300/40 via-purple-200/40 to-cyan-200/40 blur-3xl dark:from-indigo-900/30 dark:via-purple-800/30 dark:to-cyan-800/30" />
      <span className="mx-auto inline-flex items-center justify-center rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-200">
        LeadMagnet Studio
      </span>
      <h1 className="mt-6 text-4xl font-semibold tracking-[-0.04em] text-zinc-900 dark:text-white sm:text-5xl lg:text-6xl">
        Partage ton lead magnet sans créer de site
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-300">
        Dépose un fichier ou un lien, personnalise ta page de capture, génère un lien unique et collecte des leads dans
        un dashboard simple. Plan gratuit accessible sans inscription.
      </p>

      <div className="mx-auto mt-10 flex max-w-xl flex-col gap-5">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[32px] border-2 border-dashed px-6 py-12 transition ${
            isDragging
              ? "border-indigo-500 bg-indigo-500/5"
              : isUploading
              ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20"
              : "border-zinc-300 bg-white dark:border-white/15 dark:bg-white/10"
          }`}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            hidden
            onChange={handleFileInput}
            accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.zip,.pptx,.docx"
            disabled={isUploading}
          />
          <span className="rounded-full bg-zinc-900/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:bg-white/10 dark:text-zinc-200">
            {isUploading ? "Upload..." : "Upload"}
          </span>
          <p className="text-lg font-medium text-zinc-800 dark:text-zinc-100">
            {isUploading ? "Upload en cours..." : "Glisse ton PDF, vidéo ou fichier zip."}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-300">Max 20 Mo sur le plan gratuit.</p>
        </div>

        <div className="rounded-[28px] border border-zinc-200 bg-zinc-50/70 p-4 dark:border-white/10 dark:bg-white/5">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-200">Ou colle un lien existant</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              type="url"
              value={linkValue}
              onChange={(event) => setLinkValue(event.target.value)}
              placeholder="https://notion.so/ton-guide"
              className="flex-1 rounded-full border border-transparent bg-white px-4 py-3 text-sm text-zinc-800 outline-none ring-2 ring-transparent transition focus:ring-indigo-500 dark:bg-black/60 dark:text-white"
            />
            <button
              type="button"
              onClick={handleLinkSubmit}
              className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              Utiliser
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-6 flex max-w-xl flex-col gap-3 text-sm text-zinc-500 dark:text-zinc-300">
        <p>• Aucun compte requis pour démarrer</p>
        <p>• Collecte conforme RGPD avec consentement intégré</p>
        <p>• Lien prêt à partager en moins de 2 minutes</p>
      </div>

      {statusMessage && (
        <p className="mt-6 text-sm font-medium text-red-500" role="status">
          {statusMessage}
        </p>
      )}
    </section>
  );
}

