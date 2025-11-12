-- Migration pour ajouter owner_id et RLS policies
-- À exécuter dans le SQL Editor de Supabase

-- 1. Ajouter la colonne owner_id aux tables existantes
ALTER TABLE lead_magnets ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_lead_magnets_owner_id ON lead_magnets(owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_owner_id ON leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_lead_magnet_slug ON leads(lead_magnet_slug);

-- 3. Activer Row Level Security (RLS)
ALTER TABLE lead_magnets ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- 4. Policies pour lead_magnets

-- Permettre à tout le monde de lire les lead magnets (pour les pages publiques)
CREATE POLICY "Public read access for lead magnets"
  ON lead_magnets
  FOR SELECT
  USING (true);

-- Permettre l'insertion anonyme (owner_id null) ou authentifiée
CREATE POLICY "Allow insert for authenticated or anonymous"
  ON lead_magnets
  FOR INSERT
  WITH CHECK (
    owner_id IS NULL OR owner_id = auth.uid()
  );

-- Permettre aux utilisateurs de voir leurs propres lead magnets
CREATE POLICY "Users can view their own lead magnets"
  ON lead_magnets
  FOR SELECT
  USING (owner_id = auth.uid());

-- Permettre aux utilisateurs de mettre à jour leurs propres lead magnets
CREATE POLICY "Users can update their own lead magnets"
  ON lead_magnets
  FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Permettre aux utilisateurs de supprimer leurs propres lead magnets
CREATE POLICY "Users can delete their own lead magnets"
  ON lead_magnets
  FOR DELETE
  USING (owner_id = auth.uid());

-- 5. Policies pour leads

-- Permettre l'insertion anonyme (owner_id null) ou authentifiée
CREATE POLICY "Allow insert for authenticated or anonymous leads"
  ON leads
  FOR INSERT
  WITH CHECK (true); -- Tout le monde peut soumettre un lead

-- Permettre aux utilisateurs de voir les leads de leurs lead magnets
CREATE POLICY "Users can view leads for their lead magnets"
  ON leads
  FOR SELECT
  USING (
    owner_id = auth.uid() OR
    lead_magnet_slug IN (
      SELECT slug FROM lead_magnets WHERE owner_id = auth.uid()
    )
  );

-- Permettre aux utilisateurs de supprimer les leads de leurs lead magnets
CREATE POLICY "Users can delete leads for their lead magnets"
  ON leads
  FOR DELETE
  USING (
    owner_id = auth.uid() OR
    lead_magnet_slug IN (
      SELECT slug FROM lead_magnets WHERE owner_id = auth.uid()
    )
  );

-- 6. Fonction pour claim les lead magnets anonymes (optionnel, pour automatisation)
CREATE OR REPLACE FUNCTION claim_anonymous_lead_magnets(user_id uuid, session_created_at timestamp)
RETURNS void AS $$
BEGIN
  -- Claim lead magnets créés dans l'heure précédant la création du compte
  UPDATE lead_magnets
  SET owner_id = user_id
  WHERE owner_id IS NULL
    AND created_at >= session_created_at - interval '1 hour'
    AND created_at <= session_created_at;
  
  -- Claim les leads associés
  UPDATE leads
  SET owner_id = user_id
  WHERE owner_id IS NULL
    AND lead_magnet_slug IN (
      SELECT slug FROM lead_magnets WHERE owner_id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Vérifier que tout fonctionne
-- SELECT * FROM lead_magnets WHERE owner_id IS NULL; -- Lead magnets anonymes
-- SELECT * FROM lead_magnets WHERE owner_id = auth.uid(); -- Mes lead magnets


