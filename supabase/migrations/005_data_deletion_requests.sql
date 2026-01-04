-- Data Deletion Requests table (for Facebook/Meta compliance)
-- Stores requests from users who want their data deleted via Facebook

CREATE TYPE deletion_request_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TABLE data_deletion_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  confirmation_code TEXT NOT NULL UNIQUE,
  facebook_user_id TEXT NOT NULL,
  status deletion_request_status DEFAULT 'pending',
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for confirmation code lookups (used for status checks)
CREATE INDEX idx_deletion_requests_confirmation_code ON data_deletion_requests(confirmation_code);

-- Create index for Facebook user ID lookups
CREATE INDEX idx_deletion_requests_facebook_user_id ON data_deletion_requests(facebook_user_id);

-- Enable RLS
ALTER TABLE data_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Allow public read access for status checking (using confirmation code)
CREATE POLICY "Anyone can view deletion request by confirmation code" ON data_deletion_requests
  FOR SELECT USING (true);

-- Only service role can insert/update (webhook handling)
CREATE POLICY "Service role can manage deletion requests" ON data_deletion_requests
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Comment on table
COMMENT ON TABLE data_deletion_requests IS 'Stores Facebook data deletion requests for GDPR/Meta Platform Terms compliance';

