import { ReactNode, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfilePhotos } from '@/hooks/useProfilePhotos';
import { supabase } from '@/integrations/supabase/client';
import ProfilePhotoRequiredScreen from './ProfilePhotoRequiredScreen';

interface ProfilePhotoGuardProps {
  children: ReactNode;
}

const ProfilePhotoGuard = ({ children }: ProfilePhotoGuardProps) => {
  const { user, profile, isLoading: authLoading, refetchProfile } = useAuth();
  const { photos, isLoading: photosLoading } = useProfilePhotos(user?.id);
  const autoFixRan = useRef(false);

  // Auto-fix: if user has photos but no avatar_url, set the primary (or first) photo as avatar
  useEffect(() => {
    if (!user || !profile || photosLoading || autoFixRan.current) return;
    if (profile.avatar_url) return; // already has avatar
    if (photos.length === 0) return; // no photos to use

    autoFixRan.current = true;
    const primaryPhoto = photos.find(p => p.is_primary) || photos[0];

    supabase
      .from('profiles')
      .update({ avatar_url: primaryPhoto.photo_url })
      .eq('user_id', user.id)
      .then(({ error }) => {
        if (!error) {
          refetchProfile();
        }
      });
  }, [user, profile, photos, photosLoading, refetchProfile]);

  // Not logged in — allow access to public pages
  if (!user || authLoading) {
    return <>{children}</>;
  }

  // Profile not loaded yet
  if (!profile) {
    return <>{children}</>;
  }

  // Still loading photos - render children to avoid blank flash
  if (photosLoading) {
    return <>{children}</>;
  }

  // No photos and no avatar — block access (consider only approved photos)
  const approvedPhotos = photos.filter((p: any) => p.status === 'approved' || !p.status);
  const hasPhoto = approvedPhotos.length > 0 || !!profile.avatar_url;

  if (!hasPhoto) {
    return <ProfilePhotoRequiredScreen />;
  }

  return <>{children}</>;
};

export default ProfilePhotoGuard;
