import { Suspense } from "react";
import { BuilderClient } from "../../components/builder-client";

function BuilderLoading() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-lg font-semibold text-white">
            LM
          </div>
          <div>
            <p className="text-lg font-semibold text-zinc-900 dark:text-white">LeadMagnet Studio</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-300">
              Personnalise ta page de capture et prépare ton lien partageable.
            </p>
          </div>
        </div>
      </header>
      <div className="space-y-8 rounded-3xl border border-dashed border-zinc-300 bg-white/80 p-10 text-center shadow-sm dark:border-white/20 dark:bg-white/5">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">Chargement...</p>
      </div>
    </div>
  );
}

export default function BuilderPage() {
  return (
    <div className="min-h-screen bg-[#f6f6f9] px-4 py-12 dark:bg-black sm:px-6 lg:px-10">
      <Suspense fallback={<BuilderLoading />}>
        <BuilderClient />
      </Suspense>
    </div>
  );
}

