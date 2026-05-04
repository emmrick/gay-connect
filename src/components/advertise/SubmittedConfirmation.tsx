import SEOHead from '@/components/seo/SEOHead';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

interface SubmittedConfirmationProps {
  onSubmitAnother: () => void;
  onOpenDashboard: () => void;
}

const SubmittedConfirmation = ({ onSubmitAnother, onOpenDashboard }: SubmittedConfirmationProps) => (
  <>
    <SEOHead title="Demande envoyée — GaySocial Publicité" description="Votre demande de publicité a été soumise avec succès." />
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-8 pb-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Demande reçue !</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Notre équipe examinera votre annonce sous 24 à 48h. N'oubliez pas de recharger votre portefeuille pour que votre annonce soit diffusée une fois approuvée.
          </p>
          <div className="flex gap-2 justify-center pt-2">
            <Button variant="outline" onClick={onSubmitAnother}>Soumettre une autre</Button>
            <Button onClick={onOpenDashboard}>Mon espace annonceur</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </>
);

export default SubmittedConfirmation;
