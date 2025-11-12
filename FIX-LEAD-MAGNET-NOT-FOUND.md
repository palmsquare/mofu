# 🔧 FIX : Erreur "Lead magnet introuvable"

## 🎯 Problème

Quand tu cliques sur le lien généré (ex: `https://mofu.fr/c/lm_xxxxx`), tu vois "Lead magnet introuvable".

## ✅ Corrections effectuées

1. **Next.js 15 params Promise** : Les `params` sont maintenant des Promises dans Next.js 15
2. **Client anonyme Supabase** : Utilisation d'un client anonyme pour respecter les RLS policies publiques
3. **Logs de diagnostic** : Ajout de logs pour débugger

## 🔍 Diagnostic : Vérifier dans Supabase

### Étape 1 : Vérifier que le lead magnet existe

1. Va sur **Supabase Dashboard** : https://supabase.com/dashboard/project/vjgprpnwxizfkvkjklzs
2. Va dans **Table Editor** → `lead_magnets`
3. Vérifie que tu vois tes lead magnets créés
4. Copie le **slug** d'un lead magnet (ex: `lm_abc123`)

### Étape 2 : Vérifier les RLS Policies

1. Dans **Supabase Dashboard** → **Table Editor** → `lead_magnets`
2. Clique sur **Policies** (en haut)
3. Vérifie que tu as ces policies :

#### Policy 1 : "Public read access for lead magnets"
```sql
CREATE POLICY "Public read access for lead magnets"
  ON lead_magnets
  FOR SELECT
  USING (true);
```

Cette policy permet à **tout le monde** (y compris les utilisateurs non authentifiés) de lire les lead magnets.

#### Policy 2 : "Allow insert for authenticated or anonymous"
```sql
CREATE POLICY "Allow insert for authenticated or anonymous"
  ON lead_magnets
  FOR INSERT
  WITH CHECK (
    owner_id IS NULL OR owner_id = auth.uid()
  );
```

### Étape 3 : Vérifier que les policies sont actives

1. Dans **Supabase Dashboard** → **Table Editor** → `lead_magnets`
2. Clique sur **Policies**
3. Vérifie que les policies ont un **toggle vert** (activées)

### Étape 4 : Tester la query manuellement

Dans **Supabase Dashboard** → **SQL Editor**, exécute cette query :

```sql
SELECT * FROM lead_magnets WHERE slug = 'lm_xxxxx';
```

Remplace `lm_xxxxx` par le slug d'un de tes lead magnets.

- ✅ Si tu vois le lead magnet → Le problème vient du code
- ❌ Si tu ne vois rien → Le lead magnet n'existe pas dans la base de données

### Étape 5 : Vérifier les logs Vercel

1. Va sur **Vercel Dashboard** → **Deployments**
2. Clique sur le dernier déploiement
3. Va dans **Functions** → Regarde les logs
4. Cherche les erreurs liées à `[capture-page]`

Tu devrais voir :
- `[capture-page] Looking for slug: lm_xxxxx`
- `[capture-page] Found lead magnet: ...` (si trouvé)
- `[capture-page] Lead magnet not found for slug: ...` (si non trouvé)

---

## 🔧 Solution : Recréer les RLS Policies

Si les policies ne sont pas correctes, exécute ce SQL dans **Supabase Dashboard** → **SQL Editor** :

```sql
-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Public read access for lead magnets" ON lead_magnets;
DROP POLICY IF EXISTS "Users can view their own lead magnets" ON lead_magnets;
DROP POLICY IF EXISTS "Allow insert for authenticated or anonymous" ON lead_magnets;

-- Recréer la policy publique (lecture pour tous)
CREATE POLICY "Public read access for lead magnets"
  ON lead_magnets
  FOR SELECT
  USING (true);

-- Policy pour l'insertion (anonyme ou authentifiée)
CREATE POLICY "Allow insert for authenticated or anonymous"
  ON lead_magnets
  FOR INSERT
  WITH CHECK (
    owner_id IS NULL OR owner_id = auth.uid()
  );

-- Policy pour la mise à jour (propriétaire uniquement)
CREATE POLICY "Users can update their own lead magnets"
  ON lead_magnets
  FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Policy pour la suppression (propriétaire uniquement)
CREATE POLICY "Users can delete their own lead magnets"
  ON lead_magnets
  FOR DELETE
  USING (owner_id = auth.uid());
```

---

## 🧪 Test après correction

1. **Crée un nouveau lead magnet** sur https://mofu.fr
2. **Copie le lien généré** (ex: `https://mofu.fr/c/lm_xxxxx`)
3. **Ouvre le lien** dans un nouvel onglet (navigation privée)
4. ✅ Tu devrais voir la page de capture avec le formulaire

---

## 📋 Checklist de vérification

- [ ] Le lead magnet existe dans Supabase (Table Editor → lead_magnets)
- [ ] La policy "Public read access for lead magnets" existe et est active
- [ ] La query SQL manuelle fonctionne : `SELECT * FROM lead_magnets WHERE slug = '...'`
- [ ] Les logs Vercel ne montrent pas d'erreurs
- [ ] Le slug dans l'URL correspond au slug dans la base de données
- [ ] Le redéploiement Vercel est terminé

---

## 🚀 Si ça ne fonctionne toujours pas

1. **Vérifie les logs Vercel** pour voir l'erreur exacte
2. **Teste la query SQL** directement dans Supabase
3. **Vérifie que le slug est correct** dans l'URL générée
4. **Crée un nouveau lead magnet** pour tester avec un slug frais

---

**Dis-moi ce que tu vois dans les logs Vercel ou dans Supabase !** 🚀

