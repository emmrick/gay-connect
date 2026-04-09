import { useAuth } from '@/contexts/AuthContext';
import { useActiveProfile } from '@/contexts/ActiveProfileContext';
import { useAvatarUrl } from '@/hooks/useAvatarUrl';
import { ArrowLeftRight, Heart, User } from 'lucide-react';

const ProfileSwitcher = () => {
  const { profile } = useAuth();
  const { isCouple, activeUserId, partnerProfile, setShowProfileSelector } = useActiveProfile();

  if (!isCouple || !profile || !partnerProfile) return null;

  const isOwnProfile = activeUserId === profile.user_id;
  const currentProfile = isOwnProfile ? profile : partnerProfile;
  const otherProfile = isOwnProfile ? partnerProfile : profile;

  return (
    <button
      onClick={() => setShowProfileSelector(true)}
      className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors"
      title="Changer de profil"
    >
      <SmallAvatar avatarUrl={currentProfile?.avatar_url} />
      <ArrowLeftRight className="w-3 h-3 text-primary" />
      <SmallAvatar avatarUrl={otherProfile?.avatar_url} />
      <Heart className="w-3 h-3 text-pink-500 ml-0.5" />
    </button>
  );
};

const SmallAvatar = ({ avatarUrl }: { avatarUrl: string | null | undefined }) => {
  const signed = useAvatarUrl(avatarUrl || null);
  return (
    <div className="w-5 h-5 rounded-full overflow-hidden bg-secondary flex items-center justify-center">
      {signed ? (
        <img src={signed} className="w-full h-full object-cover" alt="" />
      ) : (
        <User className="w-3 h-3 text-muted-foreground" />
      )}
    </div>
  );
};

export default ProfileSwitcher;
