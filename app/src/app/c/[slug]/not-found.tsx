import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-white dark:from-black dark:to-zinc-900 flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-white">404</h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-300">Lead magnet introuvable</p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Ce lead magnet n'existe pas ou a été supprimé.
        </p>
        <Link
          href="/"
          className="inline-block mt-6 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}

