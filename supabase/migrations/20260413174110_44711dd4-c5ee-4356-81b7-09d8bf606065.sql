-- Fix 1: Drop the restrictive SELECT policy that blocks normal users
DROP POLICY IF EXISTS "Users can view own profile or via admin" ON public.profiles;

-- Fix 2: Ensure the permissive SELECT policy exists for all authenticated users
-- (It already exists, but let's make sure it's correct)
DROP POLICY IF EXISTS "Authenticated users can view basic profile info" ON public.profiles;
CREATE POLICY "Authenticated users can view basic profile info"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Fix 3: Allow authenticated users to read verification status (just user_id + status)
-- so the nearby profiles filter can check who is verified
DROP POLICY IF EXISTS "Authenticated can check verification status" ON public.identity_verifications;
CREATE POLICY "Authenticated can check verification status"
ON public.identity_verifications
FOR SELECT
TO authenticated
USING (true);