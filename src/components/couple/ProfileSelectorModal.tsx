import { useAuth } from '@/contexts/AuthContext';
import { useActiveProfile } from '@/contexts/ActiveProfileContext';
import { useAvatarUrl } from '@/hooks/useAvatarUrl';
import { User, Heart, Loader2 } from 'lucide-react';

const ProfileSelectorModal = () => {
  const { profile } = useAuth();
  const { partnerProfile, showProfileSelector, switchToProfile, isSwitching } = useActiveProfile();

  if (!showProfileSelector || !profile || !partnerProfile) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-md">
      <div className="w-full max-w-sm mx-4 animate-fade-in">
        <div className="text-center mb-8">
          <Heart className="w-10 h-10 mx-auto text-primary mb-3 animate-pulse" />
          <h2 className="font-display text-2xl font-bold text-foreground">Qui utilise l'app ?</h2>
          <p className="text-muted-foreground text-sm mt-1">Sélectionnez votre profil</p>
        </div>

        <div className="flex gap-4 justify-center">
          <ProfileCard
            profile={profile}
            label="Profil 1"
            onSelect={() => switchToProfile(profile.user_id)}
            isLoading={isSwitching}
          />
          <ProfileCard
            profile={partnerProfile}
            label="Profil 2"
            onSelect={() => switchToProfile(partnerProfile.user_id)}
            isLoading={isSwitching}
          />
        </div>
      </div>
    </div>
  );
};

interface ProfileCardProps {
  profile: { user_id: string; username: string | null; avatar_url: string | null };
  label: string;
  onSelect: () => void;
  isLoading: boolean;
}

const ProfileCard = ({ profile, label, onSelect, isLoading }: ProfileCardProps) => {
  const avatarUrl = useAvatarUrl(profile.avatar_url);

  return (
    <button
      onClick={onSelect}
      disabled={isLoading}
      className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card border-2 border-border hover:border-primary/50 hover:bg-secondary/50 transition-all duration-200 w-40 group"
    >
      <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center overflow-hidden border-3 border-primary/20 group-hover:border-primary/50 transition-colors">
        {avatarUrl ? (
          <img src={avatarUrl} alt={profile.username || ''} className="w-full h-full object-cover" />
        ) : (
          <User className="w-8 h-8 text-muted-foreground" />
        )}
      </div>
      <div className="text-center">
        <p className="font-semibold text-foreground text-sm">{profile.username || 'Utilisateur'}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      {isLoading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
    </button>
  );
};

export default ProfileSelectorModal;
