# 🚀 Mofu - Lead Magnet SaaS

**Mofu** est un outil SaaS ultra-simple pour freelances, coachs et créateurs de contenu qui veulent partager des lead magnets (PDF, vidéos, liens) sans créer de site web ni configurer de CRM.

## ✨ Fonctionnalités

### 🎯 **Pour les créateurs**
- ✅ Dépose un fichier ou colle un lien (Google Drive, Notion, etc.)
- ✅ Personnalise ta page de capture (titre, description, formulaire)
- ✅ Génère un lien partageable en moins de 2 minutes
- ✅ Pas besoin de compte pour tester

### 📊 **Dashboard (après inscription)**
- ✅ Gestion multi-lead magnets
- ✅ Suivi en temps réel (téléchargements, inscriptions)
- ✅ Export CSV des leads collectés
- ✅ Statistiques détaillées par lead magnet

### 🎨 **Design**
- ✅ Interface minimaliste et professionnelle
- ✅ Mobile-first
- ✅ Bibliothèque de templates de pages de capture
- ✅ Personnalisation en direct (live preview)

---

## 🛠️ Stack technique

- **Frontend** : Next.js 14 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend** : Next.js API Routes
- **Base de données** : Supabase (PostgreSQL + Row Level Security)
- **Authentification** : Supabase Auth (Email/Password)
- **Storage** : Supabase Storage (fichiers)
- **Déploiement** : Vercel (recommandé)

---

## 🚀 Installation

### Prérequis

- Node.js 18+ et npm
- Un compte [Supabase](https://supabase.com) (gratuit)

### 1. Clone le projet

```bash
git clone https://github.com/palmsquare/mofu.git
cd mofu/app
npm install
```

### 2. Configure Supabase

#### A. Crée un projet Supabase

1. Va sur [supabase.com](https://supabase.com/dashboard)
2. Crée un nouveau projet
3. Note ton **URL** et tes **API keys**

#### B. Configure les variables d'environnement

```bash
cp .env.example .env.local
```

Édite `.env.local` avec tes vraies valeurs :

```env
NEXT_PUBLIC_SUPABASE_URL=https://ton-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ta-clé-anon
SUPABASE_SERVICE_ROLE_KEY=ta-clé-service-role
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

#### C. Initialise la base de données

**Option 1 : Script automatique (recommandé)**

```bash
npm run setup:supabase
```

**Option 2 : Manuellement**

1. Va dans **SQL Editor** de ton dashboard Supabase
2. Copie-colle le contenu de `scripts/setup-supabase-manual.sql`
3. Clique sur **"Run"**

#### D. Configure l'authentification

1. **Authentication** → **Providers** → Active **Email** ✅
2. **Authentication** → **Settings** → **Email Auth** → Décoche **"Enable email confirmations"** ✅

#### E. Configure le Storage

1. **Storage** → Vérifie que le bucket `lead-magnets` existe (créé automatiquement)
2. **Storage** → `lead-magnets` → **Policies** → Ajoute ces policies :

```sql
create policy "Allow public uploads"
on storage.objects for insert
to public
with check (bucket_id = 'lead-magnets');

create policy "Allow public reads"
on storage.objects for select
to public
using (bucket_id = 'lead-magnets');
```

### 3. Lance l'application

```bash
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000) 🎉

---

## 🧪 Test du parcours utilisateur

1. **Dépose un lead magnet** (fichier ou lien)
2. **Personnalise** la page de capture
3. **Génère le lien**
4. **Crée un compte** pour accéder au dashboard
5. **Partage le lien** et collecte des leads
6. **Consulte les stats** dans le dashboard

---

## 📁 Structure du projet

```
mofu/
├── app/                          # Application Next.js
│   ├── src/
│   │   ├── app/                  # Pages et API routes
│   │   │   ├── page.tsx          # Homepage
│   │   │   ├── builder/          # Constructeur de lead magnet
│   │   │   ├── dashboard/        # Dashboard utilisateur
│   │   │   ├── login/            # Page de connexion
│   │   │   ├── signup/           # Page d'inscription
│   │   │   └── api/              # API Routes
│   │   ├── components/           # Composants React
│   │   ├── lib/                  # Utilitaires (Supabase client)
│   │   └── middleware.ts         # Protection des routes
│   ├── scripts/                  # Scripts de setup
│   └── public/                   # Assets statiques
├── supabase-migration.sql        # Script SQL pour la BDD
├── SETUP-AUTOMATIQUE.md          # Guide d'installation
└── README.md                     # Ce fichier
```

---

## 🗄️ Schéma de base de données

### Table `lead_magnets`

Stocke les lead magnets créés par les utilisateurs.

| Colonne          | Type      | Description                          |
|------------------|-----------|--------------------------------------|
| `id`             | uuid      | ID unique                            |
| `slug`           | text      | Slug pour l'URL publique             |
| `title`          | text      | Titre du lead magnet                 |
| `description`    | text      | Description                          |
| `resource_type`  | text      | Type (file, link, video, etc.)       |
| `resource_url`   | text      | URL de la ressource                  |
| `template_id`    | text      | Template de page utilisé             |
| `download_limit` | integer   | Limite de téléchargements (optionnel)|
| `fields`         | jsonb     | Champs du formulaire                 |
| `owner_id`       | uuid      | ID du créateur (null si anonyme)     |
| `created_at`     | timestamp | Date de création                     |

### Table `leads`

Stocke les leads collectés via les formulaires.

| Colonne              | Type      | Description                       |
|----------------------|-----------|-----------------------------------|
| `id`                 | uuid      | ID unique                         |
| `lead_magnet_id`     | uuid      | Référence au lead magnet          |
| `lead_magnet_slug`   | text      | Slug du lead magnet               |
| `form_data`          | jsonb     | Données du formulaire             |
| `consent_granted`    | boolean   | Consentement RGPD                 |
| `owner_id`           | uuid      | ID du propriétaire du lead magnet |
| `created_at`         | timestamp | Date de soumission                |

---

## 🔒 Sécurité

- ✅ **Row Level Security (RLS)** : Chaque utilisateur voit uniquement ses données
- ✅ **Authentification sécurisée** : Supabase Auth avec JWT
- ✅ **Upload sécurisé** : Validation des fichiers (type, taille)
- ✅ **RGPD compliant** : Consentement sur les formulaires, suppression possible

---

## 🚢 Déploiement

### Déployer sur Vercel

1. Pousse ton code sur GitHub
2. Va sur [vercel.com](https://vercel.com)
3. Importe ton repo `mofu`
4. Configure les variables d'environnement (`.env.local`)
5. Déploie ! 🚀

**Important** : Mets à jour `NEXT_PUBLIC_SITE_URL` avec ton URL de production.

---

## 📝 Commandes utiles

```bash
# Développement
npm run dev

# Setup Supabase
npm run setup:supabase

# Build pour production
npm run build

# Lancer en production
npm run start

# Linter
npm run lint
```

---

## 🎯 Roadmap

### MVP (Actuel)
- ✅ Upload de fichiers / liens externes
- ✅ Constructeur de pages de capture
- ✅ Authentification utilisateur
- ✅ Dashboard avec stats
- ✅ Export CSV des leads

### V2 (Prochainement)
- 🔄 Intégrations CRM (Brevo, HubSpot, Notion)
- 🔄 Webhooks Zapier
- 🔄 Personnalisation avancée (logo, couleurs, domaine)
- 🔄 Templates premium
- 🔄 Analytics avancés
- 🔄 Plan Pro payant (Stripe)

---

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésite pas à ouvrir une issue ou une pull request.

---

## 📄 Licence

MIT License - Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 💬 Support

- 📧 Email : support@mofu.app (à configurer)
- 🐛 Issues : [GitHub Issues](https://github.com/palmsquare/mofu/issues)
- 📖 Documentation : Voir les fichiers `SETUP-*.md`

---

## 🎉 Fait avec ❤️ par [palmsquare](https://github.com/palmsquare)

**Mofu** - Le Notion des lead magnets : simple, propre, sans jargon.

> "Crée et partage ton guide gratuit sans te casser la tête"

