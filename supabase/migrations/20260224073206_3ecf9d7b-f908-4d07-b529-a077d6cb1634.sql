
-- Check if any admin exists (public, no auth needed)
CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role = 'admin'
  )
$$;

-- Claim admin role if none exists (authenticated user only)
CREATE OR REPLACE FUNCTION public.claim_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only works if no admin exists yet
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RETURN false;
  END IF;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'admin');
  
  RETURN true;
END;
$$;
