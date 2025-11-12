# 🔧 FIX : Erreur "Invalid API key" lors de la création de compte

## 🎯 Problème

L'erreur "Invalid API key" signifie que Supabase ne peut pas authentifier les requêtes car les clés API ne sont pas correctement configurées.

## ✅ Solution : Vérifier les variables d'environnement sur Vercel

### Étape 1 : Vérifier les variables d'environnement dans Vercel

1. Va sur ton **dashboard Vercel** : https://vercel.com/dashboard
2. Sélectionne ton projet **mofu**
3. Va dans **Settings** → **Environment Variables**
4. Vérifie que ces **4 variables** sont bien définies :

| Variable | Valeur attendue |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://vjgprpnwxizfkvkjklzs.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (commence par `eyJ`) |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (commence par `eyJ`) |
| `NEXT_PUBLIC_SITE_URL` | `https://mofu.fr` |

### Étape 2 : Vérifier que les variables sont pour tous les environnments

Pour chaque variable, vérifie qu'elle est cochée pour :
- ✅ **Production**
- ✅ **Preview**
- ✅ **Development**

### Étape 3 : Vérifier les valeurs exactes

⚠️ **IMPORTANT** : Copie-colle **exactement** les valeurs depuis Supabase :

1. Va sur **Supabase Dashboard** : https://supabase.com/dashboard/project/vjgprpnwxizfkvkjklzs
2. Va dans **Settings** → **API**
3. Copie les valeurs :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### Étape 4 : Mettre à jour les variables si nécessaire

1. Dans **Vercel** → **Settings** → **Environment Variables**
2. Pour chaque variable :
   - Clique sur les **3 petits points** (⋯)
   - Clique sur **Edit**
   - Colle la valeur **exacte** (sans espaces avant/après)
   - Vérifie que les 3 environnements sont cochés
   - Clique sur **Save**

### Étape 5 : Redéployer

1. Va dans **Deployments**
2. Clique sur les **3 petits points** (⋯) du dernier déploiement
3. Clique sur **Redeploy**
4. Confirme

---

## 🔍 Diagnostic : Vérifier les logs

Si l'erreur persiste, vérifie les logs :

1. **Vercel Dashboard** → **Deployments** → Clique sur le dernier déploiement
2. **Functions** → Regarde les logs
3. Cherche les erreurs liées à Supabase

### Erreurs courantes :

#### ❌ "Supabase n'est pas configuré côté client"
**Cause** : Variables d'environnement manquantes
**Solution** : Vérifie que `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` sont bien définies

#### ❌ "Invalid API key"
**Cause** : Clé API incorrecte ou mal copiée
**Solution** : Recopie la clé depuis Supabase Dashboard → Settings → API

#### ❌ "JWT expired" ou "JWT malformed"
**Cause** : Clé API invalide ou corrompue
**Solution** : Vérifie que la clé commence par `eyJ` et qu'elle n'a pas d'espaces

---

## 🧪 Test local

Pour tester localement :

1. Vérifie que ton fichier `.env.local` contient les bonnes valeurs
2. Lance `npm run dev`
3. Essaie de créer un compte
4. Si ça fonctionne en local mais pas en production, c'est que les variables Vercel sont incorrectes

---

## 📋 Checklist de vérification

- [ ] `NEXT_PUBLIC_SUPABASE_URL` est définie dans Vercel
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` est définie dans Vercel
- [ ] `SUPABASE_SERVICE_ROLE_KEY` est définie dans Vercel
- [ ] `NEXT_PUBLIC_SITE_URL` est définie dans Vercel
- [ ] Toutes les variables sont cochées pour Production, Preview, et Development
- [ ] Les valeurs sont **exactement** les mêmes que dans Supabase Dashboard
- [ ] Le projet a été redéployé après avoir modifié les variables

---

## 🚀 Si ça ne fonctionne toujours pas

1. **Supprime et recrée les variables** dans Vercel
2. **Vérifie dans Supabase** que l'authentification Email est bien activée
3. **Vérifie les logs** dans Vercel pour voir l'erreur exacte
4. **Teste en local** pour isoler le problème

---

## 💡 Astuce : Variables d'environnement Next.js

Les variables qui commencent par `NEXT_PUBLIC_` sont accessibles côté client (navigateur).

Les variables **sans** `NEXT_PUBLIC_` sont **uniquement** accessibles côté serveur.

C'est pourquoi :
- `NEXT_PUBLIC_SUPABASE_URL` → Accessible dans le navigateur ✅
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Accessible dans le navigateur ✅
- `SUPABASE_SERVICE_ROLE_KEY` → **UNIQUEMENT** côté serveur (ne doit JAMAIS être exposé au client) 🔒

---

**Dis-moi si tu as toujours l'erreur après avoir vérifié les variables d'environnement !** 🚀

