-- Create two_factor_auth table for 2FA functionality
CREATE TABLE IF NOT EXISTS two_factor_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  secret TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  enabled_at TIMESTAMPTZ DEFAULT NOW(),
  disabled_at TIMESTAMPTZ,
  backup_codes TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_two_factor_auth_user_id ON two_factor_auth(user_id);
CREATE INDEX IF NOT EXISTS idx_two_factor_auth_enabled ON two_factor_auth(enabled, user_id);

-- Add RLS (Row Level Security)
ALTER TABLE two_factor_auth ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own 2FA data
CREATE POLICY "Users can view own 2FA data" ON two_factor_auth
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own 2FA data
CREATE POLICY "Users can insert own 2FA data" ON two_factor_auth
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own 2FA data
CREATE POLICY "Users can update own 2FA data" ON two_factor_auth
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own 2FA data
CREATE POLICY "Users can delete own 2FA data" ON two_factor_auth
  FOR DELETE USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_two_factor_auth_updated_at
  BEFORE UPDATE ON two_factor_auth
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
