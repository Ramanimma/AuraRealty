
-- 1. Add CHECK constraints for server-side input validation
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_rating_range CHECK (rating >= 1 AND rating <= 5),
  ADD CONSTRAINT reviews_client_name_length CHECK (length(client_name) > 0 AND length(client_name) <= 100),
  ADD CONSTRAINT reviews_comment_length CHECK (length(comment) > 0 AND length(comment) <= 1000);

-- 2. Rate-limiting trigger: max 3 reviews per 10 minutes (by client_name or globally)
CREATE OR REPLACE FUNCTION public.check_review_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  -- Check how many reviews this client_name submitted in the last 10 minutes
  SELECT COUNT(*) INTO recent_count
  FROM public.reviews
  WHERE client_name = NEW.client_name
    AND created_at > now() - interval '10 minutes';

  IF recent_count >= 3 THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please wait before submitting another review.';
  END IF;

  -- Also check global rate limit: max 10 reviews per minute from anyone
  SELECT COUNT(*) INTO recent_count
  FROM public.reviews
  WHERE created_at > now() - interval '1 minute';

  IF recent_count >= 10 THEN
    RAISE EXCEPTION 'Too many reviews being submitted. Please try again later.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_review_rate_limit
  BEFORE INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.check_review_rate_limit();

-- 3. Restrict storage uploads to admins only
DROP POLICY IF EXISTS "Authenticated users can upload listing images" ON storage.objects;

CREATE POLICY "Admins can upload listing images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'listing-images' AND public.has_role(auth.uid(), 'admin'));
