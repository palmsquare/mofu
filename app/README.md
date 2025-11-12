## Stack & Setup

- **Framework** : Next.js 14 / App Router / TypeScript
- **UI** : Tailwind CSS
- **Backend** : API Routes + Supabase (Base de données Postgres, Auth)
- **Auth** : Supabase Auth avec email/password

### Variables d'environnement

Crée un fichier `.env.local` à la racine du dossier `app/` avec les clés fournies :

```
NEXT_PUBLIC_SUPABASE_URL=https://vjgprpnwxizfkvkjklzs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqZ3BycG53eGl6Zmt2a2prbHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NTY4OTAsImV4cCI6MjA3ODQzMjg5MH0.UYFCY3k2RKtjonisABIscd4cmzh8yBLG6g2_ujqyc2Q
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqZ3BycG53eGl6Zmt2a2prbHpzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg1Njg5MCwiZXhwIjoyMDc4NDMyODkwfQ.kcR4dAWDWi0BOvKejkoNhSdXb3erC8sjgNtmbJWB-SY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> ⚠️ La clé `SUPABASE_SERVICE_ROLE_KEY` est sensible : ne l'expose jamais côté client ou dans le dépôt.

### Démarrage

```bash
npm install
npm run dev
```

Ensuite ouvre [http://localhost:3000](http://localhost:3000).

### Configuration Supabase

#### 1. Activer l'authentification Email

Dans ton dashboard Supabase :
1. Va dans **Authentication** → **Providers**
2. Active **Email** provider
3. Configure les templates d'email si nécessaire
4. (Optionnel) Désactive la confirmation d'email pour tester plus rapidement : **Authentication** → **Settings** → **Email Auth** → décocher "Enable email confirmations"

#### 2. Créer les tables

Exécute le SQL suivant dans le **SQL Editor** de Supabase :

```sql
-- Tables de base
create table if not exists lead_magnets (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text not null,
  resource_type text not null,
  resource_url text not null,
  template_id text,
  download_limit integer,
  tagline text,
  cta_label text,
  footer_note text,
  fields jsonb not null default '[]'::jsonb,
  owner_id uuid references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  lead_magnet_id uuid references lead_magnets(id) on delete cascade,
  lead_magnet_slug text not null,
  form_data jsonb not null,
  consent_granted boolean default false,
  owner_id uuid references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now()
);

-- Index pour les performances
create index if not exists idx_lead_magnets_owner_id on lead_magnets(owner_id);
create index if not exists idx_lead_magnets_slug on lead_magnets(slug);
create index if not exists idx_leads_owner_id on leads(owner_id);
create index if not exists idx_leads_lead_magnet_slug on leads(lead_magnet_slug);
```

#### 3. Configurer Row Level Security (RLS)

Exécute le fichier `../supabase-migration.sql` dans le SQL Editor pour activer RLS et créer les policies.

Ou copie-colle ce SQL :

```sql
-- Activer RLS
ALTER TABLE lead_magnets ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policies pour lead_magnets
CREATE POLICY "Public read access" ON lead_magnets FOR SELECT USING (true);
CREATE POLICY "Allow insert for all" ON lead_magnets FOR INSERT WITH CHECK (owner_id IS NULL OR owner_id = auth.uid());
CREATE POLICY "Users can update own" ON lead_magnets FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Users can delete own" ON lead_magnets FOR DELETE USING (owner_id = auth.uid());

-- Policies pour leads
CREATE POLICY "Allow insert for all" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own leads" ON leads FOR SELECT USING (
  owner_id = auth.uid() OR 
  lead_magnet_slug IN (SELECT slug FROM lead_magnets WHERE owner_id = auth.uid())
);
CREATE POLICY "Users can delete own leads" ON leads FOR DELETE USING (
  owner_id = auth.uid() OR 
  lead_magnet_slug IN (SELECT slug FROM lead_magnets WHERE owner_id = auth.uid())
);
```

### Parcours utilisateur

#### Mode anonyme (sans compte)
1. **Homepage** (`/`) : Upload fichier ou colle un lien
2. **Builder** (`/builder`) : Personnalise ta page de capture
3. **Génération** : Obtiens ton lien partageable immédiatement
4. **Invitation** : Bandeau pour créer un compte et accéder au dashboard

#### Avec compte
1. **Signup** (`/signup`) : Crée un compte avec email/password
2. **Claim** : Les lead magnets créés anonymement sont automatiquement liés au compte
3. **Dashboard** (`/dashboard`) : Vue d'ensemble (stats, lead magnets, leads)
4. **Détails** (`/dashboard/leads/[slug]`) : Liste des leads par lead magnet + export CSV

### API Routes disponibles

- `GET /api/lead-magnets` : liste les lead magnets + leurs leads associés
- `POST /api/lead-magnets` : enregistre un lead magnet (avec `owner_id` si authentifié)
- `POST /api/leads` : enregistre un lead depuis une page de capture (quota respecté)
- `POST /api/me/claim` : lie les lead magnets anonymes récents au compte de l'utilisateur connecté
- `POST /api/auth/signout` : déconnexion

### Roadmap immédiate

- ✅ Auth (Supabase) avec email/password
- ✅ Dashboard protégé avec stats en temps réel
- ✅ Export CSV des leads
- ✅ Claim automatique des lead magnets anonymes
- 🔜 Upload Supabase Storage pour les fichiers
- 🔜 Pages publiques (slug) pour délivrer le contenu + récupérer le lead
- 🔜 Notifications email (quota atteint, nouveau lead)

### Scripts utiles

| Commande         | Description                          |
|------------------|--------------------------------------|
| `npm run dev`    | Démarre le serveur Next.js en local  |
| `npm run lint`   | Vérifie les erreurs ESLint           |

### Notes

- L’interface builder enregistre en BDD à partir du bouton « Générer le lien ».
- Actuellement, la génération accepte uniquement les ressources de type **lien** (l’upload de fichier arrive bientôt).
- Des messages de statut s’affichent directement dans le panel de personnalisation.
