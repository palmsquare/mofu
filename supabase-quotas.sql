-- Create user_quotas table to track user quotas and usage
CREATE TABLE IF NOT EXISTS user_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'pro')),
  
  -- Quota limits
  storage_limit_mb INTEGER NOT NULL DEFAULT 100, -- 100 MB for free plan
  downloads_limit INTEGER NOT NULL DEFAULT 50, -- 50 downloads for free plan
  lead_magnets_limit INTEGER NOT NULL DEFAULT 1, -- 1 lead magnet for free plan
  
  -- Usage tracking (calculated fields, updated via triggers or functions)
  storage_used_mb DECIMAL(10, 2) DEFAULT 0,
  downloads_used INTEGER DEFAULT 0,
  lead_magnets_used INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for user_id
CREATE INDEX IF NOT EXISTS idx_user_quotas_user_id ON user_quotas(user_id);

-- Enable RLS
ALTER TABLE user_quotas ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own quotas
CREATE POLICY "Users can read their own quotas"
  ON user_quotas
  FOR SELECT
  USING (user_id = auth.uid());

-- RLS Policy: Users can update their own quotas (for usage tracking)
CREATE POLICY "Users can update their own quotas"
  ON user_quotas
  FOR UPDATE
  USING (user_id = auth.uid());

-- Function to get or create user quota
CREATE OR REPLACE FUNCTION get_or_create_user_quota(user_uuid UUID)
RETURNS user_quotas AS $$
DECLARE
  quota user_quotas;
BEGIN
  -- Try to get existing quota
  SELECT * INTO quota FROM user_quotas WHERE user_id = user_uuid;
  
  -- If no quota exists, create one
  IF NOT FOUND THEN
    INSERT INTO user_quotas (user_id, plan_type, storage_limit_mb, downloads_limit, lead_magnets_limit)
    VALUES (user_uuid, 'free', 100, 50, 1)
    RETURNING * INTO quota;
  END IF;
  
  RETURN quota;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate user storage usage
CREATE OR REPLACE FUNCTION calculate_user_storage_usage(user_uuid UUID)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
  total_bytes BIGINT;
BEGIN
  -- Calculate total storage used by user's lead magnets (file type only)
  SELECT COALESCE(SUM(
    CASE 
      WHEN resource_type = 'file' THEN
        -- Get file size from storage bucket metadata
        -- For now, we'll estimate or use a default size
        -- In production, you'd query the storage bucket metadata
        0
      ELSE 0
    END
  ), 0) INTO total_bytes
  FROM lead_magnets
  WHERE owner_id = user_uuid AND resource_type = 'file';
  
  -- Convert bytes to MB
  RETURN ROUND(total_bytes / 1048576.0, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate user downloads usage
CREATE OR REPLACE FUNCTION calculate_user_downloads_usage(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  -- Count total downloads (leads) for user's lead magnets
  RETURN (
    SELECT COALESCE(COUNT(*), 0)
    FROM leads
    WHERE owner_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate user lead magnets usage
CREATE OR REPLACE FUNCTION calculate_user_lead_magnets_usage(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  -- Count total lead magnets for user
  RETURN (
    SELECT COALESCE(COUNT(*), 0)
    FROM lead_magnets
    WHERE owner_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_quotas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_quotas_updated_at
  BEFORE UPDATE ON user_quotas
  FOR EACH ROW
  EXECUTE FUNCTION update_user_quotas_updated_at();

-- Initialize quotas for existing users
INSERT INTO user_quotas (user_id, plan_type, storage_limit_mb, downloads_limit, lead_magnets_limit)
SELECT id, 'free', 100, 50, 1
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_quotas)
ON CONFLICT (user_id) DO NOTHING;

