ALTER TABLE master_clients ADD COLUMN IF NOT EXISTS greeting_preference text DEFAULT 'us_only';
UPDATE master_clients SET greeting_preference = 'us_only' WHERE greeting_preference IS NULL;
