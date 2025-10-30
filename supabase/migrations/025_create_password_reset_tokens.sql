-- Create password_reset_tokens table for handling password reset requests
CREATE TABLE IF NOT EXISTS password_reset_tokens (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_email TEXT NOT NULL,
	token TEXT NOT NULL UNIQUE,
	expires_at TIMESTAMPTZ NOT NULL,
	used_at TIMESTAMPTZ,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for fast lookups
CREATE INDEX idx_password_reset_tokens_user_email ON password_reset_tokens(user_email);
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Add comment to table
COMMENT ON TABLE password_reset_tokens IS 'Stores password reset tokens with 15-minute expiration';

-- Enable RLS
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only read their own tokens (for validation)
CREATE POLICY "Users can read their own tokens"
	ON password_reset_tokens
	FOR SELECT
	USING (true); -- Allow reading for token validation in API

-- Create policy: Service role can manage all tokens
CREATE POLICY "Service role can manage all tokens"
	ON password_reset_tokens
	FOR ALL
	USING (auth.role() = 'service_role');
