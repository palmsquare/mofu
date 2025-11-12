# 🔧 FIX : Configuration Vercel via CLI

Si tu ne peux pas éditer les champs dans l'interface Vercel, utilise la CLI Vercel pour forcer la configuration.

## 🚀 Installation de Vercel CLI

```bash
npm install -g vercel
```

## 🔐 Connexion à Vercel

```bash
vercel login
```

Suis les instructions pour te connecter avec ton compte GitHub.

## ⚙️ Configuration du projet

Une fois connecté, va dans le dossier `app/` :

```bash
cd /Users/keziah/Downloads/mofu/app
```

## 🎯 Lier le projet à Vercel

```bash
vercel link
```

Suis les instructions :
1. **Set up and deploy?** → `Yes`
2. **Which scope?** → Sélectionne ton compte
3. **Link to existing project?** → `Yes`
4. **What's the name of your project?** → Entre le nom de ton projet Vercel (ex: `mofu`)
5. **In which directory is your code located?** → `./` (le dossier actuel `app/`)

## 📝 Ajouter les variables d'environnement

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Colle : https://vjgprpnwxizfkvkjklzs.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Colle : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqZ3BycG53eGl6Zmt2a2prbHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NTY4OTAsImV4cCI6MjA3ODQzMjg5MH0.UYFCY3k2RKtjonisABIscd4cmzh8yBLG6g2_ujyQ2Q

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Colle : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqZ3BycG53eGl6Zmt2a2prbHpzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg1Njg5MCwiZXhwIjoyMDc4NDMyODkwfQ.kcR4dAWDWi0BOvKejkoNhSdXb3erC8sjgNtmbJWB-SY

vercel env add NEXT_PUBLIC_SITE_URL production
# Colle : https://ton-url.vercel.app (après le premier déploiement)
```

Répète pour `preview` et `development` :

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL preview
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
vercel env add SUPABASE_SERVICE_ROLE_KEY preview
vercel env add NEXT_PUBLIC_SITE_URL preview

vercel env add NEXT_PUBLIC_SUPABASE_URL development
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY development
vercel env add SUPABASE_SERVICE_ROLE_KEY development
vercel env add NEXT_PUBLIC_SITE_URL development
```

## 🚀 Déployer

```bash
vercel --prod
```

## ✅ Vérification

Le déploiement devrait maintenant fonctionner car :
- ✅ La CLI Vercel détecte automatiquement Next.js dans le dossier `app/`
- ✅ Les commandes sont exécutées depuis le bon dossier
- ✅ Pas besoin de `cd app` dans les commandes

---

## 🎯 Alternative : Restructurer le projet

Si vraiment rien ne fonctionne, on peut déplacer tout le contenu de `app/` à la racine :

```bash
cd /Users/keziah/Downloads/mofu
mv app/* .
mv app/.* . 2>/dev/null || true
rmdir app
git add .
git commit -m "Move Next.js app to root directory"
git push origin main
```

Puis redéploie sur Vercel **sans Root Directory** (tout sera à la racine).

---

**Essaie d'abord la solution avec la CLI Vercel, c'est la plus simple !** 🚀

