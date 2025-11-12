# Guide d'installation des quotas

## 1. Exécuter le script SQL dans Supabase

1. Va sur ton projet Supabase : https://supabase.com/dashboard
2. Va dans **SQL Editor**
3. Crée une nouvelle requête
4. Copie-colle le contenu du fichier `supabase-quotas.sql`
5. Clique sur **Run** pour exécuter le script

Le script va créer :
- La table `user_quotas` pour tracker les quotas des utilisateurs
- Les fonctions pour calculer l'utilisation (stockage, téléchargements, lead magnets)
- Les index pour des performances optimales
- Les politiques RLS (Row Level Security)
- Initialiser les quotas pour les utilisateurs existants

## 2. Quotas par défaut (Plan Gratuit)

- **Stockage** : 100 Mo
- **Téléchargements** : 50 téléchargements
- **Pages de capture** : 1 lead magnet

## 3. Vérifier que tout fonctionne

Une fois le script exécuté :
1. Va sur ton dashboard
2. Tu devrais voir une carte "Quotas" en haut de la page
3. Les quotas devraient s'afficher avec ta consommation actuelle
4. Si tu essaies de créer plus de lead magnets que ta limite, tu devrais voir un message d'erreur

## 4. Fonctionnalités

### Affichage des quotas
- ✅ Carte des quotas dans le dashboard
- ✅ Barres de progression pour chaque quota
- ✅ Indication visuelle (vert, jaune, orange, rouge) selon l'utilisation
- ✅ Messages d'alerte quand les limites sont proches

### Vérification des quotas
- ✅ Vérification avant de créer un lead magnet
- ✅ Vérification avant d'uploader un fichier
- ✅ Messages d'erreur clairs si les limites sont atteintes

### Calcul de l'utilisation
- ✅ Stockage : calculé à partir des fichiers uploadés
- ✅ Téléchargements : nombre de leads collectés
- ✅ Lead magnets : nombre de pages de capture créées

## 5. Notes importantes

- Les quotas sont créés automatiquement quand un utilisateur crée son compte
- Les quotas sont vérifiés à chaque création de lead magnet ou upload de fichier
- Le plan Pro arrive bientôt avec des limites illimitées
- Pour l'instant, le stockage est estimé (5 MB par fichier) - en production, tu devras interroger Supabase Storage pour les vraies tailles

## 6. Prochaines étapes

1. Exécuter le script SQL dans Supabase
2. Tester en créant un lead magnet
3. Vérifier que les quotas s'affichent correctement
4. Tester les limites en essayant de créer plus de lead magnets que la limite

