# 🚀 Setup automatique de Supabase

## ✨ Une seule commande pour tout configurer !

J'ai créé un script qui configure automatiquement :
- ✅ Tables `lead_magnets` et `leads`
- ✅ Index de performance
- ✅ Row Level Security (RLS) avec policies
- ✅ Bucket Storage `lead-magnets`

---

## 🎯 Utilisation

### Étape 1 : Lance le script

```bash
cd /Users/keziah/Downloads/mofu/app
npm run setup:supabase
```

### Étape 2 : Suis les instructions

Le script va :
1. ✅ Créer les tables dans Supabase
2. ✅ Configurer les policies RLS
3. ✅ Créer le bucket Storage (si possible)
4. ✅ Vérifier que tout fonctionne

### Étape 3 : Actions manuelles (si nécessaire)

Le script te dira exactement ce qu'il reste à faire manuellement :

#### A. Activer l'authentification Email
1. Va sur : https://supabase.com/dashboard/project/vjgprpnwxizfkvkjklzs
2. **Authentication** → **Providers** → Active **Email** ✅

#### B. (Optionnel) Désactiver la confirmation email
1. **Authentication** → **Settings** → **Email Auth**
2. Décocher **"Enable email confirmations"** ✅

#### C. Configurer les policies du bucket Storage
Si le bucket a été créé automatiquement, configure les policies :

1. **Storage** → `lead-magnets` → **Policies** → **New policy**
2. Copie-colle ce SQL :

```sql
create policy "Allow public uploads"
on storage.objects for insert
to public
with check (bucket_id = 'lead-magnets');

create policy "Allow public reads"
on storage.objects for select
to public
using (bucket_id = 'lead-magnets');
```

---

## 🐛 Si le script ne fonctionne pas

### Plan B : Configuration manuelle

Si le script automatique échoue, utilise le fichier SQL manuel :

1. Va dans **SQL Editor** de Supabase
2. Copie-colle le contenu de `scripts/setup-supabase-manual.sql`
3. Clique sur **"Run"**

Ensuite :
- Crée le bucket manuellement : **Storage** → **New bucket** → `lead-magnets` (Public)
- Configure les policies du bucket (SQL ci-dessus)

---

## ✅ Vérification

Après le setup, vérifie que tout est OK :

### 1. Tables créées
**Table Editor** → Tu devrais voir :
- ✅ `lead_magnets` (avec colonnes id, slug, title, owner_id, etc.)
- ✅ `leads` (avec colonnes id, lead_magnet_id, form_data, owner_id, etc.)

### 2. Policies actives
**Table Editor** → `lead_magnets` → **Policies** :
- ✅ 4 policies visibles

**Table Editor** → `leads` → **Policies** :
- ✅ 3 policies visibles

### 3. Bucket Storage
**Storage** → Tu devrais voir :
- ✅ Bucket `lead-magnets` (Public)

### 4. Authentification
**Authentication** → **Providers** :
- ✅ Email activé

---

## 🧪 Teste l'application

Une fois tout configuré :

```bash
npm run dev
```

1. Va sur http://localhost:3000
2. Colle un lien : `https://example.com/guide.pdf`
3. Clique sur "Générer le lien"
4. Clique sur "Créer mon compte"
5. Entre email + mot de passe
6. ✅ Redirection vers `/dashboard` avec ton lead magnet !

---

## 📋 Résumé des fichiers créés

- `scripts/setup-supabase.js` - Script automatique Node.js
- `scripts/setup-supabase-manual.sql` - SQL de secours si le script échoue
- `package.json` - Ajout du script `setup:supabase`

---

## 💡 Commandes utiles

```bash
# Setup automatique
npm run setup:supabase

# Démarrer le serveur
npm run dev

# Vérifier les erreurs
npm run lint

# Builder pour production
npm run build
```

---

## 🎉 C'est tout !

Une fois le script exécuté et les actions manuelles faites, ton app est prête à l'emploi !

**Lance maintenant :**
```bash
npm run setup:supabase
```

Si tu as un problème, envoie-moi le message d'erreur exact ! 🚀


