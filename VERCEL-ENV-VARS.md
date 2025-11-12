# Configuration des variables d'environnement sur Vercel

## Problème : Admin fonctionne en local mais pas sur Vercel

Si l'admin fonctionne en local mais pas sur Vercel, c'est probablement un problème de variables d'environnement.

## Solution : Vérifier et configurer les variables sur Vercel

### Étape 1 : Accéder aux variables d'environnement

1. Va sur https://vercel.com
2. Sélectionne ton projet **mofu**
3. Va dans **Settings** → **Environment Variables**

### Étape 2 : Vérifier les variables suivantes

Assure-toi que ces variables sont définies pour **Production**, **Preview**, et **Development** :

#### Variables obligatoires :

```
NEXT_PUBLIC_SUPABASE_URL=https://vjgprpnwxizfkvkjklzs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ton-anon-key
SUPABASE_SERVICE_ROLE_KEY=ton-service-role-key
NEXT_PUBLIC_SITE_URL=https://mofu.fr
```

**⚠️ IMPORTANT** : `SUPABASE_SERVICE_ROLE_KEY` est **OBLIGATOIRE** pour que l'admin fonctionne. Sans cette variable, la vérification admin échouera silencieusement.

### Étape 3 : Où trouver les valeurs

#### 1. NEXT_PUBLIC_SUPABASE_URL

- Va sur https://supabase.com/dashboard
- Sélectionne ton projet
- Va dans **Settings** → **API**
- Copie la valeur de **Project URL**

#### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY

- Dans la même page (Settings → API)
- Copie la valeur de **anon/public** key

#### 3. SUPABASE_SERVICE_ROLE_KEY

- Dans la même page (Settings → API)
- Copie la valeur de **service_role** key
- **⚠️ ATTENTION** : Cette clé est très sensible. Ne la partage jamais publiquement.

#### 4. NEXT_PUBLIC_SITE_URL

- Ta valeur est : `https://mofu.fr`

### Étape 4 : Ajouter les variables sur Vercel

1. Dans **Settings** → **Environment Variables**
2. Clique sur **Add New**
3. Pour chaque variable :
   - **Key** : le nom de la variable (ex: `SUPABASE_SERVICE_ROLE_KEY`)
   - **Value** : la valeur de la variable
   - **Environment** : sélectionne **Production**, **Preview**, et **Development**
4. Clique sur **Save**

### Étape 5 : Redéployer

1. Va dans **Deployments**
2. Trouve le dernier déploiement
3. Clique sur les **3 points** à côté
4. Clique sur **Redeploy**
5. Attends que le déploiement soit terminé

### Étape 6 : Vérifier les logs

1. Va dans **Deployments**
2. Clique sur le dernier déploiement
3. Va dans l'onglet **Logs**
4. Cherche les erreurs suivantes :

```
Missing required environment variables: SUPABASE_SERVICE_ROLE_KEY
[supabase-admin-client] Missing required environment variables
```

Si tu vois ces erreurs, c'est que `SUPABASE_SERVICE_ROLE_KEY` n'est pas définie.

## Checklist de vérification

- [ ] `NEXT_PUBLIC_SUPABASE_URL` est définie sur Vercel pour **Production**
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` est définie sur Vercel pour **Production**
- [ ] `SUPABASE_SERVICE_ROLE_KEY` est définie sur Vercel pour **Production** ⚠️ **OBLIGATOIRE**
- [ ] `NEXT_PUBLIC_SITE_URL` est définie sur Vercel pour **Production**
- [ ] Toutes les variables sont définies pour **Production**, **Preview**, et **Development**
- [ ] Le projet a été redéployé après l'ajout des variables
- [ ] Tu t'es déconnecté et reconnecté après le déploiement
- [ ] Tu as vidé le cache du navigateur

## Test rapide

### 1. Vérifier que les variables sont bien définies

Après le redéploiement, les logs Vercel ne devraient **PAS** contenir :
- `Missing required environment variables`
- `Missing Supabase URL or Service Role Key`

### 2. Tester l'accès admin

1. Va sur https://mofu.fr
2. Déconnecte-toi si tu es connecté
3. Vide le cache du navigateur (Ctrl+Shift+Delete)
4. Reconnecte-toi avec `keziah@palmsquare.fr`
5. Tu devrais être redirigé vers `/admin`
6. Si tu es sur `/dashboard`, vérifie si le bouton **Admin** est visible

### 3. Vérifier la console du navigateur

1. Ouvre la console (F12 ou Cmd+Option+I)
2. Va dans l'onglet **Console**
3. Cherche les logs suivants :

```
[dashboard] Admin check result: { isAdmin: true, ... }
```

Si tu vois `isAdmin: false`, c'est que la vérification admin échoue. Vérifie les logs Vercel pour voir pourquoi.

## Problèmes courants

### Erreur : "Missing required environment variables: SUPABASE_SERVICE_ROLE_KEY"

**Solution** : 
1. Vérifie que `SUPABASE_SERVICE_ROLE_KEY` est bien définie sur Vercel
2. Vérifie qu'elle est définie pour **Production**
3. Redéploie le projet

### Erreur : "Missing Supabase URL or Service Role Key"

**Solution** : Même chose que ci-dessus. Vérifie que toutes les variables sont bien définies.

### Admin fonctionne en local mais pas sur Vercel

**Solution** : 
1. Vérifie que `SUPABASE_SERVICE_ROLE_KEY` est bien définie sur Vercel
2. Vérifie que la valeur est correcte (copie-colle depuis Supabase)
3. Redéploie le projet
4. Vide le cache du navigateur
5. Déconnecte-toi et reconnecte-toi

## Support

Si le problème persiste après avoir vérifié toutes les étapes :
1. Vérifie les logs Vercel pour voir les erreurs exactes
2. Vérifie que toutes les variables sont bien définies
3. Vérifie que la valeur de `SUPABASE_SERVICE_ROLE_KEY` est correcte
4. Redéploie le projet
5. Teste à nouveau

