import Link from "next/link";

export default function BuilderNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#f6f6f9] px-6 text-center dark:bg-black">
      <div className="rounded-full border border-indigo-200 bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/20 dark:text-indigo-200">
        Constructeur
      </div>
      <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white">Aucun lead magnet détecté</h1>
      <p className="max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
        Retourne sur la page d&apos;accueil pour déposer un fichier ou coller un lien. Nous te redirigerons ensuite
        automatiquement vers le constructeur afin de personnaliser ta page de capture.
      </p>
      <Link href="/" className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}

