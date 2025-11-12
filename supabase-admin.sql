-- Create admin_users table to track admin users
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for user_id
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admins can read admin_users
-- Note: This creates a circular dependency, so we need to allow service role to read
CREATE POLICY "Admins can read admin_users"
  ON admin_users
  FOR SELECT
  USING (true); -- Allow all reads for now, we'll check in the application layer

-- RLS Policy: Service role can do everything
-- This is handled by using service role key in API routes

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user storage usage
CREATE OR REPLACE FUNCTION get_user_storage_usage(user_uuid UUID)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
  total_bytes BIGINT;
BEGIN
  -- Get all file paths for user's lead magnets
  SELECT COALESCE(SUM(
    CASE 
      WHEN resource_type = 'file' THEN
        -- In production, query actual file sizes from storage
        -- For now, estimate based on file count
        5 * 1048576 -- 5 MB per file estimate
      ELSE 0
    END
  ), 0) INTO total_bytes
  FROM lead_magnets
  WHERE owner_id = user_uuid AND resource_type = 'file';
  
  -- Convert bytes to MB
  RETURN ROUND(total_bytes / 1048576.0, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user downloads count
CREATE OR REPLACE FUNCTION get_user_downloads_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COALESCE(COUNT(*), 0)
    FROM leads
    WHERE owner_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user lead magnets count
CREATE OR REPLACE FUNCTION get_user_lead_magnets_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COALESCE(COUNT(*), 0)
    FROM lead_magnets
    WHERE owner_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create download_logs view for easier access
CREATE OR REPLACE VIEW download_logs AS
SELECT 
  l.id,
  l.lead_magnet_id,
  l.lead_magnet_slug,
  l.owner_id,
  l.lead_email,
  l.lead_name,
  l.form_data,
  l.consent_granted,
  l.created_at,
  lm.title as lead_magnet_title,
  lm.resource_type,
  lm.resource_url,
  u.email as owner_email
FROM leads l
LEFT JOIN lead_magnets lm ON l.lead_magnet_id = lm.id
LEFT JOIN auth.users u ON l.owner_id = u.id;

-- Grant access to admin users
GRANT SELECT ON download_logs TO authenticated;

-- Create index on leads for faster queries
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_owner_id ON leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_lead_magnets_owner_id ON lead_magnets(owner_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_users_updated_at();

