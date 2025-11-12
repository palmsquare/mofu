# Guide d'installation des analytics

## 1. Exécuter le script SQL dans Supabase

1. Va sur ton projet Supabase : https://supabase.com/dashboard
2. Va dans **SQL Editor**
3. Crée une nouvelle requête
4. Copie-colle le contenu du fichier `supabase-analytics.sql`
5. Clique sur **Run** pour exécuter le script

Le script va créer :
- La table `page_views` pour tracker les visites et conversions
- Les index pour des performances optimales
- Les politiques RLS (Row Level Security)
- Les colonnes `lead_email` et `lead_name` dans la table `leads`

## 2. Vérifier que tout fonctionne

Une fois le script exécuté :
1. Va sur ta page de capture (par exemple : `https://mofu.fr/c/[ton-slug]`)
2. La visite devrait être enregistrée automatiquement
3. Va dans le dashboard → "Voir les leads"
4. Tu devrais voir les statistiques (vues, conversions, graphique)

## 3. Fonctionnalités ajoutées

### Tracking automatique
- ✅ Visites de page (trackées automatiquement)
- ✅ Conversions (trackées quand un lead soumet le formulaire)
- ✅ Paramètres UTM (source, medium, campaign)
- ✅ Referer (d'où vient le visiteur)
- ✅ User Agent (navigateur, OS)

### Statistiques disponibles
- ✅ Nombre de vues
- ✅ Nombre de conversions
- ✅ Taux de conversion (%)
- ✅ Graphique d'activité sur 14 jours
- ✅ Sources de trafic (UTM sources)

## 4. Notes importantes

- Les analytics sont trackées uniquement pour les lead magnets créés après l'installation
- Les anciens lead magnets n'auront pas d'historique d'analytics
- Les données sont stockées de manière sécurisée avec RLS (Row Level Security)
- Seul le propriétaire du lead magnet peut voir ses analytics

