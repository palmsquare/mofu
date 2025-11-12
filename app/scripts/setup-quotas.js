/**
 * Script pour créer la table user_quotas et les politiques RLS
 * 
 * Usage:
 *   node scripts/setup-quotas.js
 * 
 * Ce script exécute le fichier SQL supabase-quotas.sql sur Supabase
 */

const fs = require('fs');
const path = require('path');

// Load @supabase/supabase-js from app/node_modules
const appNodeModules = path.join(__dirname, '..', 'node_modules');
const supabasePath = path.join(appNodeModules, '@supabase', 'supabase-js');
const { createClient } = require(supabasePath);

// Load environment variables from app/.env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    // Skip comments and empty lines
    if (line.trim().startsWith('#') || !line.trim()) return;
    
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
} else {
  console.error('❌ Erreur: Le fichier app/.env.local n\'existe pas');
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Erreur: NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être définis dans app/.env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function setupQuotas() {
  try {
    console.log('🔍 Lecture du fichier SQL...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', '..', 'supabase-quotas.sql');
    if (!fs.existsSync(sqlPath)) {
      console.error(`❌ Erreur: Le fichier ${sqlPath} n'existe pas`);
      process.exit(1);
    }
    
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('✅ Fichier SQL lu avec succès');
    
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Exécution de ${statements.length} requêtes SQL...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments
      if (statement.startsWith('--')) {
        continue;
      }
      
      try {
        // Use RPC to execute SQL (if available) or use direct query
        // Note: Supabase JS client doesn't support raw SQL execution directly
        // We need to use the REST API or create a migration
        console.log(`⏳ Exécution de la requête ${i + 1}/${statements.length}...`);
        
        // For now, we'll just validate the SQL file exists and provide instructions
        // The user needs to run this SQL in Supabase SQL Editor
        console.log('⚠️  Note: Supabase JS client ne peut pas exécuter du SQL brut directement.');
        console.log('💡 Tu dois exécuter ce script SQL manuellement dans Supabase SQL Editor.');
        console.log('');
        console.log('📋 Instructions:');
        console.log('1. Va sur https://supabase.com/dashboard');
        console.log('2. Sélectionne ton projet');
        console.log('3. Va dans SQL Editor');
        console.log('4. Crée une nouvelle requête');
        console.log('5. Copie-colle le contenu du fichier supabase-quotas.sql');
        console.log('6. Clique sur Run pour exécuter le script');
        console.log('');
        console.log('📁 Fichier SQL:', sqlPath);
        console.log('');
        
        // Show first few lines of SQL as preview
        const preview = sql.split('\n').slice(0, 10).join('\n');
        console.log('📄 Aperçu du script SQL:');
        console.log(preview);
        console.log('...');
        console.log('');
        
        process.exit(0);
      } catch (error) {
        console.error(`❌ Erreur lors de l'exécution de la requête ${i + 1}:`, error);
        process.exit(1);
      }
    }
    
    console.log('✅ Toutes les requêtes ont été exécutées avec succès!');
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

setupQuotas();

