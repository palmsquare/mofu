# 🚀 Guide de déploiement sur Vercel

## Méthode 1 : Via l'interface Vercel (RECOMMANDÉ)

### Étape 1 : Connecte-toi à Vercel

1. Va sur [vercel.com](https://vercel.com)
2. Clique sur **"Sign Up"** ou **"Log In"**
3. Connecte-toi avec ton compte **GitHub** ✅

### Étape 2 : Importe ton projet

1. Clique sur **"Add New..."** → **"Project"**
2. Cherche et sélectionne **`palmsquare/mofu`**
3. Clique sur **"Import"**

### Étape 3 : Configure le projet

#### A. Root Directory

⚠️ **IMPORTANT** : Change le **Root Directory** :
- Clique sur **"Edit"** à côté de "Root Directory"
- Entre : `app`
- Clique sur **"Continue"**

#### B. Framework Preset

Vercel devrait détecter automatiquement **Next.js** ✅

#### C. Build Settings

Laisse les paramètres par défaut :
- **Build Command** : `npm run build`
- **Output Directory** : `.next`
- **Install Command** : `npm install`

### Étape 4 : Configure les variables d'environnement

⚠️ **CRITIQUE** : Ajoute ces 4 variables d'environnement :

Clique sur **"Environment Variables"** et ajoute :

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://vjgprpnwxizfkvkjklzs.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqZ3BycG53eGl6Zmt2a2prbHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NTY4OTAsImV4cCI6MjA3ODQzMjg5MH0.UYFCY3k2RKtjonisABIscd4cmzh8yBLG6g2_ujyQ2Q` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqZ3BycG53eGl6Zmt2a2prbHpzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg1Njg5MCwiZXhwIjoyMDc4NDMyODkwfQ.kcR4dAWDWi0BOvKejkoNhSdXb3erC8sjgNtmbJWB-SY` |
| `NEXT_PUBLIC_SITE_URL` | *(Laisse vide pour l'instant, on le mettra après)* |

**Pour chaque variable :**
1. Entre le **Name**
2. Entre la **Value**
3. Coche **"Production"**, **"Preview"**, et **"Development"**
4. Clique sur **"Add"**

### Étape 5 : Déploie !

1. Clique sur **"Deploy"** 🚀
2. Attends 2-3 minutes (Vercel va build ton app)
3. ✅ **Déploiement réussi !**

### Étape 6 : Mets à jour NEXT_PUBLIC_SITE_URL

Une fois le déploiement terminé :

1. Copie ton URL Vercel (ex: `https://mofu-abc123.vercel.app`)
2. Va dans **Settings** → **Environment Variables**
3. Trouve `NEXT_PUBLIC_SITE_URL`
4. Clique sur **"Edit"**
5. Entre ton URL Vercel
6. Clique sur **"Save"**
7. **Redéploie** : Deployments → ⋯ → **"Redeploy"**

---

## Méthode 2 : Via Vercel CLI (Avancé)

### Installation

```bash
npm install -g vercel
```

### Déploiement

```bash
cd /Users/keziah/Downloads/mofu
vercel
```

Suis les instructions :
1. **Set up and deploy?** → Yes
2. **Which scope?** → Ton compte
3. **Link to existing project?** → No
4. **Project name?** → mofu
5. **Directory?** → `./app`
6. **Override settings?** → No

### Ajouter les variables d'environnement

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add NEXT_PUBLIC_SITE_URL
```

### Déployer en production

```bash
vercel --prod
```

---

## ✅ Vérification post-déploiement

### 1. Teste l'application

1. Va sur ton URL Vercel
2. Colle un lien : `https://example.com/guide.pdf`
3. Clique sur "Générer le lien"
4. Crée un compte
5. ✅ Vérifie que tu arrives sur le dashboard

### 2. Configure Supabase pour la production

⚠️ **IMPORTANT** : Ajoute ton URL Vercel dans Supabase :

1. Va sur ton dashboard Supabase
2. **Authentication** → **URL Configuration**
3. Ajoute ton URL Vercel dans **"Site URL"**
4. Ajoute `https://ton-url.vercel.app/**` dans **"Redirect URLs"**
5. Clique sur **"Save"**

### 3. Teste l'upload de fichiers

1. Sur ton site en production, upload un PDF
2. ✅ Vérifie que ça fonctionne

---

## 🐛 Problèmes courants

### Erreur : "Module not found"

**Solution** : Vérifie que le Root Directory est bien `app`

### Erreur : "Environment variables missing"

**Solution** : Vérifie que les 4 variables d'environnement sont bien configurées

### Erreur : "Failed to connect to Supabase"

**Solution** : Vérifie que les clés Supabase sont correctes

### Upload de fichiers ne fonctionne pas

**Solution** : Vérifie les policies du bucket Storage dans Supabase

---

## 🔄 Déploiements automatiques

Maintenant, **chaque fois que tu push sur GitHub**, Vercel va automatiquement :
1. ✅ Détecter le nouveau commit
2. ✅ Builder l'application
3. ✅ Déployer en production
4. ✅ T'envoyer un email de confirmation

---

## 📊 Monitoring

### Vercel Dashboard

- **Analytics** : Nombre de visiteurs, pages vues
- **Logs** : Logs en temps réel de ton application
- **Speed Insights** : Performance de ton site

### Supabase Dashboard

- **Database** : Nombre de lead magnets et leads
- **Auth** : Nombre d'utilisateurs inscrits
- **Storage** : Espace utilisé

---

## 🎉 C'est tout !

Ton application est maintenant en production ! 🚀

**URL de ton site** : https://mofu-[ton-id].vercel.app

Partage-le avec tes premiers utilisateurs et collecte des feedbacks ! 💪

