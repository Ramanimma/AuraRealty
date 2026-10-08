
CREATE TABLE public.agent_profile (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  license_number text,
  iabs_url text,
  consumer_notice_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agent profile is publicly readable"
  ON public.agent_profile FOR SELECT
  USING (true);

-- Seed with current data
INSERT INTO public.agent_profile (name, phone, email, license_number, iabs_url, consumer_notice_url)
VALUES (
  'Texas Realty Hub',
  '(512) 900-1897',
  'info@texasrealtyhub.com',
  NULL,
  '/docs/Brokerage_Services.pdf',
  '/docs/Consumer.pdf'
);
