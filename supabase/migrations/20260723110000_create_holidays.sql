CREATE TABLE holidays (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'us',
  holiday_date date NOT NULL,
  year int NOT NULL,
  is_active boolean DEFAULT true,
  greeting_email_sent_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

INSERT INTO holidays (name, type, holiday_date, year) VALUES
('New Year', 'us', '2026-01-01', 2026),
('Independence Day', 'us', '2026-07-04', 2026),
('Thanksgiving', 'us', '2026-11-26', 2026),
('Christmas', 'us', '2026-12-25', 2026),
('Holi', 'indian', '2026-03-29', 2026),
('Vinayaka Chavithi', 'indian', '2026-08-22', 2026),
('Dussehra', 'indian', '2026-10-02', 2026),
('Diwali', 'indian', '2026-10-21', 2026);
