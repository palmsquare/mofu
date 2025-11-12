"use client";

import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { LeadMagnetWizard, type UploadSource } from "./lead-magnet-wizard";

const MAX_FREE_BYTES = 20 * 1024 * 1024;

export function BuilderClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [manualSource, setManualSource] = useState<UploadSource | null>(null);
  const [manualTitle, setManualTitle] = useState<string | undefined>(undefined);
  const [linkValue, setLinkValue] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const parsedFromQuery = useMemo(() => {
    const type = searchParams.get("source");
    const title = searchParams.get("title") ?? undefined;

    if (type === "file") {
      const name = searchParams.get("name");
      const sizeString = searchParams.get("size");
      const url = searchParams.get("url") ?? undefined;
      if (!name || !sizeString) return { source: null, title: undefined };
      const size = Number(sizeString);
      if (!Number.isFinite(size)) return { source: null, title: undefined };
      return {
        source: { type: "file", name, size, url } as UploadSource,
        title: title ?? name.replace(/\.[^/.]+$/, ""),
      };
    }

    if (type === "link") {
      const url = searchParams.get("url");
      if (!url) return { source: null, title: undefined };
      return {
        source: { type: "link", url } as UploadSource,
        title: title ?? "Lead magnet sans friction",
      };
    }

    return { source: null, title: undefined };
  }, [searchParams]);

  const activeSource = manualSource ?? parsedFromQuery.source;
  const activeTitle = manualSource ? manualTitle : parsedFromQuery.title;

  const wizardKey = useMemo(() => {
    if (!activeSource) return null;
    return activeSource.type === "file"
      ? `${activeSource.type}-${activeSource.name}-${activeSource.size}`
      : `${activeSource.type}-${activeSource.url}`;
  }, [activeSource]);

  const resetSource = () => {
    setManualSource(null);
    setManualTitle(undefined);
    setStatusMessage(null);
    router.replace("/builder", { scroll: true });
  };

  const handleFile = (file: File) => {
    if (file.size > MAX_FREE_BYTES) {
      setStatusMessage("Le fichier dépasse la limite gratuite de 20 Mo.");
      return;
    }
    setManualSource({ type: "file", name: file.name, size: file.size });
    setManualTitle(file.name.replace(/\.[^/.]+$/, ""));
    setStatusMessage(null);
    router.replace(
      `/builder?source=file&name=${encodeURIComponent(file.name)}&size=${file.size}&title=${encodeURIComponent(
        file.name.replace(/\.[^/.]+$/, "")
      )}`
    );
  };

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    handleFile(file);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    handleFile(file);
  };

  const handleLinkSubmit = () => {
    if (!linkValue.trim()) {
      setStatusMessage("Ajoute un lien valide avant de continuer.");
      return;
    }
    const trimmed = linkValue.trim();
    setManualSource({ type: "link", url: trimmed });
    setManualTitle("Lead magnet sans friction");
    setStatusMessage(null);
    setLinkValue("");
    router.replace(
      `/builder?source=link&url=${encodeURIComponent(trimmed)}&title=${encodeURIComponent(
        "Lead magnet sans friction"
      )}`
    );
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10">

      {!activeSource ? (
        <section className="space-y-8 rounded-3xl border border-dashed border-zinc-300 bg-white/80 p-10 text-center shadow-sm dark:border-white/20 dark:bg-white/5">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
            Dépose ton lead magnet pour commencer la mise en forme
          </h1>
          <p className="mx-auto max-w-2xl text-sm text-zinc-600 dark:text-zinc-300">
            Tu peux glisser un fichier, coller un lien ou relancer un nouvel upload. Nous te guiderons ensuite sur la
            personnalisation de ta page de capture.
          </p>
          <div className="mx-auto max-w-xl space-y-5">
            <label
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`flex h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-[32px] border-2 border-dashed px-6 py-12 transition ${
                isDragging
                  ? "border-indigo-500 bg-indigo-500/5"
                  : "border-zinc-300 bg-white dark:border-white/15 dark:bg-white/10"
              }`}
            >
              <input type="file" hidden ref={fileInputRef} onChange={handleFileInput} />
              <span className="rounded-full bg-zinc-900/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:bg-white/10 dark:text-zinc-200">
                Upload
              </span>
              <p className="text-lg font-medium text-zinc-800 dark:text-zinc-100">Glisse ton PDF, vidéo ou fichier zip.</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-300">Max 20 Mo sur le plan gratuit.</p>
            </label>
            <div className="rounded-[28px] border border-zinc-200 bg-zinc-50/70 p-5 dark:border-white/10 dark:bg-white/5">
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
          {statusMessage && <p className="text-sm font-medium text-red-500">{statusMessage}</p>}
        </section>
      ) : (
        <div className="space-y-10">
          {statusMessage && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-100">
              {statusMessage}
            </div>
          )}
          {wizardKey && activeSource && (
            <LeadMagnetWizard
              key={wizardKey}
              initialSource={activeSource}
              initialTitle={activeTitle}
              onResetSource={resetSource}
            />
          )}
        </div>
      )}
    </div>
  );
}

