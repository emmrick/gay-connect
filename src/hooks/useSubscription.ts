import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SubscriptionStatus {
  subscribed: boolean;
  isPremium: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  isLoading: boolean;
}

// Limites pour les utilisateurs gratuits
export const FREE_LIMITS = {
  ephemeralMediaPerWeek: 1,
  profilePhotosPerDay: 10,
  maxGroups: 3,
  nearbyProfiles: 30,
  conversationsPerWeek: 10,
  maxAlbums: 1,
  maxSavedMessages: 1,
  maxPhotoSize: 20 * 1024 * 1024, // 20 MB
  maxVideoSize: 500 * 1024 * 1024, // 500 MB
};

// Limites pour les utilisateurs premium
export const PREMIUM_LIMITS = {
  ephemeralMediaPerWeek: Infinity,
  profilePhotosPerDay: Infinity,
  maxGroups: 101, // Tous les départements
  nearbyProfiles: Infinity,
  conversationsPerWeek: Infinity,
  maxAlbums: Infinity,
  maxSavedMessages: Infinity,
  maxPhotoSize: 500 * 1024 * 1024, // 500 MB
  maxVideoSize: 1024 * 1024 * 1024, // 1 GB
};

export const useSubscription = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus>({
    subscribed: false,
    isPremium: false,
    productId: null,
    subscriptionEnd: null,
    isLoading: true,
  });

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setStatus({
        subscribed: false,
        isPremium: false,
        productId: null,
        subscriptionEnd: null,
        isLoading: false,
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) throw error;

      setStatus({
        subscribed: data?.subscribed || false,
        isPremium: data?.is_premium || false,
        productId: data?.product_id || null,
        subscriptionEnd: data?.subscription_end || null,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      setStatus(prev => ({ ...prev, isLoading: false }));
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();
    
    // Refresh every minute
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  const startCheckout = async () => {
    if (!user) {
      toast.error('Veuillez vous connecter pour souscrire');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Erreur lors de la création du paiement');
    }
  };

  const openCustomerPortal = async () => {
    if (!user) {
      toast.error('Veuillez vous connecter');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Erreur lors de l\'ouverture du portail');
    }
  };

  const getLimits = () => {
    return status.isPremium ? PREMIUM_LIMITS : FREE_LIMITS;
  };

  return {
    ...status,
    checkSubscription,
    startCheckout,
    openCustomerPortal,
    getLimits,
  };
};
