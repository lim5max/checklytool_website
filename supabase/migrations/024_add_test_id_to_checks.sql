-- Add test_id column to checks table to link with generated_tests
-- This allows direct loading of test questions without relying on AI to detect test identifier

ALTER TABLE checks
ADD COLUMN IF NOT EXISTS test_id TEXT REFERENCES generated_tests(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_checks_test_id ON checks(test_id);

-- Add comment
COMMENT ON COLUMN checks.test_id IS 'Reference to generated test from test builder (optional)';
