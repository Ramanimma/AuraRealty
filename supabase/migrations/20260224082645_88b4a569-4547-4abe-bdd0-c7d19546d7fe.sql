-- Allow anonymous users to insert reviews (public submission)
CREATE POLICY "Anyone can submit a review"
ON public.reviews
FOR INSERT
WITH CHECK (true);
