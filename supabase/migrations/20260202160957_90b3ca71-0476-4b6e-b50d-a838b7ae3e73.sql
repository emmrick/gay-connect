-- Allow public read access to profiles for online member count
-- This is safe as profiles contain only public information
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
TO anon
USING (true);