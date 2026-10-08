ALTER TABLE lease_reminders ADD COLUMN IF NOT EXISTS renewal_email_sent_at timestamptz DEFAULT NULL;
