import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const SIGNED_URL_EXPIRY_SECONDS = 3600; // 1 hour

export const useMediaUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { user } = useAuth();

  const uploadMedia = async (file: File): Promise<string | null> => {
    if (!user) return null;

    setIsUploading(true);
    setProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error } = await supabase.storage
        .from('media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Return the file path instead of public URL
      // The file path will be used to generate signed URLs when displaying
      setProgress(100);
      return filePath;
    } catch (error) {
      console.error('Upload error:', error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Get a signed URL for accessing media (valid for 1 hour)
  const getSignedUrl = async (filePath: string): Promise<string | null> => {
    try {
      // Extract just the path if it's a full URL
      let cleanPath = filePath;
      
      // Handle full Supabase storage URLs
      if (filePath.includes('/storage/v1/object/')) {
        const match = filePath.match(/\/storage\/v1\/object\/(?:public|sign)\/[^/]+\/(.+)/);
        if (match) {
          cleanPath = match[1];
        }
      }

      const { data, error } = await supabase.storage
        .from('media')
        .createSignedUrl(cleanPath, SIGNED_URL_EXPIRY_SECONDS);

      if (error) {
        console.error('Signed URL error:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Signed URL error:', error);
      return null;
    }
  };

  const deleteMedia = async (filePath: string) => {
    try {
      // Extract just the path if it's a full URL
      let cleanPath = filePath;
      
      if (filePath.includes('/storage/v1/object/')) {
        const match = filePath.match(/\/storage\/v1\/object\/(?:public|sign)\/[^/]+\/(.+)/);
        if (match) {
          cleanPath = match[1];
        }
      }

      const { error } = await supabase.storage
        .from('media')
        .remove([cleanPath]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  };

  return {
    uploadMedia,
    deleteMedia,
    getSignedUrl,
    isUploading,
    progress,
  };
};
