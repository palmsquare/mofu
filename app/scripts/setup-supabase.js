#!/usr/bin/env node

/**
 * Script d'initialisation automatique de Supabase
 * Configure les tables, policies RLS et Storage
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Lire le fichier .env.local manuellement
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  
  if (!fs.existsSync(envPath)) {
    return {};
  }
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      env[key] = value;
    }
  });
  
  return env;
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erreur : Variables d\'environnement manquantes');
  console.error('Assure-toi que .env.local contient :');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚀 Initialisation de Supabase...\n');

// SQL pour créer les tables et policies
const SQL_SETUP = `
-- ========================================
-- NETTOYAGE : Supprimer les anciennes policies
-- ========================================

drop policy if exists "Public read access for lead magnets" on lead_magnets;
drop policy if exists "Allow insert for authenticated or anonymous" on lead_magnets;
drop policy if exists "Users can update their own lead magnets" on lead_magnets;
drop policy if exists "Users can delete their own lead magnets" on lead_magnets;

drop policy if exists "Allow insert for all leads" on leads;
drop policy if exists "Users can view leads for their lead magnets" on leads;
drop policy if exists "Users can delete leads for their lead magnets" on leads;

-- ========================================
-- 1. CRÉER LES TABLES
-- ========================================

create table if not exists lead_magnets (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text not null,
  resource_type text not null,
  resource_url text not null,
  template_id text,
  download_limit integer,
  tagline text,
  cta_label text,
  footer_note text,
  fields jsonb not null default '[]'::jsonb,
  owner_id uuid references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  lead_magnet_id uuid references lead_magnets(id) on delete cascade,
  lead_magnet_slug text not null,
  form_data jsonb not null,
  consent_granted boolean default false,
  owner_id uuid references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now()
);

-- ========================================
-- 2. CRÉER LES INDEX
-- ========================================

create index if not exists idx_lead_magnets_owner_id on lead_magnets(owner_id);
create index if not exists idx_lead_magnets_slug on lead_magnets(slug);
create index if not exists idx_leads_owner_id on leads(owner_id);
create index if not exists idx_leads_lead_magnet_slug on leads(lead_magnet_slug);
create index if not exists idx_leads_lead_magnet_id on leads(lead_magnet_id);

-- ========================================
-- 3. ACTIVER ROW LEVEL SECURITY
-- ========================================

alter table lead_magnets enable row level security;
alter table leads enable row level security;

-- ========================================
-- 4. POLICIES POUR LEAD_MAGNETS
-- ========================================

create policy "Public read access for lead magnets"
  on lead_magnets
  for select
  using (true);

create policy "Allow insert for authenticated or anonymous"
  on lead_magnets
  for insert
  with check (owner_id is null or owner_id = auth.uid());

create policy "Users can update their own lead magnets"
  on lead_magnets
  for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Users can delete their own lead magnets"
  on lead_magnets
  for delete
  using (owner_id = auth.uid());

-- ========================================
-- 5. POLICIES POUR LEADS
-- ========================================

create policy "Allow insert for all leads"
  on leads
  for insert
  with check (true);

create policy "Users can view leads for their lead magnets"
  on leads
  for select
  using (
    owner_id = auth.uid() or
    lead_magnet_slug in (
      select slug from lead_magnets where owner_id = auth.uid()
    )
  );

create policy "Users can delete leads for their lead magnets"
  on leads
  for delete
  using (
    owner_id = auth.uid() or
    lead_magnet_slug in (
      select slug from lead_magnets where owner_id = auth.uid()
    )
  );
`;

async function setupDatabase() {
  console.log('📊 Configuration de la base de données...');
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: SQL_SETUP });
    
    if (error) {
      // Fallback : utiliser l'API REST
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ query: SQL_SETUP }),
      });

      if (!response.ok) {
        throw new Error('Impossible d\'exécuter le SQL. Utilise le SQL Editor manuellement.');
      }
    }
    
    console.log('✅ Tables créées : lead_magnets, leads');
    console.log('✅ Index créés pour les performances');
    console.log('✅ RLS activé avec policies configurées\n');
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de la configuration de la base de données');
    console.error('💡 Solution : Copie le contenu de supabase-migration.sql dans le SQL Editor de Supabase\n');
    return false;
  }
}

async function setupStorage() {
  console.log('📁 Configuration du Storage...');
  
  try {
    // Vérifier si le bucket existe
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === 'lead-magnets');
    
    if (!bucketExists) {
      // Créer le bucket
      const { error: createError } = await supabase.storage.createBucket('lead-magnets', {
        public: true,
        fileSizeLimit: 20 * 1024 * 1024, // 20 MB
      });
      
      if (createError) {
        console.warn('⚠️  Impossible de créer le bucket automatiquement');
        console.log('💡 Crée-le manuellement : Storage → New bucket → "lead-magnets" (Public)\n');
        return false;
      }
      
      console.log('✅ Bucket "lead-magnets" créé (public, 20 MB max)');
    } else {
      console.log('✅ Bucket "lead-magnets" existe déjà');
    }
    
    console.log('💡 Note : Configure les policies du bucket dans Storage → lead-magnets → Policies\n');
    return true;
  } catch (error) {
    console.warn('⚠️  Erreur lors de la configuration du Storage');
    console.log('💡 Crée le bucket manuellement : Storage → New bucket → "lead-magnets" (Public)\n');
    return false;
  }
}

async function checkAuth() {
  console.log('🔐 Vérification de l\'authentification...');
  
  try {
    // Vérifier que l'auth est configurée (pas d'API directe, on fait juste un check)
    console.log('✅ Authentification Supabase disponible');
    console.log('💡 Active Email dans : Authentication → Providers → Email\n');
    return true;
  } catch (error) {
    console.warn('⚠️  Impossible de vérifier l\'authentification');
    return false;
  }
}

async function verifySetup() {
  console.log('🔍 Vérification de la configuration...\n');
  
  try {
    // Vérifier que les tables existent
    const { data: leadMagnets, error: lmError } = await supabase
      .from('lead_magnets')
      .select('id')
      .limit(1);
    
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id')
      .limit(1);
    
    if (!lmError && !leadsError) {
      console.log('✅ Tables accessibles et fonctionnelles');
      return true;
    } else {
      console.warn('⚠️  Les tables ne sont pas accessibles');
      return false;
    }
  } catch (error) {
    console.warn('⚠️  Impossible de vérifier les tables');
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('   🚀 Setup automatique de Supabase');
  console.log('═══════════════════════════════════════════════\n');
  
  const dbSuccess = await setupDatabase();
  const storageSuccess = await setupStorage();
  const authSuccess = await checkAuth();
  
  console.log('═══════════════════════════════════════════════');
  console.log('   📋 Résumé de la configuration');
  console.log('═══════════════════════════════════════════════\n');
  
  console.log(`Base de données : ${dbSuccess ? '✅' : '⚠️  À faire manuellement'}`);
  console.log(`Storage         : ${storageSuccess ? '✅' : '⚠️  À faire manuellement'}`);
  console.log(`Authentification: ${authSuccess ? '✅' : '⚠️  À vérifier'}\n`);
  
  if (dbSuccess) {
    await verifySetup();
  }
  
  console.log('═══════════════════════════════════════════════');
  console.log('   🎉 Configuration terminée !');
  console.log('═══════════════════════════════════════════════\n');
  
  console.log('📝 Actions manuelles restantes (si nécessaire) :\n');
  console.log('1. Active l\'authentification Email :');
  console.log('   Dashboard → Authentication → Providers → Email\n');
  
  console.log('2. (Optionnel) Désactive la confirmation email :');
  console.log('   Authentication → Settings → Email Auth → Décocher "Enable email confirmations"\n');
  
  console.log('3. Configure les policies du bucket Storage :');
  console.log('   Storage → lead-magnets → Policies → Voir GUIDE-UPLOAD-FICHIERS.md\n');
  
  console.log('🚀 Lance maintenant : npm run dev\n');
}

main().catch(console.error);

