# 📁 Proxy de fichiers - Service via domaine personnalisé

## 🎯 Objectif

Servir les fichiers hébergés sur Supabase Storage via ton propre domaine (`https://mofu.fr/api/files/...`) au lieu de l'URL Supabase directe (`https://xxx.supabase.co/storage/...`).

## ✅ Ce qui a été fait

### 1. Route API Proxy

**Fichier** : `app/src/app/api/files/[...path]/route.ts`

Cette route :
- ✅ Télécharge le fichier depuis Supabase Storage
- ✅ Le sert via ton domaine (`https://mofu.fr/api/files/fichier.jpg`)
- ✅ Détermine automatiquement le type MIME (image/jpeg, application/pdf, etc.)
- ✅ Ajoute les headers de cache appropriés
- ✅ Protège contre les attaques de directory traversal

### 2. Fonction de conversion d'URL

**Fichier** : `app/src/lib/file-url.ts`

Cette fonction :
- ✅ Convertit les URLs Supabase en URLs proxy
- ✅ Fonctionne pour les nouveaux fichiers (URLs proxy directement)
- ✅ Fonctionne pour les anciens fichiers (conversion automatique)

### 3. Intégration dans les APIs

- ✅ **Upload** (`/api/uploads`) : Génère directement l'URL proxy
- ✅ **Lead Magnets GET** (`/api/lead-magnets`) : Convertit les URLs lors de la récupération
- ✅ **Lead Magnets POST** (`/api/lead-magnets`) : Convertit les URLs lors de la création
- ✅ **Leads POST** (`/api/leads`) : Convertit les URLs lors de la soumission du formulaire
- ✅ **Page de capture** (`/c/[slug]`) : Convertit les URLs lors de l'affichage

## 🔄 Comment ça fonctionne

### Avant (URL Supabase)
```
https://vjgprpnwxizfkvkjklzs.supabase.co/storage/v1/object/public/lead-magnets/1762952749991_qv2i6ck7.jpg
```

### Après (URL Proxy)
```
https://mofu.fr/api/files/1762952749991_qv2i6ck7.jpg
```

## 🚀 Avantages

1. **URLs propres** : Plus d'URLs Supabase visibles
2. **Domaine personnalisé** : Tous les fichiers servis via `mofu.fr`
3. **Cache** : Headers de cache optimisés (1 heure)
4. **Sécurité** : Protection contre les attaques de directory traversal
5. **Flexibilité** : Possibilité d'ajouter du cache CDN ou d'autres optimisations

## 📋 Migration des anciens fichiers

Les fichiers déjà enregistrés dans la base de données avec l'URL Supabase complète seront **automatiquement convertis** lors de :
- La récupération via l'API GET `/api/lead-magnets`
- L'affichage sur la page de capture `/c/[slug]`
- La soumission du formulaire (redirection vers la ressource)

**Aucune action manuelle n'est nécessaire !** ✅

## 🧪 Test

1. **Upload un nouveau fichier** sur https://mofu.fr
2. **Génère le lien** de capture
3. **Ouvre le lien** dans un nouvel onglet
4. **Remplis le formulaire** et soumets
5. ✅ **Le fichier s'ouvre** via `https://mofu.fr/api/files/...` au lieu de l'URL Supabase

## 🔍 Vérification

Pour vérifier que ça fonctionne :

1. **Va sur** https://mofu.fr
2. **Upload un fichier** (PDF, image, etc.)
3. **Génère le lien** de capture
4. **Ouvre le lien** dans la console du navigateur (F12)
5. **Regarde les Network requests** : tu devrais voir des requêtes vers `/api/files/...` au lieu de `supabase.co/storage/...`

## 📝 Structure des fichiers

```
app/src/
├── app/
│   ├── api/
│   │   ├── files/
│   │   │   └── [...path]/
│   │   │       └── route.ts      # Route proxy
│   │   ├── uploads/
│   │   │   └── route.ts          # Génère URL proxy
│   │   ├── lead-magnets/
│   │   │   └── route.ts          # Convertit URLs
│   │   └── leads/
│   │       └── route.ts          # Convertit URLs
│   └── c/
│       └── [slug]/
│           └── page.tsx          # Convertit URLs
└── lib/
    └── file-url.ts               # Fonctions de conversion
```

## 🔒 Sécurité

La route proxy inclut :
- ✅ Protection contre directory traversal (`..`)
- ✅ Validation du chemin de fichier
- ✅ Vérification que le fichier existe dans Supabase Storage
- ✅ Headers de sécurité appropriés

## 📊 Performance

- ✅ **Cache** : Headers `Cache-Control: public, max-age=3600, immutable`
- ✅ **Streaming** : Les fichiers sont streamés depuis Supabase
- ✅ **Content-Type** : Détection automatique du type MIME

## 🚀 Déploiement

Après le déploiement sur Vercel :

1. ✅ Les nouveaux fichiers utiliseront automatiquement l'URL proxy
2. ✅ Les anciens fichiers seront automatiquement convertis
3. ✅ Aucune migration de base de données nécessaire

---

## ✅ Résumé

**Tous les fichiers sont maintenant servis via `https://mofu.fr/api/files/...` au lieu de l'URL Supabase directe !** 🎉

**Les fichiers existants sont automatiquement convertis, aucune action n'est nécessaire.** ✨

