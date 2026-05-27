/**
 * PlanNowAlbumExchangeButton — bouton visible uniquement quand deux utilisateurs
 * sont en Plan Now mutuel. Ouvre le sheet de partage rapide d'album (30 min).
 */
import { useState } from 'react';
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlanNowMutualActive } from '@/hooks/usePlanNowAlbumShare';
import PlanNowAlbumShareSheet from './PlanNowAlbumShareSheet';

interface Props {
  otherUserId: string;
  otherUsername?: string;
  className?: string;
}

const PlanNowAlbumExchangeButton = ({ otherUserId, otherUsername, className }: Props) => {
  const mutual = usePlanNowMutualActive(otherUserId);
  const [open, setOpen] = useState(false);

  if (!mutual) return null;

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        size="sm"
        className={`gap-1.5 border-amber-500/40 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 ${className ?? ''}`}
      >
        <Zap className="w-3.5 h-3.5" />
        Échanger un album
      </Button>
      <PlanNowAlbumShareSheet
        open={open}
        onOpenChange={setOpen}
        toUserId={otherUserId}
        toUsername={otherUsername}
      />
    </>
  );
};

export default PlanNowAlbumExchangeButton;
