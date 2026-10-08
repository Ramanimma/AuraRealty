CREATE TABLE appointments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  property_address text NOT NULL,
  listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_phone text,
  client_email text,
  master_client_id uuid REFERENCES master_clients(id) ON DELETE SET NULL,
  agent text NOT NULL DEFAULT 'Rama Nimma',
  appointment_type text NOT NULL DEFAULT 'Showing',
  status text NOT NULL DEFAULT 'Scheduled',
  notes text,
  follow_up_date date,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
