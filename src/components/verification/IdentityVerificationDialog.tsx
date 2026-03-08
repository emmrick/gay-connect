import { useEffect, useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useIdentityVerification } from '@/hooks/useIdentityVerification';
import { Camera, Check, Loader2, AlertTriangle, Shield, Trash2, Clock, CheckCircle2, XCircle, Lightbulb, User } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import CaptureGuideOverlay from './CaptureGuideOverlay';

interface IdentityVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'intro' | 'selfie' | 'review' | 'submitted';

const IdentityVerificationDialog = ({ open, onOpenChange }: IdentityVerificationDialogProps) => {
  const { verification, createVerification, deleteRejectedVerification, uploadDocument, submitVerification, refetch } = useIdentityVerification();
  const [step, setStep] = useState<Step>('intro');
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const revokePreviewUrl = (url: string | null) => {
    if (url?.startsWith('blob:')) {
      try { URL.revokeObjectURL(url); } catch { /* noop */ }
    }
  };

  const startCamera = useCallback(() => {
    setIsCameraActive(true);
    
    const videoConstraints: MediaTrackConstraints = {
      facingMode: 'user',
      width: { ideal: 1920, min: 1280 },
      height: { ideal: 1440, min: 960 },
    };

    navigator.mediaDevices.getUserMedia({ video: videoConstraints, audio: false })
    .then((stream) => {
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
        };
      }
    })
    .catch((error) => {
      console.error('Camera access error:', error);
      setIsCameraActive(false);
      
      if (error.name === 'NotAllowedError') {
        toast.error('Permission caméra refusée. Autorise l\'accès dans les paramètres.');
      } else if (error.name === 'NotFoundError') {
        toast.error('Aucune caméra détectée.');
      } else if (error.name === 'OverconstrainedError') {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => { videoRef.current?.play().catch(() => {}); };
          }
          setIsCameraActive(true);
        })
        .catch(() => toast.error('Impossible d\'accéder à la caméra'));
      } else {
        toast.error('Erreur caméra: ' + (error.message || 'Impossible d\'accéder à la caméra'));
      }
    });
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  useEffect(() => {
    if (open) return;
    stopCamera();
    setIsUploading(false);
    revokePreviewUrl(selfiePreview);
    setSelfieFile(null);
    setSelfiePreview(null);
    setStep('intro');
  }, [open, stopCamera, selfiePreview]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const vw = videoRef.current.videoWidth;
        const vh = videoRef.current.videoHeight;
        canvasRef.current.width = vw;
        canvasRef.current.height = vh;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(videoRef.current, 0, 0, vw, vh);
        canvasRef.current.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `selfie_${Date.now()}.jpg`, { type: 'image/jpeg' });
            setSelfieFile(file);
            setSelfiePreview(URL.createObjectURL(file));
          }
        }, 'image/jpeg', 1.0);
      }
    }
    stopCamera();
  };

  const handleNext = async () => {
    if (step === 'intro') {
      if (verification?.status === 'rejected') {
        await deleteRejectedVerification.mutateAsync();
        await refetch();
        await createVerification.mutateAsync();
      } else if (!verification) {
        await createVerification.mutateAsync();
      }
      setStep('selfie');
    } else if (step === 'selfie' && selfieFile) {
      setStep('review');
    } else if (step === 'review') {
      await handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!selfieFile) return;
    setIsUploading(true);
    try {
      const selfieUrl = await uploadDocument(selfieFile, 'selfie');
      await submitVerification.mutateAsync({ selfieUrl });
      toast.success('Selfie envoyé avec succès !');
      onOpenChange(false);
      refetch();
    } catch (error: any) {
      console.error('Verification submission error:', error);
      toast.error(error?.message || 'Erreur lors de l\'envoi');
    } finally {
      setIsUploading(false);
    }
  };

  const renderIntro = () => (
    <div className="space-y-6 text-center">
      <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
        <Shield className="w-10 h-10 text-primary" />
      </div>
      <div>
        <h3 className="font-display text-xl font-semibold mb-2">Vérifie ton identité</h3>
        <p className="text-muted-foreground text-sm">
          Pour garantir un espace sécurisé, nous devons vérifier que tu es bien une personne réelle.
        </p>
      </div>
      
      <div className="bg-secondary/50 rounded-xl p-4 text-left space-y-3">
        <h4 className="font-semibold text-sm">Ce dont tu auras besoin :</h4>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-primary" />
            Un selfie clair de ton visage
          </li>
        </ul>
      </div>

      <div className="bg-primary/10 rounded-xl p-4 text-left border border-primary/20">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm text-primary">Simple et rapide</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Un selfie suffit ! Notre équipe vérifiera manuellement que tu es une personne réelle.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-destructive/10 rounded-xl p-4 text-left border border-destructive/20">
        <div className="flex items-start gap-3">
          <Trash2 className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm text-destructive">Protection de tes données</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Ton selfie sera <strong>définitivement supprimé</strong> immédiatement après vérification.
            </p>
          </div>
        </div>
      </div>

      <Button variant="hero" className="w-full" onClick={handleNext}>
        Prendre un selfie
      </Button>
    </div>
  );

  const renderSelfieStep = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="font-display text-lg font-semibold mb-1">Prends un selfie</h3>
        <p className="text-muted-foreground text-sm">Une photo claire de ton visage</p>
      </div>

      {!isCameraActive && !selfiePreview && (
        <div className="rounded-xl p-4 border bg-primary/10 border-primary/20">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-primary">Conseils pour le selfie</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Tiens ton téléphone à bout de bras (~40cm)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Garde une expression neutre, regarde la caméra
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Assure-toi d'avoir un bon éclairage
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {isCameraActive ? (
        <div className="relative aspect-[3/4] bg-black rounded-xl overflow-hidden flex items-center justify-center">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
          <canvas ref={canvasRef} className="hidden" />
          <CaptureGuideOverlay type="selfie" isGoodDistance={true} />
          
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 z-10">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={stopCamera}
              className="rounded-full bg-background/80 hover:bg-background"
            >
              <XCircle className="w-5 h-5" />
            </Button>
            <Button 
              size="icon" 
              onClick={capturePhoto}
              className="rounded-full w-16 h-16 bg-white hover:bg-white/90 shadow-lg"
            >
              <div className="w-12 h-12 rounded-full border-4 border-primary" />
            </Button>
          </div>
        </div>
      ) : selfiePreview ? (
        <div className="relative aspect-[3/4] bg-secondary rounded-xl overflow-hidden">
          <img 
            src={selfiePreview} 
            alt="Preview" 
            className="w-full h-full object-cover scale-x-[-1]"
          />
          <div className="absolute top-2 right-2">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => { setSelfieFile(null); setSelfiePreview(null); }}
              className="rounded-full shadow-lg"
            >
              <Camera className="w-4 h-4 mr-1" />
              Reprendre
            </Button>
          </div>
          <div className="absolute bottom-2 left-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500 text-white text-xs font-medium shadow-lg">
              <Check className="w-3.5 h-3.5" />
              Photo capturée
            </div>
          </div>
        </div>
      ) : (
        <div className="aspect-[3/4] bg-secondary/50 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-4">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-10 h-10 text-primary" />
          </div>
          <div className="text-center px-4">
            <p className="text-sm font-medium mb-1">Prends un selfie</p>
            <p className="text-xs text-muted-foreground">Ton visage doit être clairement visible</p>
          </div>
          <Button variant="hero" onClick={startCamera} className="gap-2">
            <Camera className="w-4 h-4" />
            Ouvrir la caméra
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => { stopCamera(); setStep('intro'); }}
        >
          Retour
        </Button>
        <Button 
          variant="hero" 
          className="flex-1"
          onClick={handleNext}
          disabled={!selfieFile}
        >
          Continuer
        </Button>
      </div>
    </div>
  );

  const renderReview = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="font-display text-lg font-semibold mb-1">Vérifie ton selfie</h3>
        <p className="text-muted-foreground text-sm">Assure-toi que la photo est nette</p>
      </div>

      <div className="space-y-1">
        <div className="aspect-[3/4] max-w-[240px] mx-auto bg-secondary rounded-xl overflow-hidden relative">
          {selfiePreview && <img src={selfiePreview} alt="Selfie" className="w-full h-full object-cover scale-x-[-1]" />}
          {isUploading && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
        </div>
      </div>

      {isUploading && (
        <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-primary">Envoi en cours...</p>
              <p className="text-xs text-muted-foreground">Upload du selfie...</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-muted/50 rounded-xl p-3 text-xs text-muted-foreground text-center">
        En envoyant ce selfie, tu confirmes avoir 18 ans ou plus et acceptes
        que ta photo soit vérifiée puis immédiatement supprimée.
      </div>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => setStep('selfie')} disabled={isUploading}>
          Retour
        </Button>
        <Button 
          variant="hero" 
          className="flex-1"
          onClick={handleNext}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Envoi...
            </>
          ) : (
            'Envoyer'
          )}
        </Button>
      </div>
    </div>
  );

  const renderStatus = () => {
    if (!verification) return null;

    if (verification.status === 'approved') {
      return (
        <div className="space-y-6 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <div>
            <h3 className="font-display text-xl font-semibold mb-2">Identité vérifiée !</h3>
            <p className="text-muted-foreground text-sm">
              Ton compte a été vérifié avec succès. Ton selfie a été supprimé.
            </p>
          </div>
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>Fermer</Button>
        </div>
      );
    }

    if (verification.status === 'rejected') {
      return (
        <div className="space-y-6 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-destructive/20 flex items-center justify-center">
            <XCircle className="w-10 h-10 text-destructive" />
          </div>
          <div>
            <h3 className="font-display text-xl font-semibold mb-2">Vérification refusée</h3>
            <p className="text-muted-foreground text-sm">
              {verification.rejection_reason || 'Ta demande n\'a pas pu être validée.'}
            </p>
          </div>
          <Button 
            variant="hero" 
            className="w-full" 
            onClick={async () => {
              await deleteRejectedVerification.mutateAsync();
              setSelfieFile(null);
              setSelfiePreview(null);
              setStep('intro');
            }}
            disabled={deleteRejectedVerification.isPending}
          >
            {deleteRejectedVerification.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" />Préparation...</>
            ) : 'Réessayer'}
          </Button>
        </div>
      );
    }

    if (verification.submitted_at && verification.status === 'pending') {
      return (
        <div className="space-y-6 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-yellow-500/20 flex items-center justify-center">
            <Clock className="w-10 h-10 text-yellow-500" />
          </div>
          <div>
            <h3 className="font-display text-xl font-semibold mb-2">En attente de vérification</h3>
            <p className="text-muted-foreground text-sm">
              Ton selfie est en cours de vérification par notre équipe.
            </p>
          </div>
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>Fermer</Button>
        </div>
      );
    }

    return null;
  };

  const getContent = () => {
    if (verification?.status === 'approved' || verification?.status === 'rejected' || 
        (verification?.submitted_at && verification?.status === 'pending')) {
      return renderStatus();
    }

    switch (step) {
      case 'intro': return renderIntro();
      case 'selfie': return renderSelfieStep();
      case 'review': return renderReview();
      default: return renderIntro();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Vérification d'identité</DialogTitle>
          <DialogDescription className="sr-only">
            Vérifiez votre identité en prenant un selfie
          </DialogDescription>
        </DialogHeader>
        {getContent()}
      </DialogContent>
    </Dialog>
  );
};

export default IdentityVerificationDialog;
