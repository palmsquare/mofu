#!/bin/bash

# Script pour restructurer le projet et déplacer app/ à la racine
# ⚠️ ATTENTION : Cette opération est irréversible

echo "🔄 Restructuration du projet..."
echo "📦 Déplacement du contenu de app/ à la racine..."

cd /Users/keziah/Downloads/mofu

# Sauvegarder les fichiers à la racine (sauf app/)
mkdir -p .backup
cp -r app .backup/

# Déplacer le contenu de app/ à la racine
mv app/* .
mv app/.* . 2>/dev/null || true

# Supprimer le dossier app/ vide
rmdir app 2>/dev/null || true

# Déplacer les fichiers de documentation
mkdir -p docs
mv *.md docs/ 2>/dev/null || true
mv *.sql docs/ 2>/dev/null || true

echo "✅ Restructuration terminée !"
echo ""
echo "📝 Prochaines étapes :"
echo "1. git add ."
echo "2. git commit -m 'Restructure: Move Next.js app to root'"
echo "3. git push origin main"
echo "4. Sur Vercel : Supprime le Root Directory (laisse vide)"
echo "5. Redéploie sur Vercel"
echo ""
echo "⚠️  Backup sauvegardé dans .backup/"

