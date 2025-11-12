# Guide de dépannage - Accès Admin

## Problème : Redirection vers /dashboard au lieu de /admin

Si tu es redirigé vers `/dashboard` quand tu essaies d'accéder à `/admin`, voici les étapes pour résoudre le problème.

## Solution rapide

### Étape 1 : Vérifier que la table admin_users existe

Exécute cette requête SQL dans Supabase SQL Editor :

```sql
SELECT * FROM admin_users;
```

**Si tu obtiens une erreur "relation admin_users does not exist"** :
1. Va dans Supabase → **SQL Editor**
2. Copie-colle le contenu du fichier `supabase-admin.sql`
3. Clique sur **Run** pour exécuter le script

### Étape 2 : Vérifier ton statut admin

Utilise le script de vérification :

```bash
cd app
npm run check:admin keziah@palmsquare.fr
```

Le script va te dire :
- ✅ Si la table existe
- ✅ Si ton compte utilisateur existe
- ✅ Si tu es admin
- 💡 Comment créer ton compte admin si tu n'es pas admin

### Étape 3 : Créer ton compte admin

Si tu n'es pas admin, exécute :

```bash
cd app
npm run create:admin keziah@palmsquare.fr
```

### Étape 4 : Tester l'accès

1. Déconnecte-toi
2. Reconnecte-toi
3. Va sur `/admin` → tu devrais maintenant avoir accès

## Vérification manuelle (SQL)

Si tu préfères vérifier manuellement :

### 1. Trouver ton user_id

```sql
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'keziah@palmsquare.fr';
```

### 2. Vérifier si tu es admin

```sql
SELECT * FROM admin_users 
WHERE user_id = 'TON_USER_ID';
```

### 3. Créer ton compte admin (si tu n'es pas admin)

```sql
INSERT INTO admin_users (user_id, email, role)
VALUES ('TON_USER_ID', 'keziah@palmsquare.fr', 'admin');
```

## Problèmes courants

### Erreur : "relation admin_users does not exist"

**Solution** : Exécute le script SQL `supabase-admin.sql` dans Supabase SQL Editor.

### Erreur : "User is not an admin"

**Solution** : Crée ton compte admin avec `npm run create:admin keziah@palmsquare.fr`.

### Erreur : "Permission denied for table admin_users"

**Solution** : Exécute cette requête SQL dans Supabase :

```sql
-- Supprimer l'ancienne politique
DROP POLICY IF EXISTS "Admins can read admin_users" ON admin_users;

-- Créer une nouvelle politique qui permet à tous les utilisateurs authentifiés de lire
CREATE POLICY "Authenticated users can read admin_users"
  ON admin_users
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
```

## Checklist

- [ ] La table `admin_users` existe (vérifier avec `SELECT * FROM admin_users;`)
- [ ] Ton compte utilisateur existe (vérifier dans Supabase → Authentication → Users)
- [ ] Tu es dans la table `admin_users` (vérifier avec le script `check:admin`)
- [ ] Les variables d'environnement sont correctes (vérifier dans `.env.local`)
- [ ] Tu es connecté avec le bon compte (vérifier dans le dashboard)

## Après avoir créé ton admin

1. **Déconnecte-toi** de ton compte
2. **Reconnecte-toi** avec ton email et mot de passe
3. Tu seras **automatiquement redirigé vers `/admin`** si tu es admin
4. Ou clique sur le bouton **"Admin"** dans le dashboard

## Support

Si le problème persiste :
1. Vérifie les logs de l'application (console du navigateur)
2. Vérifie les logs de Supabase (SQL Editor → Logs)
3. Exécute `npm run check:admin keziah@palmsquare.fr` pour diagnostiquer

