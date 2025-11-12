-- ========================================
-- CONFIGURATION MANUELLE SUPABASE
-- Si le script automatique ne fonctionne pas,
-- copie-colle ce SQL dans le SQL Editor
-- ========================================

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

-- ========================================
-- ✅ TERMINÉ !
-- ========================================
-- Tables créées : lead_magnets, leads
-- Index créés pour les performances
-- RLS activé avec policies configurées
--
-- Actions manuelles restantes :
-- 1. Authentication → Providers → Active Email
-- 2. Storage → New bucket → "lead-magnets" (Public)
-- 3. Storage → lead-magnets → Policies (voir GUIDE-UPLOAD-FICHIERS.md)
-- ========================================


