-- Table pour les bannissements
CREATE TABLE IF NOT EXISTS bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('email', 'ip', 'user_id')),
  value TEXT NOT NULL,
  reason TEXT,
  banned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(type, value)
);

-- Index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_bans_type_value ON bans(type, value) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_bans_expires_at ON bans(expires_at) WHERE is_active = TRUE;

-- RLS Policies
ALTER TABLE bans ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs authentifiés peuvent lire les bans (pour vérifier s'ils sont bannis)
CREATE POLICY "Users can read their own ban status"
  ON bans FOR SELECT
  USING (
    (type = 'user_id' AND value = auth.uid()::text) OR
    (type = 'email' AND value = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- Seuls les admins peuvent gérer les bans
CREATE POLICY "Admins can manage all bans"
  ON bans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
    )
  );

-- Fonction pour vérifier si un email/IP/user_id est banni
CREATE OR REPLACE FUNCTION is_banned(
  p_type VARCHAR,
  p_value TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  ban_record bans%ROWTYPE;
BEGIN
  SELECT * INTO ban_record
  FROM bans
  WHERE type = p_type
    AND value = p_value
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
  LIMIT 1;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Commentaires
COMMENT ON TABLE bans IS 'Table pour stocker les bannissements (emails, IPs, user_ids)';
COMMENT ON COLUMN bans.type IS 'Type de bannissement: email, ip, ou user_id';
COMMENT ON COLUMN bans.value IS 'Valeur bannie (adresse email, adresse IP, ou UUID utilisateur)';
COMMENT ON COLUMN bans.reason IS 'Raison du bannissement';
COMMENT ON COLUMN bans.banned_by IS 'ID de l''admin qui a banni';
COMMENT ON COLUMN bans.expires_at IS 'Date d''expiration du ban (NULL = permanent)';
COMMENT ON COLUMN bans.is_active IS 'Si le ban est actif ou non';

