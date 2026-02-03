-- Fix profile_reactions public exposure
-- Drop the overly permissive policy that allows anyone to view reactions
DROP POLICY IF EXISTS "Anyone can view profile reactions" ON public.profile_reactions;

-- Create a new policy that only allows authenticated users to view reactions
-- Users can see reactions on their own profile or reactions they made
CREATE POLICY "Authenticated users can view profile reactions"
ON public.profile_reactions
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    profile_user_id = auth.uid() OR 
    reactor_user_id = auth.uid()
  )
);

-- Fix referral_codes public exposure
-- Drop the overly permissive policy that allows anyone to check codes
DROP POLICY IF EXISTS "Anyone can check if a referral code exists" ON public.referral_codes;

-- The existing policy "Users can view their own referral code" already exists
-- We need to add a specific function to validate codes without exposing the entire table
CREATE OR REPLACE FUNCTION public.validate_referral_code(_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  code_exists boolean;
  referrer_username text;
BEGIN
  -- Check if code exists and get referrer info
  SELECT 
    true,
    p.username
  INTO code_exists, referrer_username
  FROM referral_codes rc
  JOIN profiles p ON p.user_id = rc.user_id
  WHERE rc.code = _code;
  
  IF code_exists THEN
    RETURN json_build_object(
      'valid', true,
      'referrer_username', referrer_username
    );
  ELSE
    RETURN json_build_object(
      'valid', false,
      'message', 'Code de parrainage invalide'
    );
  END IF;
END;
$$;