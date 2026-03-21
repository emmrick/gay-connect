import { useState } from 'react';
import { Download, Lock, Loader2, Shield, FileArchive, CheckCircle, Image, MessageSquare, FolderOpen } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DataExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ExportStats {
  photos: number;
  album_media: number;
  ephemeral_media: number;
  group_messages: number;
  private_messages: number;
}

const DataExportDialog = ({ open, onOpenChange }: DataExportDialogProps) => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<ExportStats | null>(null);

  const handleExport = async () => {
    if (!password.trim()) {
      toast.error('Veuillez entrer votre mot de passe');
      return;
    }

    setIsLoading(true);
    setProgress(10);

    try {
      // Simulate progress during the export
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 85));
      }, 500);

      const { data, error } = await supabase.functions.invoke('export-user-data', {
        body: { password },
      });

      clearInterval(progressInterval);
      setProgress(90);

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        setIsLoading(false);
        setProgress(0);
        return;
      }

      // Decode base64 and create ZIP blob
      const binaryString = atob(data.zip_base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'application/zip' });

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename || `gaysocial-export-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setProgress(100);
      setStats(data.stats);
      setIsSuccess(true);
      toast.success('Vos données ont été téléchargées avec succès');

      // Reset and close after delay
      setTimeout(() => {
        setIsSuccess(false);
        setPassword('');
        setProgress(0);
        setStats(null);
        onOpenChange(false);
      }, 4000);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erreur lors de l\'export des données');
      setProgress(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setPassword('');
      setIsSuccess(false);
      setProgress(0);
      setStats(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileArchive className="w-5 h-5 text-primary" />
            Télécharger mes données
          </DialogTitle>
          <DialogDescription>
            Conformément au RGPD (Article 20), téléchargez l'ensemble de vos données personnelles dans une archive ZIP.
          </DialogDescription>
        </DialogHeader>

        {isSuccess && stats ? (
          <div className="py-6 space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <p className="font-medium text-lg">Téléchargement réussi !</p>
              <p className="text-sm text-muted-foreground mt-1">
                Vos données ont été exportées dans une archive ZIP.
              </p>
            </div>

            {/* Stats summary */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-secondary/50 rounded-xl p-3 text-center">
                <Image className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-xl font-bold">{stats.photos + stats.album_media}</p>
                <p className="text-xs text-muted-foreground">Photos/Médias</p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-3 text-center">
                <MessageSquare className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-xl font-bold">{stats.group_messages + stats.private_messages}</p>
                <p className="text-xs text-muted-foreground">Messages</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Security notice */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Shield className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-600 dark:text-amber-400">Vérification de sécurité</p>
                <p className="text-muted-foreground mt-1">
                  Pour protéger vos données, veuillez confirmer votre identité en entrant votre mot de passe.
                </p>
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Mot de passe du compte
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez votre mot de passe"
                disabled={isLoading}
                onKeyDown={(e) => e.key === 'Enter' && handleExport()}
              />
            </div>

            {/* Progress bar */}
            {isLoading && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  {progress < 30 && "Vérification du mot de passe..."}
                  {progress >= 30 && progress < 60 && "Collecte de vos données..."}
                  {progress >= 60 && progress < 85 && "Téléchargement des médias..."}
                  {progress >= 85 && "Création de l'archive ZIP..."}
                </p>
              </div>
            )}

            {/* Data included info */}
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                Contenu de l'archive :
              </p>
              <ul className="grid grid-cols-2 gap-1 text-xs pl-6">
                <li className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Profil complet
                </li>
                <li className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Photos de profil
                </li>
                <li className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Albums privés
                </li>
                <li className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Messages envoyés
                </li>
                <li className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Médias éphémères
                </li>
                <li className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Historique crédits
                </li>
                <li className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Favoris & réactions
                </li>
                <li className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Préférences
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleExport}
                disabled={isLoading || !password.trim()}
                className="flex-1 bg-gradient-to-r from-primary to-primary/80"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Export en cours...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger (.zip)
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DataExportDialog;
