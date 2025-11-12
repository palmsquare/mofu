/**
 * Script pour créer un utilisateur admin
 * 
 * Usage:
 *   node scripts/create-admin.js <email>
 * 
 * Exemple:
 *   node scripts/create-admin.js admin@example.com
 */

const fs = require('fs');
const path = require('path');

// Load @supabase/supabase-js from app/node_modules
const appNodeModules = path.join(__dirname, '..', 'app', 'node_modules');
const supabasePath = path.join(appNodeModules, '@supabase', 'supabase-js');
const { createClient } = require(supabasePath);

// Load environment variables from app/.env.local
const envPath = path.join(__dirname, '..', 'app', '.env.local');
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

async function createAdmin(email) {
  if (!email) {
    console.error('❌ Erreur: Tu dois fournir un email');
    console.log('Usage: node scripts/create-admin.js <email>');
    process.exit(1);
  }

  try {
    // 1. Trouver l'utilisateur par email
    console.log(`🔍 Recherche de l'utilisateur avec l'email: ${email}...`);
    
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Erreur lors de la récupération des utilisateurs:', usersError);
      process.exit(1);
    }

    const user = users.users.find(u => u.email === email);

    if (!user) {
      console.error(`❌ Aucun utilisateur trouvé avec l'email: ${email}`);
      console.log('💡 Conseil: Crée d\'abord un compte utilisateur sur ton site, puis exécute ce script.');
      process.exit(1);
    }

    console.log(`✅ Utilisateur trouvé: ${user.email} (ID: ${user.id})`);

    // 2. Vérifier si l'utilisateur est déjà admin
    const { data: existingAdmin, error: checkError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Erreur lors de la vérification:', checkError);
      process.exit(1);
    }

    if (existingAdmin) {
      console.log(`⚠️  L'utilisateur ${email} est déjà admin (rôle: ${existingAdmin.role})`);
      process.exit(0);
    }

    // 3. Créer l'admin
    console.log(`🔧 Création de l'admin...`);
    
    const { data: newAdmin, error: insertError } = await supabase
      .from('admin_users')
      .insert({
        user_id: user.id,
        email: user.email,
        role: 'admin',
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erreur lors de la création de l\'admin:', insertError);
      process.exit(1);
    }

    console.log('✅ Admin créé avec succès!');
    console.log('');
    console.log('📋 Détails:');
    console.log(`   - Email: ${newAdmin.email}`);
    console.log(`   - Rôle: ${newAdmin.role}`);
    console.log(`   - User ID: ${newAdmin.user_id}`);
    console.log('');
    console.log('🎉 Tu peux maintenant accéder à l\'espace admin en allant sur /admin');
    console.log('💡 Utilise ton email et mot de passe normal pour te connecter');
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

// Récupérer l'email depuis les arguments de la ligne de commande
const email = process.argv[2];

createAdmin(email);

