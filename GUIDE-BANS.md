# Guide : Système de bannissement

## Vue d'ensemble

Le système de bannissement permet aux admins de bannir des emails, adresses IP ou user IDs pour empêcher l'accès à la plateforme.

## Configuration

### 1. Créer la table `bans` dans Supabase

Exécute le script SQL `supabase-bans.sql` dans le Supabase SQL Editor :

```sql
-- Voir le fichier supabase-bans.sql pour le script complet
```

### 2. Vérifier les variables d'environnement

Assure-toi que `SUPABASE_SERVICE_ROLE_KEY` est configurée sur Vercel (Settings → Environment Variables).

## Fonctionnalités

### Types de bans

- **Email** : Bannit un email spécifique (empêche signup/login et soumission de leads)
- **IP** : Bannit une adresse IP (empêche toutes les actions depuis cette IP)
- **User ID** : Bannit un utilisateur spécifique (empêche login et toutes les actions)

### Points de vérification

Les bans sont vérifiés dans :
- `/api/leads` : Vérifie les emails et IPs avant d'enregistrer un lead
- `/api/auth/check-ban` : Vérifie les emails et IPs avant signup/login
- Pages `/login` et `/signup` : Vérifient les bans avant de tenter l'authentification

### Interface Admin

Dans l'admin dashboard, onglet "Bannissements" :
- **Liste des bans actifs** : Affiche tous les bans actifs avec leurs détails
- **Formulaire de création** : Permet de créer un nouveau ban
  - Type (email/IP/user_id)
  - Valeur (email, IP, ou UUID)
  - Raison (optionnel)
  - Date d'expiration (optionnel, vide = permanent)
- **Désactiver un ban** : Permet de désactiver (ne supprime pas) un ban

## Utilisation

### Créer un ban

1. Va sur `/admin`
2. Clique sur l'onglet "Bannissements"
3. Clique sur "+ Ajouter un ban"
4. Remplis le formulaire :
   - **Type** : Choisis email, IP, ou user_id
   - **Valeur** : Entre l'email, l'IP ou le UUID à bannir
   - **Raison** : (Optionnel) Raison du bannissement
   - **Date d'expiration** : (Optionnel) Date à laquelle le ban expire
5. Clique sur "Créer le ban"

### Désactiver un ban

1. Va sur l'onglet "Bannissements"
2. Trouve le ban à désactiver
3. Clique sur "Désactiver"
4. Le ban est désactivé (mais reste en base de données)

## Notes importantes

- Les bans avec `expires_at` expirés sont automatiquement ignorés
- Les bans désactivés (`is_active = false`) sont ignorés
- Un ban peut être réactivé en le recréant avec la même valeur
- Les bans sont vérifiés en temps réel à chaque requête
- En cas d'erreur lors de la vérification, l'accès est autorisé par défaut (fail open)

## Sécurité

- Seuls les admins peuvent créer/gérer des bans
- Les vérifications utilisent le client admin pour contourner RLS
- Les IPs sont extraites des headers `x-forwarded-for`, `x-real-ip`, ou `cf-connecting-ip`
- Les bans sont stockés de manière sécurisée dans la base de données

