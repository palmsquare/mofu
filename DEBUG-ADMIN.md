# Debug Admin - Guide de diagnostic

## Problème : Admin n'est toujours pas visible

Si l'admin n'est toujours pas visible après avoir configuré les variables d'environnement sur Vercel, voici comment diagnostiquer le problème.

## 1. Vérifier les variables d'environnement sur Vercel

### Étape 1 : Vérifier que SUPABASE_SERVICE_ROLE_KEY est définie

1. Va sur https://vercel.com
2. Sélectionne ton projet **mofu**
3. Va dans **Settings** → **Environment Variables**
4. Vérifie que `SUPABASE_SERVICE_ROLE_KEY` est définie pour **Production**
5. Vérifie que la valeur est correcte (copie-colle depuis Supabase)

### Étape 2 : Vérifier les autres variables

Assure-toi que ces variables sont définies pour **Production** :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **OBLIGATOIRE**
- `NEXT_PUBLIC_SITE_URL`

## 2. Utiliser la route de debug

J'ai créé une route de debug pour diagnostiquer le problème :

### Étape 1 : Accéder à la route de debug

1. Va sur https://mofu.fr/api/admin/debug
2. Connecte-toi si nécessaire
3. Tu verras un JSON avec les informations de debug

### Étape 2 : Interpréter les résultats

Le JSON retourné contient :

```json
{
  "authenticated": true,
  "user": {
    "id": "...",
    "email": "..."
  },
  "env": {
    "hasSupabaseUrl": true,
    "hasServiceRoleKey": true,
    "supabaseUrl": "...",
    "serviceRoleKeyLength": 200
  },
  "adminClient": {
    "canCreate": true,
    "error": null
  },
  "adminCheck": {
    "isAdmin": true,
    "error": null,
    "adminUser": {...}
  },
  "tableExists": true
}
```

**Problèmes possibles :**

1. **`hasServiceRoleKey: false`** → `SUPABASE_SERVICE_ROLE_KEY` n'est pas définie sur Vercel
2. **`canCreate: false`** → Impossible de créer le client admin (vérifier les variables)
3. **`tableExists: false`** → La table `admin_users` n'existe pas (exécuter `supabase-admin.sql`)
4. **`isAdmin: false`** → Tu n'es pas dans la table `admin_users` (exécuter `npm run create:admin`)
5. **`error: "..."`** → Voir le message d'erreur pour plus de détails

## 3. Vérifier les logs Vercel

### Étape 1 : Accéder aux logs

1. Va sur https://vercel.com
2. Sélectionne ton projet **mofu**
3. Va dans **Deployments**
4. Clique sur le dernier déploiement
5. Va dans l'onglet **Logs**

### Étape 2 : Chercher les erreurs

Cherche les erreurs suivantes dans les logs :

```
[supabase-admin-client] Missing required environment variables: SUPABASE_SERVICE_ROLE_KEY
[dashboard] Failed to create admin client
[admin/page] Failed to create admin client
[auth/check-admin][GET] Failed to create admin client
```

Si tu vois ces erreurs, c'est que `SUPABASE_SERVICE_ROLE_KEY` n'est pas définie ou n'est pas accessible.

## 4. Vérifier que tu es bien admin

### Étape 1 : Vérifier dans Supabase

1. Va sur https://supabase.com/dashboard
2. Sélectionne ton projet
3. Va dans **SQL Editor**
4. Exécute cette requête :

```sql
SELECT * FROM admin_users 
WHERE email = 'keziah@palmsquare.fr';
```

Si la requête ne retourne rien, tu n'es pas admin. Crée ton compte admin :

```bash
cd app
npm run create:admin keziah@palmsquare.fr
```

### Étape 2 : Vérifier localement

Exécute le script de vérification :

```bash
cd app
npm run check:admin keziah@palmsquare.fr
```

Le script va te dire si tu es admin ou non.

## 5. Redéployer sur Vercel

### Étape 1 : Vérifier que le code est bien pushé

```bash
git log --oneline -5
```

Vérifie que les derniers commits sont bien là.

### Étape 2 : Redéployer manuellement

1. Va sur https://vercel.com
2. Sélectionne ton projet **mofu**
3. Va dans **Deployments**
4. Clique sur les **3 points** à côté du dernier déploiement
5. Clique sur **Redeploy**
6. Attends que le déploiement soit terminé

### Étape 3 : Vider le cache

1. Déconnecte-toi de https://mofu.fr
2. Vide le cache du navigateur (Ctrl+Shift+Delete ou Cmd+Shift+Delete)
3. Reconnecte-toi

## 6. Tester l'accès admin

### Étape 1 : Tester la route de debug

1. Va sur https://mofu.fr/api/admin/debug
2. Connecte-toi si nécessaire
3. Vérifie les résultats

### Étape 2 : Tester le dashboard

1. Va sur https://mofu.fr/dashboard
2. Vérifie si le bouton **Admin** est visible
3. Si le bouton n'est pas visible, vérifie les logs de la console du navigateur (F12)

### Étape 3 : Tester l'accès direct

1. Va sur https://mofu.fr/admin
2. Si tu es redirigé vers `/dashboard`, vérifie les logs Vercel
3. Si tu vois l'admin, c'est que ça fonctionne !

## 7. Checklist de vérification

- [ ] `SUPABASE_SERVICE_ROLE_KEY` est définie sur Vercel pour **Production**
- [ ] La valeur de `SUPABASE_SERVICE_ROLE_KEY` est correcte (copiée depuis Supabase)
- [ ] Le projet a été redéployé après l'ajout de la variable
- [ ] Tu es dans la table `admin_users` dans Supabase
- [ ] La table `admin_users` existe (vérifier avec `SELECT * FROM admin_users LIMIT 1;`)
- [ ] Tu t'es déconnecté et reconnecté après le déploiement
- [ ] Tu as vidé le cache du navigateur
- [ ] Les logs Vercel ne montrent pas d'erreurs liées à `SUPABASE_SERVICE_ROLE_KEY`

## 8. Solutions courantes

### Solution 1 : Variable d'environnement manquante

**Problème** : `SUPABASE_SERVICE_ROLE_KEY` n'est pas définie sur Vercel

**Solution** :
1. Va sur Vercel → Settings → Environment Variables
2. Ajoute `SUPABASE_SERVICE_ROLE_KEY` avec la valeur depuis Supabase
3. Assure-toi qu'elle est définie pour **Production**
4. Redéploie le projet

### Solution 2 : Variable mal configurée

**Problème** : La valeur de `SUPABASE_SERVICE_ROLE_KEY` est incorrecte

**Solution** :
1. Va sur Supabase → Settings → API
2. Copie la valeur de **service_role** key
3. Va sur Vercel → Settings → Environment Variables
4. Modifie `SUPABASE_SERVICE_ROLE_KEY` avec la nouvelle valeur
5. Redéploie le projet

### Solution 3 : Table admin_users n'existe pas

**Problème** : La table `admin_users` n'existe pas dans Supabase

**Solution** :
1. Va sur Supabase → SQL Editor
2. Exécute le script `supabase-admin.sql`
3. Vérifie que la table existe avec `SELECT * FROM admin_users LIMIT 1;`

### Solution 4 : Tu n'es pas dans la table admin_users

**Problème** : Tu n'es pas dans la table `admin_users`

**Solution** :
1. Exécute `npm run create:admin keziah@palmsquare.fr`
2. Vérifie que tu es admin avec `npm run check:admin keziah@palmsquare.fr`

### Solution 5 : Cache du navigateur

**Problème** : Le cache du navigateur cache l'ancienne version

**Solution** :
1. Déconnecte-toi
2. Vide le cache du navigateur (Ctrl+Shift+Delete)
3. Reconnecte-toi

## 9. Support

Si le problème persiste après avoir vérifié toutes les étapes :

1. Vérifie la route de debug : https://mofu.fr/api/admin/debug
2. Vérifie les logs Vercel pour voir les erreurs exactes
3. Vérifie que tu es bien admin dans Supabase
4. Vérifie que `SUPABASE_SERVICE_ROLE_KEY` est bien définie sur Vercel
5. Redéploie le projet sur Vercel

