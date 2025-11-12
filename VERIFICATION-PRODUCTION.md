# ✅ Vérification de la configuration production - mofu.fr

## 🔍 Checklist de vérification

### ✅ 1. Variables d'environnement Vercel

Dans **Vercel Dashboard** → **Settings** → **Environment Variables**, vérifie que :

| Variable | Valeur attendue |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://vjgprpnwxizfkvkjklzs.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `NEXT_PUBLIC_SITE_URL` | **`https://mofu.fr`** ✅ |

⚠️ **IMPORTANT** : `NEXT_PUBLIC_SITE_URL` doit être **exactement** `https://mofu.fr` (sans slash final)

---

### ✅ 2. Configuration Supabase

Dans **Supabase Dashboard** → **Authentication** → **URL Configuration** :

#### Site URL
- ✅ Doit être : `https://mofu.fr`

#### Redirect URLs
- ✅ Doit contenir : `https://mofu.fr/**`
- ✅ Peut aussi contenir : `https://mofu.fr` (sans wildcard)

#### Additional Redirect URLs (si disponible)
- ✅ `https://mofu.fr/dashboard`
- ✅ `https://mofu.fr/login`
- ✅ `https://mofu.fr/signup`

---

### ✅ 3. Configuration du domaine Vercel

Dans **Vercel Dashboard** → **Settings** → **Domains** :

- ✅ `mofu.fr` doit être listé
- ✅ Statut : **Valid** (avec une coche verte)
- ✅ Si tu as aussi `www.mofu.fr`, vérifie qu'il redirige vers `mofu.fr`

---

### ✅ 4. Test de l'application

#### Test 1 : Page d'accueil
1. Va sur https://mofu.fr
2. ✅ La page se charge sans erreur
3. ✅ Tu vois le hero avec "Dépose ton lead magnet"

#### Test 2 : Création d'un lead magnet
1. Colle un lien : `https://example.com/guide.pdf`
2. Clique sur "Générer le lien"
3. ✅ Tu arrives sur `/builder` avec le formulaire

#### Test 3 : Création de compte
1. Clique sur "Créer mon compte" (bannière bleue)
2. Entre email + mot de passe
3. ✅ Tu es redirigé vers `/dashboard`
4. ✅ Tu vois ton lead magnet dans le dashboard

#### Test 4 : Upload de fichier
1. Retourne sur https://mofu.fr
2. Upload un PDF (max 20 Mo)
3. ✅ Le fichier s'upload correctement
4. ✅ Tu arrives sur `/builder` avec le fichier

#### Test 5 : Partage du lien
1. Dans le builder, clique sur "Générer le lien"
2. ✅ Un lien est généré (ex: `https://mofu.fr/lm/abc123`)
3. Ouvre ce lien dans un nouvel onglet (navigation privée)
4. ✅ La page de capture s'affiche
5. Remplis le formulaire
6. ✅ Tu peux télécharger/accéder à la ressource
7. Retourne sur `/dashboard` → ✅ Tu vois le nouveau lead

---

### ✅ 5. Vérification des logs

#### Vercel Logs
1. **Vercel Dashboard** → **Deployments** → Clique sur le dernier déploiement
2. **Functions** → Vérifie qu'il n'y a pas d'erreurs
3. ✅ Pas d'erreurs 500 ou 502

#### Supabase Logs
1. **Supabase Dashboard** → **Logs** → **API Logs**
2. Vérifie les requêtes récentes
3. ✅ Pas d'erreurs 401 ou 403

---

### ✅ 6. Vérification de la base de données

Dans **Supabase Dashboard** → **Table Editor** :

#### Table `lead_magnets`
1. Clique sur `lead_magnets`
2. ✅ Tu vois tes lead magnets créés
3. ✅ La colonne `owner_id` est remplie (pas null) si tu as créé un compte

#### Table `leads`
1. Clique sur `leads`
2. ✅ Tu vois les leads collectés via les formulaires
3. ✅ La colonne `form_data` contient les données du formulaire

---

### ✅ 7. Vérification du Storage

Dans **Supabase Dashboard** → **Storage** → **lead-magnets** :

1. ✅ Le bucket existe
2. ✅ Tu vois les fichiers uploadés
3. ✅ Les fichiers sont accessibles publiquement (tu peux cliquer dessus)

---

### ✅ 8. Test de sécurité

#### Test RLS (Row Level Security)
1. Crée un **nouveau compte** avec un autre email
2. Connecte-toi avec ce compte
3. Va sur `/dashboard`
4. ✅ Tu ne vois **PAS** les lead magnets de l'autre compte
5. ✅ Chaque utilisateur voit uniquement ses propres données

---

## 🐛 Problèmes courants et solutions

### ❌ Erreur : "Invalid redirect URL"
**Solution** : Vérifie que `https://mofu.fr/**` est bien dans les Redirect URLs de Supabase

### ❌ Erreur : "Failed to fetch"
**Solution** : Vérifie que `NEXT_PUBLIC_SUPABASE_URL` est correct dans Vercel

### ❌ Upload de fichiers ne fonctionne pas
**Solution** : Vérifie les policies du bucket Storage dans Supabase

### ❌ Redirection après login ne fonctionne pas
**Solution** : Vérifie que `NEXT_PUBLIC_SITE_URL` est bien `https://mofu.fr` (sans slash)

---

## 🎉 Si tout est vert ✅

Ton application est **100% opérationnelle** ! 🚀

Tu peux maintenant :
- ✅ Partager ton lien avec tes premiers utilisateurs
- ✅ Collecter des leads
- ✅ Suivre les statistiques dans le dashboard
- ✅ Exporter les leads en CSV

---

## 📊 Métriques à suivre

- **Nombre de lead magnets créés** (dashboard Supabase)
- **Nombre de leads collectés** (dashboard Supabase)
- **Taux de conversion** (leads / visites sur les pages de capture)
- **Utilisateurs actifs** (dashboard Supabase → Authentication)

---

**Dis-moi si tu rencontres un problème ou si tout fonctionne parfaitement !** 💪

