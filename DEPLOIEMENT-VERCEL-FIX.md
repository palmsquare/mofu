# 🔧 FIX : Erreur "cd app && npm install" sur Vercel

## 🎯 Solution : Configuration correcte dans Vercel Dashboard

Le problème vient du fait que Vercel essaie d'exécuter `cd app && npm install` alors que le Root Directory devrait déjà être configuré à `app`.

### ✅ Étape 1 : Supprime toutes les commandes personnalisées

1. Va dans ton projet Vercel
2. **Settings** → **General**
3. Scroll jusqu'à **"Build & Development Settings"**
4. **Supprime toutes les commandes personnalisées** :
   - **Build Command** : Laisse **complètement vide** ❌ (ne mets rien)
   - **Output Directory** : Laisse **complètement vide** ❌ (ne mets rien)
   - **Install Command** : Laisse **complètement vide** ❌ (ne mets rien)
5. Clique sur **"Save"**

### ✅ Étape 2 : Configure le Root Directory

1. Toujours dans **Settings** → **General**
2. Scroll jusqu'à **"Root Directory"**
3. Clique sur **"Edit"**
4. Entre : **`app`** (sans slash, juste `app`)
5. Clique sur **"Save"**

### ✅ Étape 3 : Vérifie Framework Preset

1. Dans **"Build & Development Settings"**
2. **Framework Preset** devrait être : **`Next.js`** (auto-détecté)
3. Si ce n'est pas le cas, sélectionne **`Next.js`** manuellement

### ✅ Étape 4 : Vérifie Node.js Version

1. Scroll jusqu'à **"Node.js Version"**
2. Sélectionne : **`20.x`** (ou `18.x`)
3. Clique sur **"Save"**

### ✅ Étape 5 : Redéploie

1. Va dans **"Deployments"**
2. Clique sur les **3 petits points** (⋯) du dernier déploiement
3. Clique sur **"Redeploy"**
4. Confirme

---

## 📋 Récapitulatif de la configuration VERCEL

| Paramètre | Valeur |
|-----------|--------|
| **Root Directory** | `app` (sans slash) |
| **Framework Preset** | `Next.js` |
| **Build Command** | **(VIDE)** |
| **Output Directory** | **(VIDE)** |
| **Install Command** | **(VIDE)** |
| **Node.js Version** | `20.x` |

---

## 🔍 Pourquoi ça ne marche pas ?

Si tu as toujours l'erreur `cd app && npm install`, c'est que :

1. ❌ Vercel a peut-être une commande personnalisée dans **"Build Command"** qui dit `cd app && npm install`
2. ❌ Le **Root Directory** n'est pas correctement configuré à `app`
3. ❌ Vercel utilise peut-être une configuration en cache

### Solution : Reset complet

1. **Supprime complètement le projet** dans Vercel (Settings → General → Delete Project)
2. **Réimporte le projet** depuis GitHub
3. **Configure uniquement le Root Directory** à `app`
4. **Ne touche à rien d'autre** dans Build & Development Settings
5. **Ajoute les variables d'environnement**
6. **Déploie**

---

## 🚀 Alternative : Déplacer le projet à la racine (SI RIEN NE MARCHE)

Si vraiment rien ne fonctionne, on peut déplacer tout le contenu de `app/` à la racine du repo :

```bash
# ⚠️ ATTENTION : Ça va réorganiser ton repo
cd /Users/keziah/Downloads/mofu
mv app/* .
mv app/.* . 2>/dev/null || true
rmdir app
```

Puis pousse sur GitHub et redéploie sur Vercel (sans Root Directory cette fois).

---

## 💡 Diagnostic

Pour savoir exactement ce que Vercel essaie d'exécuter :

1. Va dans **Deployments**
2. Clique sur le déploiement qui a échoué
3. Regarde les **logs de build**
4. Cherche la ligne qui commence par `Running "..."`

Tu devrais voir quelque chose comme :
- ✅ **Bon** : `Running "npm install"` (sans `cd app`)
- ❌ **Mauvais** : `Running "cd app && npm install"`

---

**Essaie d'abord la solution 1 (supprimer les commandes personnalisées), et dis-moi si ça fonctionne !** 🚀

