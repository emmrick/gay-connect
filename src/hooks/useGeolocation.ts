import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
  permissionState: PermissionState | null;
}

export const useGeolocation = () => {
  const { user } = useAuth();
  const isMountedRef = useRef(true);
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: false,
    permissionState: null,
  });

  // Check permission state
  const checkPermission = useCallback(async () => {
    if (!navigator.permissions) return;
    
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      if (!isMountedRef.current) return;
      setState(prev => ({ ...prev, permissionState: result.state }));
      
      result.onchange = () => {
        if (!isMountedRef.current) return;
        setState(prev => ({ ...prev, permissionState: result.state }));
      };
    } catch (err) {
      console.error('Permission check error:', err);
    }
  }, []);

  // Request location
  const requestLocation = useCallback(async (): Promise<boolean> => {
    if (!navigator.geolocation) {
      setState(prev => ({ 
        ...prev, 
        error: 'La géolocalisation n\'est pas supportée par ton navigateur' 
      }));
      return false;
    }

    if (!isMountedRef.current) return false;
    setState(prev => ({ ...prev, loading: true, error: null }));

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          try {
            const { latitude, longitude } = position.coords;
            if (!isMountedRef.current) return;

            setState(prev => ({
              ...prev,
              latitude,
              longitude,
              loading: false,
              error: null,
            }));

            // Fire-and-forget DB update (avoid unhandled rejections from async callbacks)
            if (user) {
              void (async () => {
                try {
                  const { error: updateError } = await supabase
                    .from('profiles')
                    .update({
                      latitude,
                      longitude,
                      location_updated_at: new Date().toISOString(),
                    })
                    .eq('user_id', user.id);

                  if (updateError) {
                    console.error('[geolocation] Error updating location:', updateError);
                  }
                } catch (err) {
                  console.error('[geolocation] Unexpected error updating location:', err);
                }
              })();
            }

            resolve(true);
          } catch (err) {
            console.error('[geolocation] Unexpected success callback error:', err);
            if (!isMountedRef.current) return;
            setState(prev => ({
              ...prev,
              loading: false,
              error: 'Erreur inattendue lors de la récupération de ta position',
            }));
            resolve(false);
          }
        },
        (error) => {
          let errorMessage = 'Impossible d\'obtenir ta position';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Tu dois autoriser l\'accès à ta position pour voir les membres à proximité';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Position non disponible';
              break;
            case error.TIMEOUT:
              errorMessage = 'La demande de position a expiré';
              break;
          }

          if (!isMountedRef.current) return;
          setState(prev => ({
            ...prev,
            loading: false,
            error: errorMessage,
          }));
          resolve(false);
        },
        {
          // High accuracy can be unstable/heavy on some Android devices.
          // We prefer a stable fix first; distance calc does not require GPS-level precision.
          enableHighAccuracy: false,
          timeout: 12000,
          maximumAge: 5 * 60 * 1000, // 5 minutes
        }
      );
    });
  }, [user]);

  // Check permission on mount
  useEffect(() => {
    isMountedRef.current = true;
    checkPermission();
    return () => {
      isMountedRef.current = false;
    };
  }, [checkPermission]);

  return {
    ...state,
    requestLocation,
    checkPermission,
  };
};

export default useGeolocation;
