import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white">
      <div className="pointer-events-none absolute inset-0 -z-10 mx-auto max-w-5xl blur-3xl">
        <div className="h-full w-full rounded-full bg-gradient-to-r from-indigo-300/40 via-purple-200/30 to-cyan-200/30" />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-16 px-4 pb-24 pt-10 sm:px-6 lg:px-10">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-lg font-semibold text-white">
              LM
            </div>
            <div>
              <p className="text-lg font-semibold text-zinc-900">LeadMagnet Studio</p>
              <p className="text-xs text-zinc-500">
                Crée et partage ton lead magnet sans friction.
              </p>
            </div>
          </div>
          <Link
            href="/login"
            className="rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-zinc-700"
          >
            Se connecter
          </Link>
        </header>

        {/* Hero Section */}
        <main className="flex flex-col items-center justify-center text-center gap-8 flex-1">
          <div className="space-y-6 max-w-3xl">
            <h1 className="text-5xl sm:text-6xl font-bold text-zinc-900 leading-tight">
              Crée et partage ton lead magnet
              <span className="block text-indigo-600">en 2 minutes</span>
            </h1>
            <p className="text-xl text-zinc-600 max-w-2xl mx-auto">
              Upload ton guide, personnalise ta page de capture et partage ton lead magnet sans site ni CRM.
              Pensé pour freelances, coachs et créateurs.
            </p>
            <div className="pt-4">
              <Link
                href="/try"
                className="inline-block rounded-full bg-indigo-600 px-8 py-4 text-lg font-semibold text-white transition hover:bg-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Essayer gratuitement
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 w-full max-w-4xl">
            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-zinc-900 mb-2">Zéro friction</h3>
              <p className="text-sm text-zinc-600">Upload → lien partageable en moins de deux minutes</p>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
              </div>
              <h3 className="font-semibold text-zinc-900 mb-2">Design pro</h3>
              <p className="text-sm text-zinc-600">Templates modernes pensés mobile-first</p>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-semibold text-zinc-900 mb-2">RGPD-ready</h3>
              <p className="text-sm text-zinc-600">Consentement explicite et stockage sécurisé</p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-auto flex flex-col items-center justify-between gap-4 border-t border-zinc-200/60 py-8 text-sm text-zinc-500 sm:flex-row">
          <p>© {new Date().getFullYear()} LeadMagnet Studio. Tous droits réservés.</p>
          <div className="flex gap-4">
            <a href="#rgpd" className="transition hover:text-zinc-900">
              Mentions légales
            </a>
            <a href="#privacy" className="transition hover:text-zinc-900">
              Politique de confidentialité
            </a>
            <a href="#contact" className="transition hover:text-zinc-900">
              Contact
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
