import { Wrench } from 'lucide-react';

interface MaintenanceScreenProps {
  message?: string | null;
}

const MaintenanceScreen = ({ message }: MaintenanceScreenProps) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-md space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
          <Wrench className="w-10 h-10 text-primary animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Maintenance en cours
        </h1>
        <p className="text-muted-foreground text-lg">
          {message || 'Le site est en maintenance. Veuillez réessayer plus tard.'}
        </p>
        <p className="text-sm text-muted-foreground/70">
          Nous travaillons à améliorer votre expérience. Merci de votre patience.
        </p>
      </div>
    </div>
  );
};

export default MaintenanceScreen;
