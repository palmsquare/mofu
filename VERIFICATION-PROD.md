# Vérification en production

## Problème : Pas de bouton admin et impossible d'accéder à /admin

Si tu es dans la table `admin_users` mais que tu ne vois pas le bouton admin et que tu ne peux pas accéder à `/admin`, voici les étapes pour vérifier :

## 1. Vérifier les variables d'environnement sur Vercel

### Étape 1 : Accéder aux variables d'environnement

1. Va sur Vercel : https://vercel.com
2. Sélectionne ton projet
3. Va dans **Settings** → **Environment Variables**

### Étape 2 : Vérifier les variables suivantes

Assure-toi que ces variables sont définies pour **Production** :

```
NEXT_PUBLIC_SUPABASE_URL=https://ton-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ton-anon-key
SUPABASE_SERVICE_ROLE_KEY=ton-service-role-key
NEXT_PUBLIC_SITE_URL=https://mofu.fr
```

**⚠️ Important** : `SUPABASE_SERVICE_ROLE_KEY` est **obligatoire** pour que le dashboard admin fonctionne. Sans cette variable, la vérification admin échouera silencieusement.

### Étape 3 : Redéployer si nécessaire

Si tu as ajouté ou modifié des variables d'environnement :
1. Va dans **Deployments**
2. Clique sur les **3 points** à côté du dernier déploiement
3. Clique sur **Redeploy**
4. Attends que le déploiement soit terminé

## 2. Vérifier les logs Vercel

### Étape 1 : Accéder aux logs

1. Va sur Vercel
2. Sélectionne ton projet
3. Va dans **Deployments**
4. Clique sur le dernier déploiement
5. Va dans l'onglet **Logs**

### Étape 2 : Chercher les erreurs

Cherche les erreurs suivantes dans les logs :

```
[dashboard] Admin check error
[dashboard] Error code
[dashboard] Error message
[admin/page] Admin check error
```

Si tu vois une erreur `Missing Supabase URL or Service Role Key`, c'est que `SUPABASE_SERVICE_ROLE_KEY` n'est pas définie.

## 3. Vérifier que tu es bien admin

### Méthode 1 : Script de vérification (local)

Exécute le script de vérification depuis ton ordinateur :

```bash
cd app
npm run check:admin keziah@palmsquare.fr
```

Le script va te dire si tu es admin ou non.

### Méthode 2 : Vérification SQL (Supabase)

Exécute cette requête SQL dans Supabase SQL Editor :

```sql
-- Trouver ton user_id
SELECT id, email 
FROM auth.users 
WHERE email = 'keziah@palmsquare.fr';

-- Vérifier si tu es admin (remplace TON_USER_ID par l'ID retourné ci-dessus)
SELECT * FROM admin_users 
WHERE user_id = 'TON_USER_ID';
```

Si la requête ne retourne rien, tu n'es pas admin. Crée ton compte admin :

```bash
cd app
npm run create:admin keziah@palmsquare.fr
```

## 4. Tester en production

### Étape 1 : Se déconnecter

1. Va sur https://mofu.fr
2. Clique sur **Déconnexion**
3. Vide le cache du navigateur (Ctrl+Shift+Delete ou Cmd+Shift+Delete)

### Étape 2 : Se reconnecter

1. Clique sur **Se connecter**
2. Connecte-toi avec ton email et ton mot de passe
3. Tu devrais être redirigé vers `/admin` si tu es admin, ou vers `/dashboard` si tu n'es pas admin

### Étape 3 : Vérifier le bouton admin

1. Si tu es redirigé vers `/dashboard`, vérifie si le bouton **Admin** est visible dans le header
2. Si le bouton n'est pas visible, vérifie les logs Vercel (voir étape 2)

## 5. Vérifier la console du navigateur

### Étape 1 : Ouvrir la console

1. Va sur https://mofu.fr/dashboard
2. Ouvre la console du navigateur (F12 ou Cmd+Option+I)
3. Va dans l'onglet **Console**

### Étape 2 : Chercher les logs

Cherche les logs suivants :

```
[dashboard] Admin check result
[dashboard] Admin check error
```

Si tu vois `Admin check result: { isAdmin: false }`, c'est que tu n'es pas reconnu comme admin.

## 6. Checklist de vérification

- [ ] La variable `SUPABASE_SERVICE_ROLE_KEY` est définie sur Vercel pour **Production**
- [ ] La variable `NEXT_PUBLIC_SUPABASE_URL` est définie sur Vercel pour **Production**
- [ ] La variable `NEXT_PUBLIC_SUPABASE_ANON_KEY` est définie sur Vercel pour **Production**
- [ ] Tu es dans la table `admin_users` dans Supabase
- [ ] Le dernier déploiement Vercel est récent (après les changements)
- [ ] Tu t'es déconnecté et reconnecté après le déploiement
- [ ] Tu as vidé le cache du navigateur

## 7. Solution rapide

Si tout est correct mais que ça ne fonctionne toujours pas :

1. **Vérifie les logs Vercel** pour voir les erreurs exactes
2. **Vérifie que `SUPABASE_SERVICE_ROLE_KEY` est bien définie** sur Vercel
3. **Redéploie** le projet sur Vercel
4. **Déconnecte-toi et reconnecte-toi** après le déploiement
5. **Vide le cache du navigateur**

## 8. Support

Si le problème persiste :
1. Vérifie les logs Vercel
2. Vérifie la console du navigateur
3. Vérifie que tu es bien dans la table `admin_users`
4. Vérifie que `SUPABASE_SERVICE_ROLE_KEY` est bien définie sur Vercel

