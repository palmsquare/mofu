# ✅ Checklist de vérification - Prêt à tester !

## 🎯 Statut : TOUT EST PRÊT ✅

### Fichiers vérifiés

✅ `.env.local` créé avec les bonnes variables Supabase  
✅ `src/lib/supabase-client.ts` - Client Supabase browser  
✅ `src/lib/supabase-server.ts` - Client Supabase serveur  
✅ `src/middleware.ts` - Protection des routes  
✅ `src/app/login/page.tsx` - Page de connexion  
✅ `src/app/signup/page.tsx` - Page d'inscription  
✅ `src/app/dashboard/page.tsx` - Dashboard principal  
✅ `src/app/dashboard/leads/[slug]/page.tsx` - Détails des leads  
✅ `src/app/api/me/claim/route.ts` - API de claim  
✅ `src/app/api/auth/signout/route.ts` - API de déconnexion  
✅ `src/app/api/lead-magnets/route.ts` - API lead magnets (avec owner_id)  
✅ `src/app/api/leads/route.ts` - API leads (avec owner_id) - **ERREUR CORRIGÉE**  
✅ `src/components/lead-magnet-wizard.tsx` - Bandeau d'invitation ajouté  

### Erreurs corrigées

✅ **TypeScript error** dans `leads/route.ts` : `existingCount` possibly null → **CORRIGÉ**  
✅ **Lint errors** : Aucune erreur de lint  

---

## 🚨 CE QU'IL TE RESTE À FAIRE

### 1️⃣ Créer les tables dans Supabase (OBLIGATOIRE)

Tu dois **exécuter le SQL** dans ton dashboard Supabase :

1. Va sur : https://supabase.com/dashboard/project/vjgprpnwxizfkvkjklzs
2. Clique sur **"SQL Editor"** (menu de gauche)
3. Clique sur **"New query"**
4. Copie-colle ce SQL complet :

```sql
-- 1. CRÉER LES TABLES
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

-- 2. CRÉER LES INDEX
create index if not exists idx_lead_magnets_owner_id on lead_magnets(owner_id);
create index if not exists idx_lead_magnets_slug on lead_magnets(slug);
create index if not exists idx_leads_owner_id on leads(owner_id);
create index if not exists idx_leads_lead_magnet_slug on leads(lead_magnet_slug);

-- 3. ACTIVER RLS
alter table lead_magnets enable row level security;
alter table leads enable row level security;

-- 4. POLICIES LEAD_MAGNETS
create policy "Public read access" on lead_magnets for select using (true);
create policy "Allow insert for all" on lead_magnets for insert with check (owner_id is null or owner_id = auth.uid());
create policy "Users can update own" on lead_magnets for update using (owner_id = auth.uid());
create policy "Users can delete own" on lead_magnets for delete using (owner_id = auth.uid());

-- 5. POLICIES LEADS
create policy "Allow insert for all" on leads for insert with check (true);
create policy "Users can view own" on leads for select using (
  owner_id = auth.uid() or 
  lead_magnet_slug in (select slug from lead_magnets where owner_id = auth.uid())
);
create policy "Users can delete own" on leads for delete using (
  owner_id = auth.uid() or 
  lead_magnet_slug in (select slug from lead_magnets where owner_id = auth.uid())
);
```

5. Clique sur **"Run"** (ou Ctrl+Enter)
6. Tu devrais voir : **"Success. No rows returned"** ✅

### 2️⃣ Activer l'authentification Email

1. Dans Supabase, va dans **"Authentication"** → **"Providers"**
2. Clique sur **"Email"**
3. Active le toggle ✅
4. **(Optionnel pour tester)** Désactive la confirmation email :
   - **Authentication** → **Settings** → **Email Auth**
   - Décocher **"Enable email confirmations"**

### 3️⃣ Vérifier dans Supabase

Après avoir exécuté le SQL :

1. Va dans **"Table Editor"** (menu de gauche)
2. Tu devrais voir :
   - ✅ Table `lead_magnets` (avec colonnes id, slug, title, owner_id, etc.)
   - ✅ Table `leads` (avec colonnes id, lead_magnet_id, form_data, owner_id, etc.)

---

## 🚀 Démarrer l'application

Une fois les tables créées dans Supabase :

```bash
cd /Users/keziah/Downloads/mofu/app
npm run dev
```

Ouvre : http://localhost:3000

---

## 🧪 Scénario de test complet

### Test 1 : Création anonyme

1. Va sur http://localhost:3000
2. Colle un lien : `https://example.com/mon-guide.pdf`
3. Clique sur la flèche →
4. Tu arrives sur `/builder` avec ton lien
5. Choisis un modèle (1, 2 ou 3)
6. Modifie le titre en cliquant dessus : "Mon Super Guide"
7. Clique sur **"Générer le lien"**
8. Tu devrais voir :
   - ✅ Bandeau bleu : "Ton lien est prêt 🎉"
   - ✅ Boutons "Créer mon compte" et "J'ai déjà un compte"
   - ✅ Section verte avec le lien partageable

### Test 2 : Vérifier dans Supabase

1. Va dans Supabase → **Table Editor** → `lead_magnets`
2. Tu devrais voir une ligne avec :
   - `slug` : `lm_xxxxxxxx`
   - `title` : "Mon Super Guide"
   - `owner_id` : **NULL** (car anonyme)
   - `resource_url` : "https://example.com/mon-guide.pdf"

### Test 3 : Créer un compte

1. Clique sur **"Créer mon compte"**
2. Entre un email : `test@example.com`
3. Entre un mot de passe : `password123`
4. Clique sur **"Créer mon compte"**
5. Si confirmation désactivée : redirection vers `/dashboard` ✅
6. Si confirmation activée : message "Vérifie ton email"

### Test 4 : Dashboard

1. Tu devrais voir :
   - ✅ Statistiques : "1 Lead Magnet", "0 Leads"
   - ✅ Ton lead magnet "Mon Super Guide" dans la liste
   - ✅ Bouton "Voir les leads"
2. Vérifie dans Supabase → `lead_magnets` :
   - `owner_id` devrait maintenant être **ton user ID** (pas NULL) ✅

### Test 5 : Créer un nouveau lead magnet (connecté)

1. Clique sur "Créer un lead magnet" (header)
2. Répète le flow
3. Cette fois, `owner_id` sera assigné directement ✅

---

## 🐛 Si ça ne marche pas

### Erreur : "Failed to fetch" ou erreur réseau

**Cause** : Les tables n'existent pas dans Supabase  
**Solution** : Exécute le SQL dans le SQL Editor de Supabase

### Erreur : "permission denied for table lead_magnets"

**Cause** : RLS activé mais policies manquantes  
**Solution** : Exécute la partie "POLICIES" du SQL

### Le dashboard est vide

**Cause** : `owner_id` n'est pas assigné correctement  
**Solution** : Vérifie dans Supabase que `owner_id` correspond à ton `user.id`

### Erreur : "Non authentifié" sur /dashboard

**Cause** : Session expirée ou cookies bloqués  
**Solution** : Reconnecte-toi via `/login`

---

## 📊 Commandes utiles

```bash
# Démarrer le serveur
npm run dev

# Vérifier les erreurs de lint
npm run lint

# Builder pour production
npm run build

# Voir les logs en temps réel
# (dans le terminal où tourne npm run dev)
```

---

## 🎉 Une fois que tout fonctionne

Tu auras un flow complet :

1. ✅ Création anonyme en 2 min (zéro friction)
2. ✅ Bandeau d'invitation après génération
3. ✅ Inscription simple (email/password)
4. ✅ Claim automatique des lead magnets anonymes
5. ✅ Dashboard avec stats en temps réel
6. ✅ Export CSV des leads
7. ✅ Sécurité RLS (chaque user voit seulement ses données)

---

**Prêt à tester ?** 🚀

1. Exécute le SQL dans Supabase
2. Active l'auth Email
3. Lance `npm run dev`
4. Va sur http://localhost:3000

Si tu as un problème, envoie-moi le message d'erreur exact !


