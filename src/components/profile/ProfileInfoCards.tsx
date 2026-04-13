import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';

interface ProfileInfoCardsProps {
  profile: any;
  lookingForLabels: Record<string, string>;
  bodyTypeLabels: Record<string, string>;
  ethnicityLabels: Record<string, string>;
  hivStatusLabels: Record<string, string>;
}

const ProfileInfoCards = ({ profile, lookingForLabels, bodyTypeLabels, ethnicityLabels, hivStatusLabels }: ProfileInfoCardsProps) => {
  const hasLookingFor = profile.looking_for?.length > 0;
  const hasDetails = profile.body_type || profile.ethnicity || (profile.hiv_status && profile.hiv_status !== 'no_answer');

  if (!hasLookingFor && !hasDetails) return null;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.15 }}
      className="bg-card/70 backdrop-blur-sm rounded-2xl border border-border/40 p-4 space-y-4 shadow-sm"
    >
      {/* Looking for */}
      {hasLookingFor && (
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
            <Heart className="w-3 h-3 text-pink-500/60" />
            Recherche
          </p>
          <div className="flex flex-wrap gap-1.5">
            {profile.looking_for.map((item: string) => (
              <Badge key={item} className="bg-primary/10 text-primary border-primary/20 text-xs font-medium backdrop-blur-sm hover:bg-primary/15 transition-colors">
                {lookingForLabels[item] || item}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Physical details */}
      {hasDetails && (
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-accent/60" />
            Détails
          </p>
          <div className="flex flex-wrap gap-1.5">
            {profile.body_type && (
              <Badge variant="outline" className="text-xs backdrop-blur-sm bg-secondary/40">{bodyTypeLabels[profile.body_type] || profile.body_type}</Badge>
            )}
            {profile.ethnicity && (
              <Badge variant="outline" className="text-xs backdrop-blur-sm bg-secondary/40">{ethnicityLabels[profile.ethnicity] || profile.ethnicity}</Badge>
            )}
            {profile.hiv_status && profile.hiv_status !== 'no_answer' && (
              <Badge variant="outline" className="text-xs backdrop-blur-sm bg-secondary/40">{hivStatusLabels[profile.hiv_status]}</Badge>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ProfileInfoCards;
