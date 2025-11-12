import { HomeHero } from "../components/home-hero";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#f6f6f9] dark:bg-black">
      <div className="pointer-events-none absolute inset-0 -z-10 mx-auto max-w-5xl blur-3xl">
        <div className="h-full w-full rounded-full bg-gradient-to-r from-indigo-300/40 via-purple-200/30 to-cyan-200/30 dark:from-indigo-900/40 dark:via-purple-800/40 dark:to-cyan-800/30" />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-16 px-4 pb-24 pt-10 sm:px-6 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-lg font-semibold text-white">
              LM
            </div>
            <div>
              <p className="text-lg font-semibold text-zinc-900 dark:text-white">LeadMagnet Studio</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-300">
                Crée et partage ton lead magnet sans friction.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-full bg-white/70 px-2 py-1 text-sm shadow-sm backdrop-blur dark:bg-white/5">
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 font-semibold text-emerald-600 dark:text-emerald-300">
              Gratuit : 1 ressource
            </span>
            <button className="rounded-full px-3 py-1 text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white">
              Mode clair/sombre
            </button>
            <button className="rounded-full bg-zinc-900 px-4 py-1.5 font-semibold text-white transition hover:bg-zinc-700 dark:bg-white dark:text-black">
              Se connecter
            </button>
          </div>
        </header>

        <main className="grid gap-20">
          <HomeHero />
          <DifferentiatorsSection />
          <PricingSection />
          <FaqSection />
        </main>

        <footer className="mt-auto flex flex-col items-center justify-between gap-4 border-t border-zinc-200/60 py-8 text-sm text-zinc-500 dark:border-white/10 dark:text-zinc-300 sm:flex-row">
          <p>© {new Date().getFullYear()} LeadMagnet Studio. Tous droits réservés.</p>
          <div className="flex gap-4">
            <a href="#rgpd" className="transition hover:text-zinc-900 dark:hover:text-white">
              Mentions légales
            </a>
            <a href="#privacy" className="transition hover:text-zinc-900 dark:hover:text-white">
              Politique de confidentialité
            </a>
            <a href="#contact" className="transition hover:text-zinc-900 dark:hover:text-white">
              Contact
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}

const differentiators = [
  {
    title: "Zéro friction",
    description: "Upload → lien partageable en moins de deux minutes. Pas d&apos;hébergement à configurer.",
  },
  {
    title: "Centré sur le lead magnet",
    description: "Pas de tunnel ou d&apos;automations inutiles : un outil laser pour capturer des emails.",
  },
  {
    title: "Design pro en un clic",
    description: "Bibliothèque de templates inspirés de Tally & Gumroad, pensés mobile-first.",
  },
  {
    title: "RGPD-ready",
    description: "Consentement explicite, suppression simple, logs de téléchargements et stockage chiffré.",
  },
];

function DifferentiatorsSection() {
  return (
    <section className="rounded-3xl border border-zinc-200 bg-white/80 p-8 shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/40">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
            Pourquoi ce produit
          </p>
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">Différenciants clés</h2>
        </div>
        <a
          href="#roadmap"
          className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-white dark:text-black"
        >
          Voir la roadmap
        </a>
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {differentiators.map((item) => (
          <div
            key={item.title}
            className="space-y-2 rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-black/60"
          >
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{item.title}</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const plans = [
  {
    name: "Gratuit sans compte",
    price: "0€",
    suffix: "/à vie",
    features: [
      "1 lead magnet publié",
      "20 Mo et 50 téléchargements inclus",
      "Lien partageable instantanément",
      "Mode clair / sombre automatique",
    ],
    cta: "Commencer maintenant",
    highlighted: false,
  },
  {
    name: "Gratuit connecté",
    price: "0€",
    suffix: "/mois",
    features: [
      "Jusqu'à 3 lead magnets",
      "Dashboard + export CSV limité",
      "Suivi temps réel des téléchargements",
      "Notifications email des nouveaux leads",
    ],
    cta: "Créer un compte",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "24€",
    suffix: "/mois",
    features: [
      "Lead magnets et téléchargements illimités",
      "Templates premium + branding avancé",
      "Intégrations Stripe, Brevo, HubSpot, Notion, Zapier",
      "Sous-domaine personnalisé & support prioritaire",
    ],
    cta: "Précommander",
    highlighted: true,
  },
];

function PricingSection() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">Tarifs</p>
        <h2 className="text-3xl font-semibold text-zinc-900 dark:text-white">Un plan pour chaque étape</h2>
        <p className="mx-auto max-w-2xl text-base text-zinc-600 dark:text-zinc-300">
          Commence sans compte, ajoute-en un pour suivre tes leads, et passe en Pro quand tu es prêt à intégrer ton
          stack marketing.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`flex flex-col gap-5 rounded-3xl border p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
              plan.highlighted
                ? "border-indigo-300 bg-white dark:border-indigo-500/40 dark:bg-indigo-500/10"
                : "border-zinc-200 bg-white dark:border-white/10 dark:bg-black/40"
            }`}
          >
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
                {plan.name}
              </p>
              <p className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-white">
                {plan.price} <span className="text-base font-normal text-zinc-500 dark:text-zinc-300">{plan.suffix}</span>
              </p>
            </div>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-indigo-500" />
                  {feature}
                </li>
              ))}
            </ul>
            <button
              className={`mt-auto rounded-full px-4 py-2 text-sm font-semibold transition ${
                plan.highlighted
                  ? "bg-indigo-600 text-white hover:bg-indigo-500"
                  : "bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-white dark:text-black"
              }`}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

const faqs = [
  {
    question: "Puis-je utiliser l'outil sans créer de compte ?",
    answer:
      "Oui. Tu peux publier un lead magnet, obtenir un lien partageable et suivre ton quota de téléchargements sans inscription.",
  },
  {
    question: "Comment sont gérées les données RGPD ?",
    answer:
      "Les emails et noms sont chiffrés avant stockage. Chaque formulaire inclut un consentement explicite et tu peux supprimer les leads à tout moment.",
  },
  {
    question: "Que débloque le plan Pro ?",
    answer:
      "Stockage et téléchargements illimités, modèles premium, personnalisation avancée, sous-domaine, intégrations natives et support prioritaire.",
  },
  {
    question: "Puis-je connecter mes outils marketing ?",
    answer:
      "Oui, via les intégrations Brevo, HubSpot, Notion et Zapier prévues dans la version Pro. Un webhook générique sera aussi disponible.",
  },
];

function FaqSection() {
  return (
    <section className="rounded-3xl border border-zinc-200 bg-white/80 p-8 shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/40">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">FAQ</p>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-white">
            Questions fréquentes des indépendants
          </h2>
        </div>
        <div className="space-y-4">
          {faqs.map((item) => (
            <details
              key={item.question}
              className="group rounded-2xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition hover:border-indigo-200 dark:border-white/10 dark:bg-black/60 dark:hover:border-indigo-500/40"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-base font-semibold text-zinc-900 transition group-open:text-indigo-600 dark:text-white">
                {item.question}
                <span className="text-sm text-indigo-500 transition group-open:rotate-45">＋</span>
              </summary>
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
