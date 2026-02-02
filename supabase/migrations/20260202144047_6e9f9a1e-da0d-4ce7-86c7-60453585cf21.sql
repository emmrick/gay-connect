-- Create premium_subscriptions table to track manual premium activations
CREATE TABLE public.premium_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  activated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  activated_by UUID NOT NULL,
  payment_reference TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.premium_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscription
CREATE POLICY "Users can view their own subscription"
ON public.premium_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
ON public.premium_subscriptions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert subscriptions
CREATE POLICY "Admins can insert subscriptions"
ON public.premium_subscriptions
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update subscriptions
CREATE POLICY "Admins can update subscriptions"
ON public.premium_subscriptions
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete subscriptions
CREATE POLICY "Admins can delete subscriptions"
ON public.premium_subscriptions
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_premium_subscriptions_updated_at
BEFORE UPDATE ON public.premium_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check if user has active premium
CREATE OR REPLACE FUNCTION public.has_active_premium(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.premium_subscriptions
    WHERE user_id = _user_id
      AND expires_at > now()
  )
$$;

-- Create function to activate premium for a user (admin only)
CREATE OR REPLACE FUNCTION public.activate_premium(_target_user_id uuid, _duration_days integer DEFAULT 30, _payment_reference text DEFAULT NULL, _notes text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _admin_id uuid := auth.uid();
  _new_expires_at timestamptz;
  _existing_expires_at timestamptz;
  _subscription_id uuid;
BEGIN
  -- Check if caller is admin
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Non autorisé');
  END IF;
  
  -- Check if user already has an active subscription
  SELECT expires_at INTO _existing_expires_at
  FROM public.premium_subscriptions
  WHERE user_id = _target_user_id;
  
  -- Calculate new expiration date
  IF _existing_expires_at IS NOT NULL AND _existing_expires_at > now() THEN
    -- Extend existing subscription
    _new_expires_at := _existing_expires_at + (_duration_days || ' days')::interval;
  ELSE
    -- New subscription from now
    _new_expires_at := now() + (_duration_days || ' days')::interval;
  END IF;
  
  -- Insert or update subscription
  INSERT INTO public.premium_subscriptions (user_id, activated_by, expires_at, payment_reference, notes)
  VALUES (_target_user_id, _admin_id, _new_expires_at, _payment_reference, _notes)
  ON CONFLICT (user_id)
  DO UPDATE SET
    expires_at = _new_expires_at,
    activated_by = _admin_id,
    payment_reference = COALESCE(_payment_reference, premium_subscriptions.payment_reference),
    notes = COALESCE(_notes, premium_subscriptions.notes),
    updated_at = now()
  RETURNING id INTO _subscription_id;
  
  -- Update profile is_premium field
  UPDATE public.profiles
  SET is_premium = true
  WHERE user_id = _target_user_id;
  
  -- Create notification for user
  INSERT INTO public.notifications (user_id, type, title, message, is_read)
  VALUES (
    _target_user_id,
    'subscription_activated',
    '👑 Premium activé !',
    'Votre abonnement Premium est maintenant actif jusqu''au ' || to_char(_new_expires_at, 'DD/MM/YYYY') || '. Profitez de tous les avantages !',
    false
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'subscription_id', _subscription_id,
    'expires_at', _new_expires_at
  );
END;
$$;

-- Create function to revoke premium (admin only)
CREATE OR REPLACE FUNCTION public.revoke_premium(_target_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _admin_id uuid := auth.uid();
BEGIN
  -- Check if caller is admin
  IF NOT public.has_role(_admin_id, 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Non autorisé');
  END IF;
  
  -- Delete subscription
  DELETE FROM public.premium_subscriptions
  WHERE user_id = _target_user_id;
  
  -- Update profile
  UPDATE public.profiles
  SET is_premium = false
  WHERE user_id = _target_user_id;
  
  -- Create notification
  INSERT INTO public.notifications (user_id, type, title, message, is_read)
  VALUES (
    _target_user_id,
    'subscription_ended',
    'Abonnement terminé',
    'Votre abonnement Premium a pris fin. Réabonnez-vous pour retrouver vos avantages.',
    false
  );
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Enable realtime for premium_subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.premium_subscriptions;