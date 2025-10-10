-- Migration: Add 'written_work' check type
-- Description: Extends check_type enum to support written work (контрольная работа)
-- Date: 2025-01-10

-- Drop existing check constraint
ALTER TABLE checks DROP CONSTRAINT IF EXISTS checks_check_type_check;

-- Add new constraint with written_work type
ALTER TABLE checks ADD CONSTRAINT checks_check_type_check
  CHECK (check_type IN ('test', 'essay', 'written_work'));

-- Add comment for documentation
COMMENT ON COLUMN checks.check_type IS 'Type of check: test (тест из конструктора), essay (сочинение), written_work (контрольная работа)';

-- Update check_usage_history to support new type
ALTER TABLE check_usage_history DROP CONSTRAINT IF EXISTS check_usage_history_check_type_check;
ALTER TABLE check_usage_history ADD CONSTRAINT check_usage_history_check_type_check
  CHECK (check_type IN ('test', 'essay', 'written_work'));
