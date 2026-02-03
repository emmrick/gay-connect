-- Fix PUBLIC_DATA_EXPOSURE: Restrict profiles SELECT policy
-- The current policy allows ANY authenticated user to view ALL profiles including sensitive data
-- We need to restrict access to:
-- 1. Own profile
-- 2. Admins/Moderators (for moderation purposes)
-- 3. Via the secure get_nearby_profiles function (which already handles distance filtering)

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Create new restrictive SELECT policy
-- Users can only directly SELECT their own profile
-- Other profile access should go through the SECURITY DEFINER function get_nearby_profiles
CREATE POLICY "Users can view own profile or via admin" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id
  OR has_role(auth.uid(), 'admin')
  OR has_role(auth.uid(), 'moderator')
);

-- Also fix the media bucket - make it private instead of public
UPDATE storage.buckets SET public = false WHERE id = 'media';

-- Ensure storage policies are properly restrictive for media bucket
-- Users should only access their own media or through proper authorization
DROP POLICY IF EXISTS "Authenticated users can view media" ON storage.objects;
DROP POLICY IF EXISTS "Users can view media files" ON storage.objects;