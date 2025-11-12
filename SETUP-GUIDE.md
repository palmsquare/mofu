# Guide de Configuration - Lead Magnet SaaS

## ✅ Ce qui a été implémenté

### 1. Système d'authentification complet
- ✅ Pages de connexion (`/login`) et inscription (`/signup`)
- ✅ Middleware Supabase pour gérer les sessions
- ✅ Protection automatique des routes `/dashboard/*`
- ✅ Déconnexion via `/api/auth/signout`

### 2. Dashboard utilisateur
- ✅ Vue d'ensemble avec statistiques (lead magnets, leads, taux de conversion)
- ✅ Liste des lead magnets avec nombre de leads
- ✅ Page détaillée par lead magnet (`/dashboard/leads/[slug]`)
- ✅ Export CSV des leads
- ✅ Accès protégé (redirection vers `/login` si non authentifié)

### 3. Gestion des lead magnets anonymes
- ✅ Création sans compte (owner_id = null)
- ✅ API `/api/me/claim` pour lier les lead magnets anonymes au compte après inscription
- ✅ Bandeau d'invitation après génération du lien

### 4. Base de données avec RLS
- ✅ Colonne `owner_id` ajoutée aux tables `lead_magnets` et `leads`
- ✅ Policies RLS pour sécuriser l'accès aux données
- ✅ Index pour optimiser les performances
- ✅ Script SQL de migration (`supabase-migration.sql`)

### 5. UX améliorée
- ✅ Bandeau "Créer un compte" après génération du lien
- ✅ Flow fluide : anonyme → création → invitation → inscription → dashboard
- ✅ Claim automatique des lead magnets lors de l'inscription

---

## 🚀 Configuration requise

### Étape 1 : Créer le fichier `.env.local`

Dans le dossier `/app`, crée un fichier `.env.local` avec :

```env
NEXT_PUBLIC_SUPABASE_URL=https://vjgprpnwxizfkvkjklzs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqZ3BycG53eGl6Zmt2a2prbHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NTY4OTAsImV4cCI6MjA3ODQzMjg5MH0.UYFCY3k2RKtjonisABIscd4cmzh8yBLG6g2_ujqyc2Q
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqZ3BycG53eGl6Zmt2a2prbHpzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg1Njg5MCwiZXhwIjoyMDc4NDMyODkwfQ.kcR4dAWDWi0BOvKejkoNhSdXb3erC8sjgNtmbJWB-SY
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Étape 2 : Configurer Supabase

#### A. Activer l'authentification Email

1. Va sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionne ton projet : `vjgprpnwxizfkvkjklzs`
3. **Authentication** → **Providers** → Active **Email**
4. (Optionnel pour tester) **Authentication** → **Settings** → **Email Auth** → Décocher "Enable email confirmations"

#### B. Exécuter le SQL de migration

1. Va dans **SQL Editor** de Supabase
2. Copie-colle le contenu du fichier `supabase-migration.sql`
3. Clique sur **Run** pour exécuter

Cela va :
- Ajouter les colonnes `owner_id` aux tables
- Créer les index de performance
- Activer Row Level Security (RLS)
- Créer les policies d'accès

### Étape 3 : Démarrer l'application

```bash
cd app
npm install  # Si pas déjà fait
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000)

---

## 🧪 Tester le flow complet

### Scénario 1 : Utilisateur anonyme

1. **Homepage** : Va sur `http://localhost:3000`
2. **Upload** : Dépose un fichier ou colle un lien (ex: `https://example.com/guide.pdf`)
3. **Builder** : Tu es redirigé vers `/builder` avec ton lead magnet
4. **Personnalise** : 
   - Choisis un modèle (1, 2 ou 3)
   - Modifie le titre, description, champs en cliquant directement dans l'aperçu
   - Ajoute une image si le modèle le supporte
5. **Génère** : Clique sur "Générer le lien"
6. **Résultat** : 
   - Tu vois le bandeau "Ton lien est prêt 🎉"
   - Le lien partageable s'affiche (ex: `https://lead.plus/lm_abc123`)
   - Un bandeau t'invite à créer un compte

### Scénario 2 : Créer un compte

1. Clique sur **"Créer mon compte"** dans le bandeau
2. Entre ton email et mot de passe (min 6 caractères)
3. Si la confirmation email est désactivée : redirection automatique vers `/dashboard`
4. Si activée : vérifie ton email puis clique sur le lien de confirmation

### Scénario 3 : Dashboard

1. **Vue d'ensemble** : Tu vois tes stats (lead magnets, leads, taux de conversion)
2. **Liste** : Tous tes lead magnets s'affichent (y compris ceux créés anonymement)
3. **Détails** : Clique sur "Voir les leads" pour un lead magnet spécifique
4. **Export** : Clique sur "Exporter CSV" pour télécharger les leads

### Scénario 4 : Créer un nouveau lead magnet (connecté)

1. Depuis le dashboard, clique sur "Créer un lead magnet"
2. Répète le flow de création
3. Cette fois, `owner_id` sera automatiquement assigné à ton compte

---

## 📊 Structure de la base de données

### Table `lead_magnets`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | ID unique |
| `slug` | text | Slug pour l'URL publique (ex: `lm_abc123`) |
| `title` | text | Titre du lead magnet |
| `description` | text | Description |
| `resource_type` | text | `file` ou `link` |
| `resource_url` | text | URL du fichier ou lien externe |
| `template_id` | text | ID du modèle choisi |
| `download_limit` | integer | Limite de téléchargements (0 = illimité) |
| `tagline` | text | Tagline affiché sur la page |
| `cta_label` | text | Texte du bouton CTA |
| `footer_note` | text | Note de réassurance |
| `fields` | jsonb | Champs du formulaire |
| `owner_id` | uuid | ID de l'utilisateur (null si anonyme) |
| `created_at` | timestamp | Date de création |

### Table `leads`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid | ID unique |
| `lead_magnet_id` | uuid | Référence au lead magnet |
| `lead_magnet_slug` | text | Slug du lead magnet (pour requêtes) |
| `form_data` | jsonb | Données du formulaire (nom, email, etc.) |
| `consent_granted` | boolean | Consentement RGPD |
| `owner_id` | uuid | ID de l'utilisateur (null si anonyme) |
| `created_at` | timestamp | Date de soumission |

---

## 🔒 Sécurité (RLS Policies)

### Lead Magnets

- **Public read** : Tout le monde peut lire (pour les pages publiques)
- **Insert** : Tout le monde peut créer (anonyme ou authentifié)
- **Update/Delete** : Seulement le propriétaire (`owner_id = auth.uid()`)

### Leads

- **Insert** : Tout le monde peut soumettre un lead
- **Select** : Seulement les leads de tes lead magnets
- **Delete** : Seulement les leads de tes lead magnets

---

## 🐛 Dépannage

### Erreur : "Non authentifié" sur le dashboard

- Vérifie que tu es bien connecté (cookie de session)
- Vérifie que le middleware est actif (`src/middleware.ts`)
- Vérifie les variables d'environnement

### Les lead magnets anonymes ne sont pas "claimed"

- Vérifie que `/api/me/claim` est appelé après l'inscription
- Regarde les logs de la console (Network tab)
- Vérifie que `created_at` du lead magnet est dans l'heure précédant l'inscription

### Erreur RLS "permission denied"

- Vérifie que les policies sont bien créées dans Supabase
- Vérifie que `owner_id` est correctement assigné
- Utilise le SQL Editor pour tester : `SELECT * FROM lead_magnets WHERE owner_id = auth.uid();`

### Le dashboard est vide

- Vérifie que tu as créé des lead magnets avec ce compte
- Vérifie que `owner_id` correspond à ton `user.id`
- Regarde les logs de la console pour les erreurs API

---

## 📝 Prochaines étapes

### À court terme
- [ ] Créer les pages publiques `/c/[slug]` pour afficher les lead magnets
- [ ] Implémenter l'upload réel de fichiers vers Supabase Storage
- [ ] Ajouter les notifications email (quota atteint, nouveau lead)

### À moyen terme
- [ ] Système de paiement (Stripe) pour le plan Pro
- [ ] Intégrations (Brevo, HubSpot, Zapier)
- [ ] Personnalisation avancée (logo, couleurs, sous-domaine)
- [ ] Analytics détaillés (taux de conversion, sources de trafic)

### À long terme
- [ ] Automatisations (email de bienvenue, séquences)
- [ ] A/B testing des pages de capture
- [ ] API publique pour intégrations tierces
- [ ] White-label pour revendeurs

---

## 💡 Conseils

1. **Teste d'abord en anonyme** : Crée un lead magnet sans compte pour vérifier le flow
2. **Désactive la confirmation email** : Pour tester plus rapidement (à réactiver en prod)
3. **Utilise le SQL Editor** : Pour inspecter les données directement dans Supabase
4. **Regarde les logs** : Console browser + terminal Next.js pour débugger
5. **Commence simple** : Utilise des liens externes avant d'implémenter l'upload de fichiers

---

## 📚 Documentation utile

- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/nextjs)

---

Bon test ! 🚀


