import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Cache the VAPID key
let cachedVapidKey: string | null = null;

async function getVapidPublicKey(): Promise<string | null> {
  if (cachedVapidKey) return cachedVapidKey;
  
  try {
    const { data, error } = await supabase.functions.invoke('get-vapid-key');
    if (error) {
      console.error('Error fetching VAPID key:', error);
      return null;
    }
    cachedVapidKey = data?.publicKey || null;
    return cachedVapidKey;
  } catch (error) {
    console.error('Error fetching VAPID key:', error);
    return null;
  }
}

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = async () => {
      const supported = 'serviceWorker' in navigator && 
                       'PushManager' in window && 
                       'Notification' in window;
      setIsSupported(supported);
      
      if (supported) {
        setPermission(Notification.permission);
      }
    };
    
    checkSupport();
  }, []);

  // Check if already subscribed
  useEffect(() => {
    const checkSubscription = async () => {
      if (!isSupported || !user) return;

      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (error) {
        console.error('Error checking subscription:', error);
      }
    };

    checkSubscription();
  }, [isSupported, user]);

  // Register the push service worker
  const registerServiceWorker = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported');
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw-push.js', {
        scope: '/'
      });
      
      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
      
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!user || !isSupported) return false;

    setIsLoading(true);
    
    try {
      // Request notification permission
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      
      if (permissionResult !== 'granted') {
        toast.error('Permission de notification refusée');
        return false;
      }

      // Get VAPID public key from server
      const vapidPublicKey = await getVapidPublicKey();
      if (!vapidPublicKey) {
        toast.error('Configuration des notifications non disponible');
        return false;
      }

      // Register service worker
      const registration = await registerServiceWorker();

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Subscribe to push
        const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey.buffer as ArrayBuffer
        });
      }

      if (subscription) {
        const subscriptionJson = subscription.toJSON();
        
        // Save subscription to database
        const { error } = await supabase
          .from('push_subscriptions')
          .upsert({
            user_id: user.id,
            endpoint: subscription.endpoint,
            p256dh_key: subscriptionJson.keys?.p256dh || '',
            auth_key: subscriptionJson.keys?.auth || ''
          }, {
            onConflict: 'user_id,endpoint'
          });

        if (error) {
          console.error('Error saving subscription:', error);
          throw error;
        }

        setIsSubscribed(true);
        toast.success('Notifications push activées !');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast.error('Erreur lors de l\'activation des notifications');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, isSupported, registerServiceWorker]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!user || !isSupported) return false;

    setIsLoading(true);
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push
        await subscription.unsubscribe();

        // Remove from database
        const { error } = await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', subscription.endpoint);

        if (error) {
          console.error('Error removing subscription:', error);
        }
      }

      setIsSubscribed(false);
      toast.success('Notifications push désactivées');
      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast.error('Erreur lors de la désactivation');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, isSupported]);

  // Toggle subscription
  const toggleSubscription = useCallback(async () => {
    if (isSubscribed) {
      return unsubscribe();
    } else {
      return subscribe();
    }
  }, [isSubscribed, subscribe, unsubscribe]);

  return {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    subscribe,
    unsubscribe,
    toggleSubscription
  };
};
