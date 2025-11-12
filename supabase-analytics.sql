-- Create page_views table for tracking analytics
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_magnet_id UUID NOT NULL REFERENCES lead_magnets(id) ON DELETE CASCADE,
  lead_magnet_slug TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click', 'conversion')),
  user_agent TEXT,
  ip_address TEXT,
  referer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  metadata JSONB DEFAULT '{}',
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_page_views_lead_magnet_id ON page_views(lead_magnet_id);
CREATE INDEX IF NOT EXISTS idx_page_views_lead_magnet_slug ON page_views(lead_magnet_slug);
CREATE INDEX IF NOT EXISTS idx_page_views_owner_id ON page_views(owner_id);
CREATE INDEX IF NOT EXISTS idx_page_views_event_type ON page_views(event_type);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_lead_magnet_created ON page_views(lead_magnet_id, created_at);

-- Enable RLS
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own page views
CREATE POLICY "Users can read their own page views"
  ON page_views
  FOR SELECT
  USING (owner_id = auth.uid());

-- RLS Policy: Allow anonymous inserts (for tracking)
CREATE POLICY "Allow anonymous inserts for tracking"
  ON page_views
  FOR INSERT
  WITH CHECK (true);

-- Add lead email and name to leads table for easier querying
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_email TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_name TEXT;

-- Create index for lead_email
CREATE INDEX IF NOT EXISTS idx_leads_lead_email ON leads(lead_email);

-- Update existing leads to extract email and name from form_data
UPDATE leads
SET 
  lead_email = (form_data->>'field-email')::TEXT,
  lead_name = (form_data->>'field-name')::TEXT
WHERE lead_email IS NULL OR lead_name IS NULL;

