# Solution : Diagnostiquer l'admin sans redéployer

## Problème : Limite de déploiements Vercel atteinte

Tu as atteint la limite de déploiements gratuits sur Vercel (100 par jour). Tu ne peux pas redéployer avant 14 heures. Voici comment diagnostiquer et résoudre le problème admin sans redéployer.

## Solution 1 : Vérifier les logs Vercel (SANS REDÉPLOYER)

### Étape 1 : Accéder aux logs du dernier déploiement

1. Va sur https://vercel.com
2. Sélectionne ton projet **mofu**
3. Va dans **Deployments**
4. Clique sur le dernier déploiement (celui qui est déjà déployé)
5. Va dans l'onglet **Logs**

### Étape 2 : Chercher les erreurs dans les logs

Cherche les erreurs suivantes dans les logs :

```
[supabase-admin-client] Missing required environment variables: SUPABASE_SERVICE_ROLE_KEY
[dashboard] Failed to create admin client
[admin/page] Failed to create admin client
[auth/check-admin][GET] Failed to create admin client
[dashboard] Admin check result: { isAdmin: false, ... }
[dashboard] Admin check error: ...
```

**Ces logs te diront exactement pourquoi l'admin ne fonctionne pas**, même sans redéployer.

### Étape 3 : Interpréter les résultats

- **Si tu vois `Missing required environment variables: SUPABASE_SERVICE_ROLE_KEY`** :
  - `SUPABASE_SERVICE_ROLE_KEY` n'est pas définie sur Vercel
  - Ou elle n'est pas accessible en production

- **Si tu vois `Admin check result: { isAdmin: false, ... }`** :
  - Tu n'es pas dans la table `admin_users` dans Supabase
  - Ou la table n'existe pas

- **Si tu vois `Admin check error: ...`** :
  - Il y a une erreur lors de la vérification admin
  - Voir le message d'erreur pour plus de détails

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

**Note** : Si tu modifies les variables, tu devras attendre 14 heures avant de pouvoir redéployer. Mais tu peux vérifier que les variables sont bien définies maintenant.

## Solution 3 : Vérifier dans Supabase que tu es admin

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
- Exécute `npm run create:admin keziah@palmsquare.fr` (cela ne nécessite pas de redéploiement)

**Si la requête retourne une ligne** :
- Tu es admin dans Supabase
- Le problème vient de Vercel (variables d'environnement ou code non déployé)

## Solution 4 : Utiliser la console du navigateur

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

Ces logs te diront si l'admin fonctionne ou non, même sans redéployer.

### Étape 3 : Vérifier les requêtes réseau

1. Va dans l'onglet **Network** de la console
2. Recharge la page
3. Cherche les requêtes vers `/api/auth/check-admin`
4. Clique sur la requête pour voir la réponse

**Si la réponse est `{ isAdmin: false }`** :
- Tu n'es pas reconnu comme admin
- Vérifie les logs Vercel pour voir pourquoi

**Si la réponse est `{ isAdmin: true }`** :
- Tu es reconnu comme admin
- Le problème vient du frontend (bouton Admin non affiché)

## Solution 5 : Tester localement avec les variables de production

### Étape 1 : Créer un fichier `.env.local.production`

1. Copie ton fichier `.env.local`
2. Crée un nouveau fichier `.env.local.production`
3. Assure-toi que les variables sont identiques à celles sur Vercel

### Étape 2 : Tester localement

1. Lance `npm run dev` localement
2. Connecte-toi avec `keziah@palmsquare.fr`
3. Va sur `http://localhost:3000/dashboard`
4. Vérifie si le bouton Admin est visible

**Si le bouton Admin est visible localement** :
- Le code fonctionne
- Le problème vient de Vercel (variables d'environnement ou code non déployé)

**Si le bouton Admin n'est pas visible localement** :
- Il y a un problème dans le code
- Vérifie les logs de la console

## Solution 6 : Vérifier que le code est bien déployé

### Étape 1 : Vérifier les fichiers déployés sur Vercel

1. Va sur https://vercel.com
2. Sélectionne ton projet **mofu**
3. Va dans **Deployments**
4. Clique sur le dernier déploiement
5. Va dans l'onglet **Source** ou **Files**

### Étape 2 : Vérifier que les fichiers admin existent

Cherche les fichiers suivants :

- `app/src/app/admin/page.tsx`
- `app/src/app/api/admin/debug/route.ts`
- `app/src/lib/supabase-admin-client.ts`

**Si ces fichiers n'existent pas** :
- Le code n'a pas été déployé
- Tu devras attendre 14 heures pour redéployer

**Si ces fichiers existent** :
- Le code est déployé
- Le problème vient des variables d'environnement ou de la base de données

## Solution 7 : Attendre le prochain déploiement automatique

### Si tu as pushé sur Git

1. Vercel devrait redéployer automatiquement quand tu push sur Git
2. Mais si tu as atteint la limite, cela ne fonctionnera pas
3. Tu devras attendre 14 heures avant de pouvoir redéployer

### Si tu n'as pas pushé sur Git

1. Push tes changements sur Git maintenant
2. Quand la limite sera réinitialisée (dans 14 heures), Vercel redéploiera automatiquement
3. En attendant, utilise les solutions ci-dessus pour diagnostiquer

## Checklist de vérification (sans redéployer)

- [ ] Vérifier les logs Vercel du dernier déploiement
- [ ] Vérifier que `SUPABASE_SERVICE_ROLE_KEY` est définie sur Vercel pour **Production**
- [ ] Vérifier que tu es dans la table `admin_users` dans Supabase (avec SQL)
- [ ] Vérifier la console du navigateur pour les erreurs
- [ ] Vérifier les requêtes réseau vers `/api/auth/check-admin`
- [ ] Tester localement avec les variables de production
- [ ] Vérifier que les fichiers admin existent dans le déploiement Vercel

## Prochaines étapes

1. **Vérifie les logs Vercel** pour voir les erreurs exactes
2. **Vérifie que `SUPABASE_SERVICE_ROLE_KEY` est bien définie** sur Vercel
3. **Vérifie que tu es bien admin** dans Supabase
4. **Utilise la console du navigateur** pour voir les erreurs côté client
5. **Attends 14 heures** avant de pouvoir redéployer (ou utilise Vercel Pro pour plus de déploiements)

## Résumé

**Tu ne peux pas redéployer maintenant**, mais tu peux :
1. ✅ Vérifier les logs Vercel du dernier déploiement
2. ✅ Vérifier les variables d'environnement sur Vercel
3. ✅ Vérifier que tu es admin dans Supabase
4. ✅ Utiliser la console du navigateur pour diagnostiquer
5. ✅ Tester localement avec les variables de production

**Une fois que tu auras diagnostiqué le problème**, tu pourras :
- Corriger les variables d'environnement si nécessaire
- Attendre 14 heures pour redéployer
- Ou passer à Vercel Pro pour plus de déploiements

