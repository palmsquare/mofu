# Diagnostic Admin sur Vercel - Guide rapide

## Problème : Admin n'est pas visible sur Vercel

Si l'admin n'est pas visible sur Vercel mais fonctionne en local, voici comment diagnostiquer et résoudre le problème.

## Solution 1 : Vérifier les logs Vercel (RECOMMANDÉ)

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

**Si tu vois ces erreurs** :
- `SUPABASE_SERVICE_ROLE_KEY` n'est pas définie sur Vercel
- Ou elle n'est pas accessible en production

### Étape 3 : Vérifier les logs du dashboard

Cherche aussi ces logs dans les logs Vercel :

```
[dashboard] Admin check result: { isAdmin: false, ... }
[dashboard] Admin check error: ...
```

Ces logs te diront exactement pourquoi l'admin ne fonctionne pas.

## Solution 2 : Vérifier les variables d'environnement sur Vercel

### Étape 1 : Accéder aux variables

1. Va sur https://vercel.com
2. Sélectionne ton projet **mofu**
3. Va dans **Settings** → **Environment Variables**

### Étape 2 : Vérifier que `SUPABASE_SERVICE_ROLE_KEY` existe

1. Cherche `SUPABASE_SERVICE_ROLE_KEY` dans la liste
2. Vérifie qu'elle est définie pour **Production**
3. Vérifie que la valeur est correcte (copie-colle depuis Supabase)

### Étape 3 : Vérifier les autres variables

Assure-toi que ces variables sont définies pour **Production** :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **OBLIGATOIRE**
- `NEXT_PUBLIC_SITE_URL`

## Solution 3 : Redéployer sur Vercel

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

### Étape 3 : Vérifier que le déploiement a réussi

1. Va dans **Deployments**
2. Clique sur le dernier déploiement
3. Vérifie que le statut est **Ready** (pas **Error** ou **Building**)

## Solution 4 : Vérifier dans Supabase que tu es admin

### Étape 1 : Vérifier dans Supabase

1. Va sur https://supabase.com/dashboard
2. Sélectionne ton projet
3. Va dans **SQL Editor**
4. Exécute cette requête :

```sql
SELECT * FROM admin_users 
WHERE email = 'keziah@palmsquare.fr';
```

**Si la requête ne retourne rien** :
- Tu n'es pas admin dans Supabase
- Exécute `npm run create:admin keziah@palmsquare.fr`

**Si la requête retourne une ligne** :
- Tu es admin dans Supabase
- Le problème vient de Vercel (variables d'environnement ou déploiement)

## Solution 5 : Tester l'accès admin après redéploiement

### Étape 1 : Déconnecter et reconnecter

1. Va sur https://mofu.fr
2. Déconnecte-toi si tu es connecté
3. Vide le cache du navigateur (Ctrl+Shift+Delete ou Cmd+Shift+Delete)
4. Reconnecte-toi avec `keziah@palmsquare.fr`

### Étape 2 : Vérifier le bouton Admin

1. Va sur https://mofu.fr/dashboard
2. Vérifie si le bouton **Admin** est visible dans le header
3. Si le bouton n'est pas visible, vérifie les logs Vercel (voir Solution 1)

### Étape 3 : Tester l'accès direct

1. Va sur https://mofu.fr/admin
2. Si tu es redirigé vers `/dashboard`, vérifie les logs Vercel
3. Si tu vois l'admin, c'est que ça fonctionne !

## Solution 6 : Utiliser la console du navigateur

### Étape 1 : Ouvrir la console

1. Va sur https://mofu.fr/dashboard
2. Ouvre la console du navigateur (F12 ou Cmd+Option+I)
3. Va dans l'onglet **Console**

### Étape 2 : Chercher les logs

Cherche les logs suivants :

```
[dashboard] Admin check result: { isAdmin: true, ... }
[dashboard] Admin check result: { isAdmin: false, ... }
[dashboard] Failed to create admin client
```

Ces logs te diront si l'admin fonctionne ou non.

## Checklist de vérification

- [ ] `SUPABASE_SERVICE_ROLE_KEY` est définie sur Vercel pour **Production**
- [ ] La valeur de `SUPABASE_SERVICE_ROLE_KEY` est correcte (copiée depuis Supabase)
- [ ] Le projet a été redéployé après l'ajout de la variable
- [ ] Tu es dans la table `admin_users` dans Supabase (vérifier avec SQL)
- [ ] La table `admin_users` existe (vérifier avec `SELECT * FROM admin_users LIMIT 1;`)
- [ ] Tu t'es déconnecté et reconnecté après le déploiement
- [ ] Tu as vidé le cache du navigateur
- [ ] Les logs Vercel ne montrent pas d'erreurs liées à `SUPABASE_SERVICE_ROLE_KEY`

## Problèmes courants et solutions

### Problème 1 : Variable `SUPABASE_SERVICE_ROLE_KEY` manquante

**Symptômes** :
- Les logs Vercel montrent : `Missing required environment variables: SUPABASE_SERVICE_ROLE_KEY`
- Le bouton Admin n'est pas visible
- L'accès à `/admin` redirige vers `/dashboard`

**Solution** :
1. Va sur Vercel → Settings → Environment Variables
2. Ajoute `SUPABASE_SERVICE_ROLE_KEY` avec la valeur depuis Supabase
3. Assure-toi qu'elle est définie pour **Production**
4. Redéploie le projet

### Problème 2 : Variable mal configurée

**Symptômes** :
- La variable existe mais ne fonctionne pas
- Les logs Vercel montrent des erreurs d'authentification

**Solution** :
1. Va sur Supabase → Settings → API
2. Copie la valeur de **service_role** key
3. Va sur Vercel → Settings → Environment Variables
4. Modifie `SUPABASE_SERVICE_ROLE_KEY` avec la nouvelle valeur
5. Redéploie le projet

### Problème 3 : Table `admin_users` n'existe pas

**Symptômes** :
- Les logs Vercel montrent : `Table admin_users does not exist`
- L'accès à `/admin` redirige vers `/dashboard`

**Solution** :
1. Va sur Supabase → SQL Editor
2. Exécute le script `supabase-admin.sql`
3. Vérifie que la table existe avec `SELECT * FROM admin_users LIMIT 1;`

### Problème 4 : Tu n'es pas dans la table `admin_users`

**Symptômes** :
- Les logs Vercel montrent : `User is not in admin_users table`
- Le bouton Admin n'est pas visible

**Solution** :
1. Exécute `npm run create:admin keziah@palmsquare.fr`
2. Vérifie que tu es admin avec `npm run check:admin keziah@palmsquare.fr`
3. Redéploie le projet sur Vercel

### Problème 5 : Cache du navigateur

**Symptômes** :
- L'admin fonctionne en local mais pas sur Vercel
- Le bouton Admin n'apparaît pas

**Solution** :
1. Déconnecte-toi
2. Vide le cache du navigateur (Ctrl+Shift+Delete ou Cmd+Shift+Delete)
3. Reconnecte-toi
4. Teste à nouveau

## Support

Si le problème persiste après avoir vérifié toutes les étapes :

1. **Vérifie les logs Vercel** pour voir les erreurs exactes
2. **Vérifie que `SUPABASE_SERVICE_ROLE_KEY` est bien définie** sur Vercel
3. **Vérifie que tu es bien admin** dans Supabase
4. **Redéploie le projet** sur Vercel
5. **Teste à nouveau** après le redéploiement

## Résumé

**Les causes les plus courantes** :
1. `SUPABASE_SERVICE_ROLE_KEY` n'est pas définie sur Vercel
2. Le projet n'a pas été redéployé après l'ajout de la variable
3. Tu n'es pas dans la table `admin_users` dans Supabase
4. Le cache du navigateur cache l'ancienne version

**La solution la plus rapide** :
1. Vérifie les logs Vercel pour voir les erreurs exactes
2. Vérifie que `SUPABASE_SERVICE_ROLE_KEY` est bien définie sur Vercel
3. Redéploie le projet sur Vercel
4. Déconnecte-toi et reconnecte-toi
5. Teste à nouveau

