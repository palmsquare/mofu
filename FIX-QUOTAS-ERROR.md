# Fix: Erreur "Could not find the table 'public.user_quotas'"

## Problème

Tu as l'erreur suivante :

```
[quotas][GET] create error: {
  code: 'PGRST205',
  details: null,
  hint: null,
  message: "Could not find the table 'public.user_quotas' in the schema cache"
}
```

Cette erreur signifie que la table `user_quotas` n'existe pas dans ta base de données Supabase.

## Solution : Créer la table user_quotas

### Étape 1 : Exécuter le script SQL dans Supabase

1. **Va sur Supabase** : https://supabase.com/dashboard
2. **Sélectionne ton projet**
3. **Va dans SQL Editor**
4. **Crée une nouvelle requête**
5. **Copie-colle le contenu du fichier `supabase-quotas.sql`**
6. **Clique sur Run** pour exécuter le script

### Étape 2 : Vérifier que la table existe

Exécute cette requête SQL dans Supabase SQL Editor :

```sql
SELECT * FROM user_quotas LIMIT 1;
```

Si tu obtiens une erreur "relation user_quotas does not exist", la table n'existe pas. Exécute le script SQL `supabase-quotas.sql`.

### Étape 3 : Vérifier que les politiques RLS sont créées

Exécute cette requête SQL dans Supabase SQL Editor :

```sql
SELECT * FROM pg_policies WHERE tablename = 'user_quotas';
```

Tu devrais voir au moins 2 politiques :
- Une politique pour permettre aux utilisateurs de lire leurs propres quotas
- Une politique pour permettre aux admins de lire tous les quotas

## Contenu du fichier supabase-quotas.sql

Le fichier `supabase-quotas.sql` contient :

1. **Création de la table `user_quotas`** :
   - `user_id` : UUID (référence à `auth.users`)
   - `storage_limit_mb` : DECIMAL (limite de stockage en MB)
   - `storage_used_mb` : DECIMAL (stockage utilisé en MB)
   - `downloads_limit` : INTEGER (limite de téléchargements)
   - `downloads_used` : INTEGER (téléchargements utilisés)
   - `lead_magnets_limit` : INTEGER (limite de lead magnets)
   - `lead_magnets_used` : INTEGER (lead magnets utilisés)
   - `created_at` : TIMESTAMPTZ
   - `updated_at` : TIMESTAMPTZ

2. **Création des index** :
   - Index sur `user_id` pour des performances optimales

3. **Activation de RLS** :
   - Row Level Security activé sur la table

4. **Création des politiques RLS** :
   - Les utilisateurs peuvent lire leurs propres quotas
   - Les utilisateurs peuvent mettre à jour leurs propres quotas
   - Les admins peuvent lire tous les quotas

5. **Création d'un trigger** :
   - Mise à jour automatique de `updated_at` lors de la modification

## Vérification après exécution

### 1. Vérifier que la table existe

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'user_quotas';
```

Tu devrais voir `user_quotas` dans les résultats.

### 2. Vérifier les politiques RLS

```sql
SELECT * FROM pg_policies WHERE tablename = 'user_quotas';
```

Tu devrais voir au moins 2 politiques.

### 3. Tester l'API

Après avoir exécuté le script SQL, teste l'API `/api/quotas` :

1. **Connecte-toi** sur ton site
2. **Va sur le dashboard**
3. **Vérifie que les quotas s'affichent** (barres de progression pour le stockage, téléchargements, lead magnets)

Si les quotas ne s'affichent pas, vérifie les logs Vercel pour voir les erreurs.

## Problèmes courants

### Erreur : "relation user_quotas does not exist"

**Solution** : Exécute le script SQL `supabase-quotas.sql` dans Supabase SQL Editor.

### Erreur : "permission denied for table user_quotas"

**Solution** : Vérifie que les politiques RLS sont créées. Exécute la requête pour vérifier les politiques :

```sql
SELECT * FROM pg_policies WHERE tablename = 'user_quotas';
```

Si aucune politique n'existe, exécute à nouveau le script SQL.

### Erreur : "duplicate key value violates unique constraint"

**Solution** : Cela signifie que la table existe déjà. Tu peux ignorer cette erreur ou supprimer la table et la recréer :

```sql
DROP TABLE IF EXISTS user_quotas CASCADE;
```

Puis exécute à nouveau le script SQL.

## Support

Si le problème persiste :
1. Vérifie que le script SQL a été exécuté avec succès
2. Vérifie que la table `user_quotas` existe
3. Vérifie que les politiques RLS sont créées
4. Vérifie les logs Vercel pour voir les erreurs exactes

