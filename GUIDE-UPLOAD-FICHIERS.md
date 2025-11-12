# 📁 Guide : Activer l'upload de fichiers

## ✅ Ce qui a été fait

J'ai implémenté l'upload de fichiers vers Supabase Storage :

- ✅ API `/api/uploads` mise à jour pour uploader vers Supabase
- ✅ `home-hero.tsx` modifié pour envoyer les fichiers à l'API
- ✅ `builder-client.tsx` et `lead-magnet-wizard.tsx` mis à jour pour gérer les URLs de fichiers
- ✅ Support des types de fichiers : PDF, images (JPG, PNG, GIF, WEBP), ZIP, DOCX, PPTX
- ✅ Limite de 20 Mo par fichier
- ✅ Indicateur visuel "Upload en cours..."

---

## 🔧 Configuration Supabase Storage (OBLIGATOIRE)

### Étape 1 : Créer le bucket "lead-magnets"

1. Va sur ton dashboard Supabase : https://supabase.com/dashboard/project/vjgprpnwxizfkvkjklzs
2. Clique sur **"Storage"** dans le menu de gauche
3. Clique sur **"New bucket"**
4. Configure le bucket :
   - **Name** : `lead-magnets`
   - **Public bucket** : ✅ **COCHER** (pour que les fichiers soient accessibles publiquement)
   - **File size limit** : `20` MB
   - **Allowed MIME types** : Laisser vide (ou ajouter : `application/pdf, image/*, application/zip, application/vnd.openxmlformats-officedocument.*`)
5. Clique sur **"Create bucket"**

### Étape 2 : Configurer les permissions (RLS)

Par défaut, le bucket est public mais tu dois configurer les policies :

1. Dans **Storage** → Clique sur le bucket `lead-magnets`
2. Va dans l'onglet **"Policies"**
3. Clique sur **"New policy"**

#### Policy 1 : Upload (INSERT)

```sql
-- Permettre à tout le monde d'uploader des fichiers
create policy "Allow public uploads"
on storage.objects for insert
to public
with check (bucket_id = 'lead-magnets');
```

#### Policy 2 : Lecture (SELECT)

```sql
-- Permettre à tout le monde de lire les fichiers (déjà public)
create policy "Allow public reads"
on storage.objects for select
to public
using (bucket_id = 'lead-magnets');
```

#### Policy 3 : Suppression (DELETE) - Optionnel

```sql
-- Permettre aux utilisateurs authentifiés de supprimer leurs fichiers
create policy "Allow authenticated users to delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'lead-magnets');
```

### Étape 3 : Vérifier la configuration

1. Va dans **Storage** → `lead-magnets`
2. Tu devrais voir :
   - ✅ Bucket créé
   - ✅ Public : **Yes**
   - ✅ Policies actives

---

## 🧪 Tester l'upload

### Test 1 : Upload d'un fichier

1. Redémarre le serveur si nécessaire :
   ```bash
   cd /Users/keziah/Downloads/mofu/app
   npm run dev
   ```

2. Va sur http://localhost:3000

3. **Drag & drop** un fichier PDF (ou clique pour sélectionner)

4. Tu devrais voir :
   - ✅ Message "Upload en cours..."
   - ✅ Redirection vers `/builder` avec le fichier
   - ✅ Le fichier est maintenant sur Supabase Storage

5. Vérifie dans Supabase :
   - **Storage** → `lead-magnets`
   - Tu devrais voir ton fichier uploadé (nom : `timestamp_random.pdf`)

### Test 2 : Créer un lead magnet avec le fichier

1. Sur la page `/builder`, personnalise ta page
2. Clique sur **"Générer le lien"**
3. Le `resource_url` dans la base de données devrait être une URL Supabase :
   ```
   https://vjgprpnwxizfkvkjklzs.supabase.co/storage/v1/object/public/lead-magnets/1234567890_abc123.pdf
   ```

### Test 3 : Vérifier l'accès public

1. Copie l'URL du fichier depuis Supabase Storage
2. Ouvre-la dans un nouvel onglet
3. Le fichier devrait se télécharger ou s'afficher ✅

---

## 📊 Types de fichiers supportés

| Type | Extensions | MIME Type |
|------|-----------|-----------|
| PDF | `.pdf` | `application/pdf` |
| Images | `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp` | `image/*` |
| Archives | `.zip` | `application/zip` |
| Word | `.docx` | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| PowerPoint | `.pptx` | `application/vnd.openxmlformats-officedocument.presentationml.presentation` |

---

## 🐛 Dépannage

### Erreur : "Erreur lors de l'upload du fichier"

**Cause** : Le bucket `lead-magnets` n'existe pas ou n'est pas public  
**Solution** : Crée le bucket et coche "Public bucket"

### Erreur : "new row violates row-level security policy"

**Cause** : Les policies RLS ne sont pas configurées  
**Solution** : Exécute les policies SQL ci-dessus dans le SQL Editor

### Erreur : "Type de fichier non autorisé"

**Cause** : Le type MIME du fichier n'est pas dans la liste autorisée  
**Solution** : Vérifie que ton fichier est bien un PDF, image, ZIP, DOCX ou PPTX

### Le fichier s'uploade mais l'URL ne fonctionne pas

**Cause** : Le bucket n'est pas public  
**Solution** : 
1. Va dans **Storage** → `lead-magnets` → **Settings**
2. Coche **"Public bucket"**
3. Sauvegarde

### Erreur : "File too large"

**Cause** : Le fichier dépasse 20 Mo  
**Solution** : Utilise un fichier plus petit ou augmente la limite dans :
- `home-hero.tsx` : `MAX_FREE_BYTES`
- `/api/uploads/route.ts` : `MAX_FILE_SIZE`
- Supabase Storage bucket settings

---

## 🔐 Sécurité

### Bonnes pratiques

1. **Limite de taille** : 20 Mo par défaut (configurable)
2. **Types de fichiers** : Whitelist stricte des MIME types
3. **Noms de fichiers** : Générés automatiquement (timestamp + random)
4. **Scan antivirus** : À implémenter pour la production (Supabase ne le fait pas automatiquement)
5. **Quota utilisateur** : À implémenter (limiter le nombre d'uploads par IP/user)

### Pour la production

- [ ] Ajouter un scan antivirus (ClamAV ou service externe)
- [ ] Implémenter des quotas par utilisateur
- [ ] Ajouter une compression automatique des images
- [ ] Mettre en place un CDN (Cloudflare) devant Supabase Storage
- [ ] Logger tous les uploads pour audit

---

## 📈 Prochaines étapes

### Fonctionnalités à ajouter

1. **Prévisualisation** : Afficher un aperçu du fichier avant upload
2. **Compression** : Compresser automatiquement les images
3. **Miniatures** : Générer des thumbnails pour les images/PDFs
4. **Gestion** : Permettre la suppression des fichiers depuis le dashboard
5. **Statistiques** : Afficher l'espace de stockage utilisé par utilisateur

### Optimisations

1. **Upload progressif** : Afficher une barre de progression
2. **Upload par chunks** : Pour les gros fichiers (>20 Mo)
3. **Retry automatique** : En cas d'échec réseau
4. **Cache** : Mettre en cache les URLs de fichiers

---

## ✅ Checklist finale

Avant de tester :

- [ ] Bucket `lead-magnets` créé dans Supabase Storage
- [ ] Bucket configuré en **Public**
- [ ] Policies RLS créées (INSERT + SELECT)
- [ ] Serveur redémarré (`npm run dev`)
- [ ] Fichier de test prêt (PDF < 20 Mo)

Après le premier upload :

- [ ] Fichier visible dans Supabase Storage
- [ ] URL du fichier accessible publiquement
- [ ] Lead magnet créé avec la bonne URL dans `resource_url`
- [ ] Page de capture générée avec le lien de téléchargement

---

## 🎉 C'est prêt !

Une fois le bucket créé et les policies configurées, tu pourras :

1. ✅ **Uploader des fichiers** directement depuis la homepage
2. ✅ **Stocker** les fichiers sur Supabase Storage
3. ✅ **Partager** les liens publics des fichiers
4. ✅ **Gérer** les fichiers depuis le dashboard Supabase

**Teste maintenant !** 🚀

1. Crée le bucket `lead-magnets` dans Supabase
2. Configure les policies
3. Upload un fichier PDF sur http://localhost:3000
4. Vérifie qu'il apparaît dans Supabase Storage

Si tu as un problème, envoie-moi le message d'erreur exact !


