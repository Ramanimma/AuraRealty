
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name text NOT NULL,
  rating integer NOT NULL DEFAULT 5,
  comment text NOT NULL,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved reviews are publicly readable"
  ON public.reviews FOR SELECT
  USING (is_approved = true);
