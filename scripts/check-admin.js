/**
 * Script pour vérifier si un utilisateur est admin
 * 
 * Usage:
 *   node scripts/check-admin.js <email>
 * 
 * Exemple:
 *   node scripts/check-admin.js admin@example.com
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

async function checkAdmin(email) {
  if (!email) {
    console.error('❌ Erreur: Tu dois fournir un email');
    console.log('Usage: node scripts/check-admin.js <email>');
    process.exit(1);
  }

  try {
    // 1. Vérifier si la table admin_users existe
    console.log('🔍 Vérification de la table admin_users...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('admin_users')
      .select('*')
      .limit(1);

    if (tableError) {
      if (tableError.code === '42P01' || tableError.message?.includes('does not exist')) {
        console.error('❌ La table admin_users n\'existe pas.');
        console.log('💡 Solution: Exécute le script SQL supabase-admin.sql dans Supabase SQL Editor');
        process.exit(1);
      } else {
        console.error('❌ Erreur lors de la vérification de la table:', tableError);
        process.exit(1);
      }
    }

    console.log('✅ La table admin_users existe.');

    // 2. Trouver l'utilisateur par email
    console.log(`🔍 Recherche de l'utilisateur avec l'email: ${email}...`);
    
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Erreur lors de la récupération des utilisateurs:', usersError);
      process.exit(1);
    }

    const user = users.users.find(u => u.email === email);

    if (!user) {
      console.error(`❌ Aucun utilisateur trouvé avec l'email: ${email}`);
      console.log('💡 Conseil: Crée d\'abord un compte utilisateur sur ton site.');
      process.exit(1);
    }

    console.log(`✅ Utilisateur trouvé: ${user.email} (ID: ${user.id})`);

    // 3. Vérifier si l'utilisateur est admin
    console.log(`🔍 Vérification du statut admin...`);
    
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (adminError) {
      if (adminError.code === 'PGRST116') {
        console.log(`⚠️  L'utilisateur ${email} n'est PAS admin.`);
        console.log('');
        console.log('💡 Pour créer cet admin, exécute:');
        console.log(`   npm run create:admin ${email}`);
        console.log('');
        console.log('Ou manuellement avec SQL:');
        console.log(`   INSERT INTO admin_users (user_id, email, role)`);
        console.log(`   VALUES ('${user.id}', '${email}', 'admin');`);
        process.exit(0);
      } else {
        console.error('❌ Erreur lors de la vérification:', adminError);
        process.exit(1);
      }
    }

    if (!adminUser) {
      console.log(`⚠️  L'utilisateur ${email} n'est PAS admin.`);
      process.exit(0);
    }

    console.log('✅ L\'utilisateur est admin!');
    console.log('');
    console.log('📋 Détails:');
    console.log(`   - Email: ${adminUser.email}`);
    console.log(`   - Rôle: ${adminUser.role}`);
    console.log(`   - User ID: ${adminUser.user_id}`);
    console.log(`   - Créé le: ${adminUser.created_at}`);
    console.log('');
    console.log('🎉 Tu peux maintenant accéder à /admin');
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

// Récupérer l'email depuis les arguments de la ligne de commande
const email = process.argv[2];

checkAdmin(email);

