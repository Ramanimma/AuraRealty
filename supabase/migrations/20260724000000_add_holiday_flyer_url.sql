-- Add flyer image support to holidays
ALTER TABLE holidays ADD COLUMN IF NOT EXISTS flyer_url text DEFAULT NULL;
