import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SIGNED_URL_EXPIRY_SECONDS = 3600; // 1 hour

/**
 * Hook to get a signed URL for a private storage file
 * Use this for files in private buckets like 'media', 'ephemeral-media', etc.
 */
export const useSignedUrl = (bucket: string, path: string | null) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!path) {
      setSignedUrl(null);
      return;
    }

    const fetchSignedUrl = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Extract just the path if it's a full URL
        let cleanPath = path;
        
        // Handle full Supabase storage URLs
        if (path.includes('/storage/v1/object/')) {
          const match = path.match(/\/storage\/v1\/object\/(?:public|sign)\/[^/]+\/(.+)/);
          if (match) {
            cleanPath = match[1];
          }
        }

        const { data, error: signError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(cleanPath, SIGNED_URL_EXPIRY_SECONDS);

        if (signError) {
          throw signError;
        }

        setSignedUrl(data.signedUrl);
      } catch (err) {
        // Silencieux : "Object not found" est normal pour des médias purgés
        // (ephemeral, médias supprimés, anciens messages). Pas la peine de
        // polluer les logs d'erreurs.
        setError(err instanceof Error ? err : new Error('Failed to get signed URL'));
        setSignedUrl(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSignedUrl();
  }, [bucket, path]);

  return { signedUrl, isLoading, error };
};

/**
 * Helper function to get a signed URL synchronously (for use outside of hooks)
 */
export const getSignedUrl = async (bucket: string, path: string): Promise<string | null> => {
  if (!path) return null;

  try {
    // Extract just the path if it's a full URL
    let cleanPath = path;
    
    // Handle full Supabase storage URLs
    if (path.includes('/storage/v1/object/')) {
      const match = path.match(/\/storage\/v1\/object\/(?:public|sign)\/[^/]+\/(.+)/);
      if (match) {
        cleanPath = match[1];
      }
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(cleanPath, SIGNED_URL_EXPIRY_SECONDS);

    if (error) {
      // Silencieux : objet supprimé / éphémère expiré → comportement attendu
      return null;
    }

    return data.signedUrl;
  } catch {
    return null;
  }
};

/**
 * Extract the storage path from a full Supabase storage URL
 */
export const extractStoragePath = (url: string): string => {
  if (!url) return '';
  
  // Handle full Supabase storage URLs
  if (url.includes('/storage/v1/object/')) {
    const match = url.match(/\/storage\/v1\/object\/(?:public|sign)\/[^/]+\/(.+)/);
    if (match) {
      return match[1];
    }
  }
  
  return url;
};
