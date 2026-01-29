import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

const AGE_CONFIRMED_KEY = 'age_confirmed';

export const AgeConfirmationModal = () => {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const isConfirmed = localStorage.getItem(AGE_CONFIRMED_KEY);
    if (!isConfirmed) {
      setShowModal(true);
    }
  }, []);

  const handleConfirm = () => {
    localStorage.setItem(AGE_CONFIRMED_KEY, 'true');
    setShowModal(false);
  };

  const handleDecline = () => {
    window.location.href = 'https://www.google.com';
  };

  return (
    <AlertDialog open={showModal}>
      <AlertDialogContent className="max-w-md border-destructive/50 bg-background">
        <AlertDialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <AlertDialogTitle className="text-2xl font-bold text-center">
            Vérification d'âge requise
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-4 pt-2">
            <p className="text-base">
              Ce site contient du contenu réservé aux <strong className="text-destructive">adultes de 18 ans et plus</strong>.
            </p>
            <p className="text-sm text-muted-foreground">
              En cliquant sur "J'ai 18 ans ou plus", vous confirmez que vous avez l'âge légal requis pour accéder à ce contenu dans votre pays de résidence.
            </p>
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <strong>⚠️ Avertissement :</strong> L'accès à ce site par des mineurs est strictement interdit.
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
          <Button 
            onClick={handleConfirm}
            className="w-full"
            size="lg"
          >
            J'ai 18 ans ou plus - Entrer
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDecline}
            className="w-full"
            size="lg"
          >
            J'ai moins de 18 ans - Quitter
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
