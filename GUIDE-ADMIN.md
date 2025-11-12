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

## 2. Créer un utilisateur admin

Après avoir exécuté le script SQL, tu dois créer ton premier utilisateur admin :

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

## 3. Configurer les variables d'environnement

Assure-toi d'avoir la variable `SUPABASE_SERVICE_ROLE_KEY` dans ton fichier `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://ton-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ton_anon_key
SUPABASE_SERVICE_ROLE_KEY=ton_service_role_key
NEXT_PUBLIC_SITE_URL=https://ton-domaine.com
```

⚠️ **Important** : La `SUPABASE_SERVICE_ROLE_KEY` est sensible et ne doit jamais être exposée côté client.

## 4. Accéder à l'espace admin

Une fois l'utilisateur admin créé, tu peux accéder à l'espace admin en allant sur :
- `/admin` (ex: `https://ton-domaine.com/admin`)

L'espace admin est protégé et redirige automatiquement vers le dashboard si tu n'es pas admin.

## 5. Fonctionnalités disponibles

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

## 6. Sécurité

- ✅ Vérification du rôle admin sur toutes les routes API
- ✅ Utilisation du service role key uniquement côté serveur
- ✅ Protection RLS sur la table `admin_users`
- ✅ Empêche les admins de supprimer leur propre compte
- ✅ Middleware qui vérifie l'authentification avant d'accéder à `/admin`

## 7. Prochaines étapes

1. Exécuter le script SQL dans Supabase
2. Créer ton utilisateur admin
3. Tester l'accès à `/admin`
4. Vérifier que tu peux voir tous les utilisateurs
5. Tester la suppression d'un fichier
6. Tester la suppression d'un compte (utilise un compte de test)

## 8. Notes importantes

- Les admins peuvent voir tous les utilisateurs et leurs données
- Les admins peuvent supprimer des fichiers et des comptes
- La suppression d'un compte supprime également tous les fichiers associés
- Les logs de téléchargement sont limités à 50 par défaut (configurable dans l'API)
- Le stockage est calculé en temps réel depuis Supabase Storage

