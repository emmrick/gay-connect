-- Attribution des crédits de parrainage aux membres existants vérifiés
DO $$
DECLARE
  ref_record RECORD;
BEGIN
  -- Parcourir tous les parrainages en attente où le filleul est vérifié
  FOR ref_record IN 
    SELECT r.id, r.referrer_user_id, r.referred_user_id, r.referral_code_id,
           r.referrer_reward_applied, r.referred_reward_applied
    FROM public.referrals r
    INNER JOIN public.identity_verifications iv ON iv.user_id = r.referred_user_id
    WHERE iv.status = 'approved'
      AND r.status = 'pending'
      AND (r.referrer_reward_applied = false OR r.referred_reward_applied = false)
  LOOP
    -- Attribuer 10 crédits au parrain
    IF NOT ref_record.referrer_reward_applied THEN
      PERFORM public.add_credits(
        ref_record.referrer_user_id, 
        10.0, 
        'bonus', 
        'referral_bonus', 
        'Bonus parrainage - filleul vérifié'
      );
    END IF;
    
    -- Attribuer 10 crédits au filleul
    IF NOT ref_record.referred_reward_applied THEN
      PERFORM public.add_credits(
        ref_record.referred_user_id, 
        10.0, 
        'bonus', 
        'referral_bonus', 
        'Bonus parrainage - inscription vérifiée'
      );
    END IF;
    
    -- Mettre à jour le statut du parrainage
    UPDATE public.referrals
    SET 
      status = 'completed',
      referrer_reward_applied = true,
      referrer_reward_applied_at = now(),
      referred_reward_applied = true,
      referred_reward_applied_at = now()
    WHERE id = ref_record.id;
    
    -- Incrémenter le compteur de parrainages réussis
    UPDATE public.referral_codes
    SET successful_referrals = successful_referrals + 1
    WHERE id = ref_record.referral_code_id;
    
    -- Notification au parrain
    INSERT INTO public.notifications (user_id, type, title, message, is_read)
    VALUES (
      ref_record.referrer_user_id,
      'referral_success',
      '🎉 Parrainage réussi !',
      'Ton filleul a été vérifié ! Tu as reçu 10 crédits bonus.',
      false
    );
    
    -- Notification au filleul
    INSERT INTO public.notifications (user_id, type, title, message, is_read)
    VALUES (
      ref_record.referred_user_id,
      'referral_bonus',
      '🎁 Bonus de parrainage !',
      'Tu as reçu 10 crédits bonus grâce à ton parrain !',
      false
    );
  END LOOP;
END $$;

-- Trigger pour attribuer les crédits quand un filleul est vérifié
CREATE OR REPLACE FUNCTION public.process_referral_on_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  ref_record RECORD;
BEGIN
  -- Seulement si le statut passe à 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Chercher un parrainage en attente pour cet utilisateur
    SELECT * INTO ref_record
    FROM public.referrals
    WHERE referred_user_id = NEW.user_id
      AND status = 'pending';
    
    IF FOUND THEN
      -- Attribuer 10 crédits au parrain
      PERFORM public.add_credits(
        ref_record.referrer_user_id, 
        10.0, 
        'bonus', 
        'referral_bonus', 
        'Bonus parrainage - filleul vérifié'
      );
      
      -- Attribuer 10 crédits au filleul
      PERFORM public.add_credits(
        NEW.user_id, 
        10.0, 
        'bonus', 
        'referral_bonus', 
        'Bonus parrainage - inscription vérifiée'
      );
      
      -- Mettre à jour le statut du parrainage
      UPDATE public.referrals
      SET 
        status = 'completed',
        referrer_reward_applied = true,
        referrer_reward_applied_at = now(),
        referred_reward_applied = true,
        referred_reward_applied_at = now()
      WHERE id = ref_record.id;
      
      -- Incrémenter le compteur de parrainages réussis
      UPDATE public.referral_codes
      SET successful_referrals = successful_referrals + 1
      WHERE id = ref_record.referral_code_id;
      
      -- Notification au parrain
      INSERT INTO public.notifications (user_id, type, title, message, is_read)
      VALUES (
        ref_record.referrer_user_id,
        'referral_success',
        '🎉 Parrainage réussi !',
        'Ton filleul a été vérifié ! Tu as reçu 10 crédits bonus.',
        false
      );
      
      -- Notification au filleul
      INSERT INTO public.notifications (user_id, type, title, message, is_read)
      VALUES (
        NEW.user_id,
        'referral_bonus',
        '🎁 Bonus de parrainage !',
        'Tu as reçu 10 crédits bonus grâce à ton parrain !',
        false
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Créer le trigger sur identity_verifications
DROP TRIGGER IF EXISTS on_verification_approved_referral ON public.identity_verifications;
CREATE TRIGGER on_verification_approved_referral
  AFTER UPDATE ON public.identity_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.process_referral_on_verification();