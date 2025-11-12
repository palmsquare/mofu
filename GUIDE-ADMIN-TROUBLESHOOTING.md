# Guide de dépannage - Accès Admin

## Problème : Redirection vers /dashboard au lieu de /admin

Si tu es redirigé vers `/dashboard` quand tu essaies d'accéder à `/admin`, voici les étapes pour diagnostiquer et résoudre le problème.

## 1. Vérifier que la table admin_users existe

### Étape 1 : Exécuter le script SQL

1. Va sur ton projet Supabase : https://supabase.com/dashboard
2. Va dans **SQL Editor**
3. Crée une nouvelle requête
4. Copie-colle le contenu du fichier `supabase-admin.sql`
5. Clique sur **Run** pour exécuter le script

### Étape 2 : Vérifier que la table existe

Exécute cette requête SQL dans Supabase SQL Editor :

```sql
SELECT * FROM admin_users;
```

Si tu obtiens une erreur "relation admin_users does not exist", la table n'existe pas. Exécute le script SQL `supabase-admin.sql`.

## 2. Vérifier que tu es admin

### Méthode 1 : Script de vérification (recommandé)

```bash
cd app
npm run check:admin ton@email.com
```

Le script va :
- Vérifier si la table `admin_users` existe
- Vérifier si ton compte utilisateur existe
- Vérifier si tu es dans la table `admin_users`
- Afficher des instructions si tu n'es pas admin

### Méthode 2 : Vérification manuelle (SQL)

1. Trouve ton `user_id` dans Supabase → **Authentication** → **Users**
2. Vérifie si tu es dans la table `admin_users` :

```sql
SELECT * FROM admin_users 
WHERE user_id = 'TON_USER_ID';
```

Si la requête ne retourne rien, tu n'es pas admin.

## 3. Créer ton compte admin

### Méthode 1 : Script automatique (recommandé)

```bash
cd app
npm run create:admin ton@email.com
```

### Méthode 2 : Manuel (SQL)

```sql
INSERT INTO admin_users (user_id, email, role)
VALUES ('TON_USER_ID', 'ton@email.com', 'admin');
```

## 4. Vérifier les politiques RLS

Les politiques RLS (Row Level Security) peuvent empêcher la lecture de la table `admin_users`.

### Solution : Modifier la politique RLS

Exécute cette requête SQL dans Supabase SQL Editor :

```sql
-- Supprimer l'ancienne politique
DROP POLICY IF EXISTS "Admins can read admin_users" ON admin_users;

-- Créer une nouvelle politique qui permet à tous les utilisateurs authentifiés de lire
CREATE POLICY "Authenticated users can read admin_users"
  ON admin_users
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
```

**Note** : Cette politique permet à tous les utilisateurs authentifiés de lire la table `admin_users`. C'est acceptable car :
1. La vérification du rôle admin se fait dans l'application (page `/admin`)
2. Les données sensibles ne sont pas exposées
3. L'API utilise le service role key pour les opérations admin

## 5. Vérifier les logs

Vérifie les logs de l'application pour voir les erreurs :

1. Dans Vercel : Va dans **Logs** et cherche les erreurs avec `[admin/page]`
2. Localement : Regarde la console du terminal où tu exécutes `npm run dev`

Les logs vont afficher :
- Si la table `admin_users` existe
- Si l'utilisateur est trouvé
- Si l'utilisateur est admin
- Les erreurs éventuelles

## 6. Checklist de vérification

- [ ] La table `admin_users` existe (vérifier avec `SELECT * FROM admin_users;`)
- [ ] Ton compte utilisateur existe (vérifier dans Supabase → Authentication → Users)
- [ ] Tu es dans la table `admin_users` (vérifier avec `SELECT * FROM admin_users WHERE user_id = 'TON_USER_ID';`)
- [ ] Les politiques RLS permettent la lecture (voir étape 4)
- [ ] Tu es connecté avec le bon compte (vérifier dans le dashboard)
- [ ] Les variables d'environnement sont correctes (vérifier dans `.env.local`)

## 7. Solutions rapides

### Solution 1 : Vérifier et créer l'admin

```bash
# Vérifier le statut admin
cd app
npm run check:admin ton@email.com

# Si tu n'es pas admin, créer l'admin
npm run create:admin ton@email.com
```

### Solution 2 : Modifier la politique RLS

Exécute cette requête SQL dans Supabase :

```sql
-- Permettre à tous les utilisateurs authentifiés de lire admin_users
DROP POLICY IF EXISTS "Admins can read admin_users" ON admin_users;

CREATE POLICY "Authenticated users can read admin_users"
  ON admin_users
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
```

### Solution 3 : Vérifier manuellement avec SQL

```sql
-- Vérifier si tu es admin
SELECT au.*, u.email 
FROM admin_users au
JOIN auth.users u ON au.user_id = u.id
WHERE u.email = 'ton@email.com';
```

## 8. Erreurs courantes

### Erreur : "relation admin_users does not exist"

**Solution** : Exécute le script SQL `supabase-admin.sql` dans Supabase SQL Editor.

### Erreur : "User is not an admin"

**Solution** : Crée ton compte admin avec `npm run create:admin ton@email.com` ou manuellement avec SQL.

### Erreur : "Permission denied for table admin_users"

**Solution** : Modifie la politique RLS (voir étape 4) ou utilise le service role key dans l'application.

### Erreur : "PGRST116" (no rows returned)

**Solution** : Tu n'es pas dans la table `admin_users`. Crée ton compte admin.

## 9. Support

Si le problème persiste :
1. Vérifie les logs de l'application
2. Vérifie les logs de Supabase (SQL Editor → Logs)
3. Vérifie que toutes les étapes de ce guide sont complétées
4. Contacte le support si nécessaire

