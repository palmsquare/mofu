# Guide d'installation de l'espace Admin

## 1. Exécuter le script SQL dans Supabase

1. Va sur ton projet Supabase : https://supabase.com/dashboard
2. Va dans **SQL Editor**
3. Crée une nouvelle requête
4. Copie-colle le contenu du fichier `supabase-admin.sql`
5. Clique sur **Run** pour exécuter le script

Le script va créer :
- La table `admin_users` pour tracker les administrateurs
- Les fonctions pour vérifier les droits admin
- Les index pour des performances optimales
- Les politiques RLS (Row Level Security)
- Une vue `download_logs` pour faciliter l'accès aux logs

## 2. Vérifier que tout fonctionne

### Étape 1 : Vérifier que la table admin_users existe

Exécute cette requête SQL dans Supabase SQL Editor :

```sql
SELECT * FROM admin_users;
```

Si tu obtiens une erreur "relation admin_users does not exist", exécute d'abord le script SQL `supabase-admin.sql` (voir étape 1).

### Étape 2 : Vérifier ton statut admin

Utilise le script de vérification :

```bash
cd app
npm run check:admin ton@email.com
```

Le script va :
- ✅ Vérifier si la table `admin_users` existe
- ✅ Vérifier si ton compte utilisateur existe
- ✅ Vérifier si tu es dans la table `admin_users`
- ✅ Afficher des instructions si tu n'es pas admin

## 3. Créer un compte utilisateur (si tu n'en as pas)

Si tu n'as pas encore de compte :
1. Va sur ton site : `https://ton-domaine.com`
2. Clique sur **"Se connecter"** ou **"Créer un compte"**
3. Crée un compte avec ton email et un mot de passe
4. Connecte-toi avec ce compte

**Important** : Tu utiliseras ce même email et mot de passe pour accéder à l'espace admin. Il n'y a **pas de mot de passe séparé** pour l'admin.

## 4. Créer un utilisateur admin

Après avoir créé ton compte utilisateur, tu dois l'ajouter à la table `admin_users` :

```sql
-- Remplace 'TON_USER_ID' par l'ID de ton compte utilisateur
-- Tu peux trouver ton user_id dans Supabase → Authentication → Users
INSERT INTO admin_users (user_id, email, role)
VALUES (
  'TON_USER_ID', 
  'ton@email.com',
  'admin'
);
```

Pour trouver ton `user_id` :
1. Va dans Supabase → **Authentication** → **Users**
2. Clique sur ton utilisateur
3. Copie l'**User UID**

**Alternative** : Tu peux aussi utiliser cette requête SQL pour trouver ton user_id :
```sql
-- Remplace 'ton@email.com' par ton email
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'ton@email.com';
```

Ensuite, utilise l'`id` retourné dans l'INSERT ci-dessus.

## 5. Configurer les variables d'environnement

Assure-toi d'avoir la variable `SUPABASE_SERVICE_ROLE_KEY` dans ton fichier `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://ton-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ton_anon_key
SUPABASE_SERVICE_ROLE_KEY=ton_service_role_key
NEXT_PUBLIC_SITE_URL=https://ton-domaine.com
```

⚠️ **Important** : La `SUPABASE_SERVICE_ROLE_KEY` est sensible et ne doit jamais être exposée côté client.

## 6. Accéder à l'espace admin

Une fois l'utilisateur admin créé, tu peux accéder à l'espace admin :

1. **Connecte-toi** avec ton compte utilisateur normal (email + mot de passe)
2. Va sur `/admin` (ex: `https://ton-domaine.com/admin`)

**Important** :
- Tu utilises le **même email et mot de passe** que pour ton compte utilisateur normal
- Il n'y a **pas de mot de passe séparé** pour l'admin
- L'espace admin est protégé et redirige automatiquement vers le dashboard si tu n'es pas admin
- Si tu n'es pas dans la table `admin_users`, tu seras redirigé vers `/dashboard`

## 7. Fonctionnalités disponibles

### Liste des utilisateurs / plans
- ✅ Vue d'ensemble de tous les utilisateurs
- ✅ Affichage du plan (Gratuit/Pro)
- ✅ Statistiques par utilisateur (stockage, téléchargements, lead magnets)
- ✅ Suppression de comptes utilisateurs

### Monitoring du stockage
- ✅ Vue détaillée du stockage par utilisateur
- ✅ Pourcentage d'utilisation
- ✅ Tri par stockage utilisé
- ✅ Bouton "Voir fichiers" pour chaque utilisateur

### Suppression manuelle de fichiers / comptes
- ✅ Suppression de fichiers individuels depuis le modal
- ✅ Suppression de comptes utilisateurs complets
- ✅ Suppression automatique des fichiers associés lors de la suppression d'un compte

### Logs de téléchargement
- ✅ Liste de tous les téléchargements
- ✅ Filtrage par utilisateur
- ✅ Affichage des détails (date, utilisateur, lead magnet, email du lead, nom du lead)
- ✅ Actualisation en temps réel

## 8. Sécurité

- ✅ Vérification du rôle admin sur toutes les routes API
- ✅ Utilisation du service role key uniquement côté serveur
- ✅ Protection RLS sur la table `admin_users`
- ✅ Empêche les admins de supprimer leur propre compte
- ✅ Middleware qui vérifie l'authentification avant d'accéder à `/admin`

## 9. Prochaines étapes

1. Exécuter le script SQL dans Supabase
2. Créer ton utilisateur admin
3. Tester l'accès à `/admin`
4. Vérifier que tu peux voir tous les utilisateurs
5. Tester la suppression d'un fichier
6. Tester la suppression d'un compte (utilise un compte de test)

## 10. Notes importantes

- **Pas de mot de passe séparé** : Tu utilises ton compte utilisateur normal pour accéder à l'admin
- Les admins peuvent voir tous les utilisateurs et leurs données
- Les admins peuvent supprimer des fichiers et des comptes
- La suppression d'un compte supprime également tous les fichiers associés
- Les logs de téléchargement sont limités à 50 par défaut (configurable dans l'API)
- Le stockage est calculé en temps réel depuis Supabase Storage

## 11. Résumé : Comment devenir admin

### Méthode 1 : Script automatique (recommandé)

1. **Crée un compte utilisateur** sur ton site (email + mot de passe)
2. **Exécute le script** depuis le dossier `app` :
   ```bash
   cd app
   npm run create:admin ton@email.com
   ```
   Ou depuis la racine du projet :
   ```bash
   node scripts/create-admin.js ton@email.com
   ```
3. **Connecte-toi** avec ton compte utilisateur normal
4. **Va sur `/admin`** - tu auras maintenant accès à l'espace admin

### Méthode 2 : Manuel (SQL)

1. **Crée un compte utilisateur** sur ton site (email + mot de passe)
2. **Trouve ton `user_id`** dans Supabase → Authentication → Users
3. **Ajoute ton `user_id`** dans la table `admin_users` avec cette requête SQL :
   ```sql
   INSERT INTO admin_users (user_id, email, role)
   VALUES ('TON_USER_ID', 'ton@email.com', 'admin');
   ```
4. **Connecte-toi** avec ton compte utilisateur normal
5. **Va sur `/admin`** - tu auras maintenant accès à l'espace admin

## 12. Important : Pas de mot de passe séparé

**Tu utilises ton compte utilisateur normal** pour accéder à l'admin :
- ✅ Même email
- ✅ Même mot de passe
- ✅ Pas de mot de passe supplémentaire
- ✅ Pas de double authentification

La seule différence, c'est que ton `user_id` doit être dans la table `admin_users`.

