import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileStats } from '@/hooks/useProfileStats';
import { useIsAdmin } from '@/hooks/useAdmin';
import { useSubscription } from '@/hooks/useSubscription';
import { useUserFavorites } from '@/hooks/useUserFavorites';
import { shouldShowOnlineIndicator } from '@/hooks/useOnlineStatus';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MapPin, Calendar, Edit2, Crown, Sparkles, Star, Heart,
  MessageCircle, Users, Camera, Verified
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import ProfileEditDialog from './ProfileEditDialog';
import ProfileReactions from './ProfileReactions';
import ProfileSettingsDrawer from './ProfileSettingsDrawer';
import { motion } from 'framer-motion';

// Labels
const POSITION_LABELS: Record<string, string> = {
  'actif': '🔝 Actif',
  'passif': '🔽 Passif',
  'versatile': '↕️ Versatile',
  'vers_top': '↕️🔝 Vers. Top',
  'vers_bottom': '↕️🔽 Vers. Bottom',
  'side': '🤝 Side',
  'no_answer': 'Non précisé',
};

const LOOKING_FOR_LABELS: Record<string, string> = {
  'plan_cul': '🔥 Plan cul',
  'plan_regulier': '🔄 Régulier',
  'relation': '❤️ Relation',
  'amitie': '🤝 Amitié',
  'discussion': '💬 Discussion',
  'webcam': '📹 Webcam',
  'groupe': '👥 Groupe',
};

const BODY_TYPE_LABELS: Record<string, string> = {
  'mince': 'Mince',
  'moyen': 'Moyen',
  'muscle': 'Musclé',
  'costaud': 'Costaud',
  'gros': 'Gros',
  'sportif': 'Sportif',
};

const ETHNICITY_LABELS: Record<string, string> = {
  'europeen': 'Européen',
  'africain': 'Africain',
  'maghrebin': 'Maghrébin',
  'asiatique': 'Asiatique',
  'latino': 'Latino',
  'metis': 'Métis',
  'autre': 'Autre',
};

const HIV_STATUS_LABELS: Record<string, string> = {
  'negative': '🟢 Négatif',
  'negative_prep': '💊 PrEP',
  'positive_undetectable': '🔵 Indétectable',
  'positive': '🟣 Positif',
  'no_answer': 'Non précisé',
};

const getPositionLabel = (position: string) => POSITION_LABELS[position] || position;
const getLookingForLabel = (item: string) => LOOKING_FOR_LABELS[item] || item;
const getBodyTypeLabel = (type: string) => BODY_TYPE_LABELS[type] || type;
const getEthnicityLabel = (eth: string) => ETHNICITY_LABELS[eth] || eth;

interface ProfileViewProps {
  onSignOut: () => void;
  onNavigateToAdmin?: () => void;
  onNavigateToPremium?: () => void;
  onContactAdmin?: () => void;
  isAdmin?: boolean;
}

const ProfileView = ({ onSignOut, onNavigateToAdmin, onNavigateToPremium, onContactAdmin, isAdmin }: ProfileViewProps) => {
  const { profile } = useAuth();
  const { data: stats, isLoading: statsLoading } = useProfileStats();
  const { data: isAdminUser } = useIsAdmin();
  const { isPremium, subscriptionEnd } = useSubscription();
  const { favorites } = useUserFavorites();
  const [showEditDialog, setShowEditDialog] = useState(false);

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statItems = [
    { value: stats?.messagesCount || 0, label: 'Messages', color: 'text-primary', bgColor: 'bg-primary/10', icon: MessageCircle },
    { value: stats?.conversationsCount || 0, label: 'Convs', color: 'text-blue-500', bgColor: 'bg-blue-500/10', icon: Users },
    { value: favorites.length, label: 'Favoris', color: 'text-amber-500', bgColor: 'bg-amber-500/10', icon: Star },
    { value: stats?.reactionsCount || 0, label: 'Réactions', color: 'text-pink-500', bgColor: 'bg-pink-500/10', icon: Heart },
  ];

  return (
    <div className="animate-fade-in pb-8 bg-gradient-to-b from-background to-secondary/20 min-h-screen">
      <ProfileEditDialog open={showEditDialog} onOpenChange={setShowEditDialog} />
      
      {/* Hero Header with warm gradient */}
      <div className="relative">
        <div className="h-44 bg-gradient-to-br from-primary/90 via-primary to-accent/80 relative overflow-hidden">
          {/* Warm decorative elements */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,200,100,0.1),transparent_50%)]" />
          
          {/* Settings button - top right */}
          <div className="absolute top-4 right-4 z-10">
            <ProfileSettingsDrawer
              isPremium={isPremium}
              subscriptionEnd={subscriptionEnd}
              isAdmin={isAdmin}
              onNavigateToAdmin={onNavigateToAdmin}
              onNavigateToPremium={onNavigateToPremium}
              onContactAdmin={onContactAdmin}
              onSignOut={onSignOut}
            />
          </div>
        </div>
        
        {/* Profile Card */}
        <div className="px-4 -mt-24">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-card rounded-3xl shadow-xl border border-border/50 p-5 pb-6"
          >
            {/* Avatar Section */}
            <div className="flex flex-col items-center -mt-16">
              <div className="relative">
                <div className={isPremium ? "p-1 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 shadow-xl shadow-amber-500/25" : "p-0.5 rounded-full bg-gradient-to-br from-primary/50 to-accent/50 shadow-xl"}>
                  <Avatar className="w-28 h-28 border-4 border-card">
                    <AvatarImage src={profile.avatar_url || undefined} className="object-cover" />
                    <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-accent text-white font-bold">
                      {profile.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                {/* Edit photo button */}
                <button
                  onClick={() => setShowEditDialog(true)}
                  className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 transition-transform border-2 border-card"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* Name & badges */}
              <div className="mt-4 text-center">
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold">
                    {profile.username}
                    {profile.age && <span className="text-muted-foreground font-normal">, {profile.age}</span>}
                  </h1>
                  {profile.is_verified && (
                    <Verified className="w-5 h-5 text-blue-500 fill-blue-500" />
                  )}
                </div>
                
                {/* Role badges */}
                <div className="flex items-center justify-center gap-2 mt-2">
                  {isAdminUser && (
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-md">
                      <Crown className="w-3 h-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                  {isPremium && !isAdminUser && (
                    <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 shadow-md">
                      <Crown className="w-3 h-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                  {shouldShowOnlineIndicator(profile) && (
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                      En ligne
                    </Badge>
                  )}
                </div>

                {/* Position badge */}
                {(profile as any).sexual_position && (profile as any).sexual_position !== 'no_answer' && (
                  <Badge variant="outline" className="mt-2 bg-secondary/50">
                    {getPositionLabel((profile as any).sexual_position)}
                  </Badge>
                )}
              </div>

              {/* Quick info */}
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {profile.region}
                </span>
                {((profile as any).height || (profile as any).weight) && (
                  <span>
                    {(profile as any).height && `${(profile as any).height}cm`}
                    {(profile as any).height && (profile as any).weight && ' • '}
                    {(profile as any).weight && `${(profile as any).weight}kg`}
                  </span>
                )}
                {profile.created_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(profile.created_at), 'MMM yyyy', { locale: fr })}
                  </span>
                )}
              </div>

              {/* Looking for badges */}
              {(profile as any).looking_for && (profile as any).looking_for.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5 mt-4">
                  {(profile as any).looking_for.slice(0, 5).map((item: string) => (
                    <Badge key={item} variant="secondary" className="text-xs bg-secondary/70">
                      {getLookingForLabel(item)}
                    </Badge>
                  ))}
                  {(profile as any).looking_for.length > 5 && (
                    <Badge variant="secondary" className="text-xs bg-secondary/70">
                      +{(profile as any).looking_for.length - 5}
                    </Badge>
                  )}
                </div>
              )}

              {/* Additional info */}
              <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                {(profile as any).body_type && (
                  <Badge variant="outline" className="text-xs">
                    {getBodyTypeLabel((profile as any).body_type)}
                  </Badge>
                )}
                {(profile as any).ethnicity && (
                  <Badge variant="outline" className="text-xs">
                    {getEthnicityLabel((profile as any).ethnicity)}
                  </Badge>
                )}
                {(profile as any).hiv_status && (profile as any).hiv_status !== 'no_answer' && (
                  <Badge variant="outline" className="text-xs">
                    {HIV_STATUS_LABELS[(profile as any).hiv_status]}
                  </Badge>
                )}
              </div>

              {/* Bio */}
              {profile.bio && (
                <div className="mt-4 p-3 rounded-2xl bg-secondary/30 max-w-full w-full">
                  <p className="text-center text-muted-foreground text-sm leading-relaxed line-clamp-3">
                    {profile.bio}
                  </p>
                </div>
              )}

              {/* Edit button */}
              <Button 
                variant="default" 
                size="sm" 
                className="mt-4 gap-2 rounded-xl shadow-md"
                onClick={() => setShowEditDialog(true)}
              >
                <Edit2 className="w-4 h-4" />
                Modifier le profil
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Stats Grid */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-4 gap-2 px-4 mt-4"
      >
        {statItems.map((stat) => (
          <Card key={stat.label} className="bg-card/80 backdrop-blur-sm border-border/50 overflow-hidden">
            <CardContent className="p-3 text-center">
              <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center mx-auto mb-1.5`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <p className={`text-xl font-bold ${stat.color}`}>
                {statsLoading && stat.label !== 'Favoris' ? '...' : stat.value}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Reactions Section */}
      {profile.user_id && (
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="px-4 mt-4"
        >
          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-3 text-center font-medium uppercase tracking-wider flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Réactions sur ton profil
              </p>
              <ProfileReactions profileUserId={profile.user_id} className="justify-center" />
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default ProfileView;
