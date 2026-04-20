/**
 * Onboarding Tour — Guide plein écran post-inscription.
 *
 * - 10 étapes définies dans `src/lib/onboarding/onboardingSteps.ts`
 * - Plein écran (fixed inset-0 z-[80]) — pas une modale étroite
 * - Indicateur de progression (barre + 3/10) toujours visible
 * - Swipe horizontal sur mobile (framer-motion drag)
 * - Touche Esc / bouton « Passer » avec confirmation si non terminé
 * - CTA contextuels qui ferment le tour sans le marquer terminé
 *   et naviguent vers la route concernée
 *
 * Auto-ouverture une seule fois après inscription (cf. `useOnboarding`).
 * Relancable depuis :
 *   - Paramètres → Aide & Support → « Revoir le guide »
 *   - Chatbot d'aide → option « Revoir le guide »
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useAuth } from '@/contexts/AuthContext';
import { ONBOARDING_STEPS, ACCENT_CLASSES } from '@/lib/onboarding/onboardingSteps';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const SWIPE_THRESHOLD = 60;

const OnboardingTour = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isOpen, currentStep, goToStep, close, complete } = useOnboarding();
  const [askConfirmSkip, setAskConfirmSkip] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);

  // Récupère le pseudo pour personnaliser la 1ʳᵉ slide
  const { data: profile } = useQuery({
    queryKey: ['onboarding-username', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id && isOpen,
  });

  const total = ONBOARDING_STEPS.length;
  const step = ONBOARDING_STEPS[currentStep] ?? ONBOARDING_STEPS[0];
  const accent = ACCENT_CLASSES[step.accent];
  const isFirst = currentStep === 0;
  const isLast = currentStep === total - 1;
  const Icon = step.icon;
  const personalizedSubtitle =
    step.id === 'welcome' && profile?.username
      ? `Bonjour ${profile.username}, on t\'embarque pour un tour rapide.`
      : step.subtitle;

  // Touche clavier : ←/→ pour naviguer, Esc pour passer.
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (!isLast) { setDirection(1); goToStep(currentStep + 1); }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (!isFirst) { setDirection(-1); goToStep(currentStep - 1); }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleSkipRequest();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentStep, isLast, isFirst]);

  const handleNext = useCallback(() => {
    if (isLast) {
      complete();
      return;
    }
    setDirection(1);
    goToStep(currentStep + 1);
  }, [isLast, currentStep, goToStep, complete]);

  const handlePrev = useCallback(() => {
    if (isFirst) return;
    setDirection(-1);
    goToStep(currentStep - 1);
  }, [isFirst, currentStep, goToStep]);

  const handleSwipe = useCallback(
    (_: unknown, info: PanInfo) => {
      if (info.offset.x < -SWIPE_THRESHOLD && !isLast) {
        handleNext();
      } else if (info.offset.x > SWIPE_THRESHOLD && !isFirst) {
        handlePrev();
      }
    },
    [handleNext, handlePrev, isFirst, isLast]
  );

  const handleSkipRequest = useCallback(() => {
    // Si on est à la dernière étape, le bouton « Passer » équivaut à terminer.
    if (isLast) {
      complete();
      return;
    }
    setAskConfirmSkip(true);
  }, [isLast, complete]);

  const handleSkipConfirm = useCallback(() => {
    setAskConfirmSkip(false);
    complete();
  }, [complete]);

  const handleCTA = useCallback(() => {
    if (!step.cta) return;
    // On marque comme terminé : l'utilisateur a explicitement choisi d'aller voir.
    complete();
    navigate(step.cta.to);
  }, [step.cta, complete, navigate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-background overscroll-contain">
      {/* Halo coloré décoratif derrière le contenu */}
      <div
        aria-hidden
        className={cn(
          'absolute inset-0 pointer-events-none opacity-60 transition-colors duration-500',
          'bg-gradient-to-br',
          accent.from, accent.to,
        )}
        style={{ filter: 'blur(120px) saturate(1.2)', transform: 'scale(1.1)' }}
      />
      <div aria-hidden className="absolute inset-0 pointer-events-none bg-background/85" />

      {/* Header : progression + skip */}
      <header
        className="relative z-10 flex items-center gap-3 px-5 pt-3 pb-2"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))' }}
      >
        <span className="text-[11px] font-mono font-semibold text-muted-foreground tabular-nums shrink-0">
          {currentStep + 1} / {total}
        </span>
        {/* Barre de progression segmentée */}
        <div className="flex-1 flex items-center gap-1">
          {ONBOARDING_STEPS.map((_, i) => (
            <button
              key={i}
              aria-label={`Aller à l'étape ${i + 1}`}
              onClick={() => { setDirection(i > currentStep ? 1 : -1); goToStep(i); }}
              className="flex-1 h-1.5 rounded-full overflow-hidden bg-muted/60 hover:bg-muted transition-colors"
            >
              <motion.div
                initial={false}
                animate={{ width: i < currentStep ? '100%' : i === currentStep ? '100%' : '0%' }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className={cn('h-full rounded-full bg-gradient-to-r', accent.from, accent.to)}
              />
            </button>
          ))}
        </div>
        <button
          onClick={handleSkipRequest}
          className="text-[12px] font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted/40 transition-colors shrink-0"
        >
          {isLast ? 'Terminer' : 'Passer'}
        </button>
      </header>

      {/* Slide content */}
      <main className="relative z-10 flex-1 min-h-0 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step.id}
            custom={direction}
            initial={{ opacity: 0, x: direction * 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -30 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={handleSwipe}
            className="h-full overflow-y-auto px-6 pt-6 pb-8 cursor-grab active:cursor-grabbing"
          >
            <div className="max-w-md mx-auto flex flex-col items-center text-center">
              {/* Icône en gradient avec halo */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 220, damping: 18 }}
                className={cn(
                  'relative w-24 h-24 rounded-[28px] flex items-center justify-center mb-6 shadow-2xl',
                  'bg-gradient-to-br',
                  accent.from, accent.to,
                  'ring-8',
                  accent.ring,
                )}
              >
                <Icon className="w-11 h-11 text-white drop-shadow-md" />
                <span className="absolute -top-2 -right-2 text-3xl drop-shadow-lg">
                  {step.emoji}
                </span>
              </motion.div>

              {/* Titre */}
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="font-display text-2xl sm:text-3xl font-bold leading-tight mb-2 text-foreground"
              >
                {step.title}
              </motion.h1>

              {/* Sous-titre */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className={cn('text-sm sm:text-[15px] font-medium mb-4', accent.text)}
              >
                {personalizedSubtitle}
              </motion.p>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-[14.5px] text-muted-foreground leading-relaxed mb-5 max-w-prose"
              >
                {step.description}
              </motion.p>

              {/* Bullets */}
              {step.bullets && step.bullets.length > 0 && (
                <motion.ul
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="w-full space-y-2 mb-4 text-left"
                >
                  {step.bullets.map((b, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.06 }}
                      className={cn(
                        'flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border border-border/40 bg-card/70 backdrop-blur-sm',
                        'text-[13.5px] text-foreground/90 leading-snug'
                      )}
                    >
                      <Check className={cn('w-4 h-4 mt-0.5 shrink-0', accent.text)} />
                      <span>{b}</span>
                    </motion.li>
                  ))}
                </motion.ul>
              )}

              {/* Tip */}
              {step.tip && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                  className={cn(
                    'w-full flex items-start gap-2 p-3 rounded-xl text-left text-[13px] leading-snug',
                    accent.bg, accent.text, 'font-medium'
                  )}
                >
                  <span className="text-base">💡</span>
                  <span>{step.tip}</span>
                </motion.div>
              )}

              {/* CTA contextuel */}
              {step.cta && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  onClick={handleCTA}
                  className={cn(
                    'mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold',
                    'bg-card hover:bg-muted/60 border border-border/60 transition-all active:scale-95',
                    accent.text,
                  )}
                >
                  {step.cta.label}
                  <ArrowRight className="w-3.5 h-3.5" />
                </motion.button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer : Précédent / Suivant */}
      <footer
        className="relative z-10 flex items-center gap-3 px-5 pt-3 pb-5 border-t border-border/40 bg-card/80 backdrop-blur-xl"
        style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))' }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrev}
          disabled={isFirst}
          aria-label="Étape précédente"
          className="rounded-xl shrink-0 disabled:opacity-30"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <Button
          onClick={handleNext}
          className={cn(
            'flex-1 h-11 rounded-xl font-semibold gap-2 text-[14px] shadow-lg',
            'bg-gradient-to-r text-white border-0',
            accent.from, accent.to,
          )}
        >
          {isLast ? (
            <>Commencer à utiliser le site <Check className="w-4 h-4" /></>
          ) : (
            <>Suivant <ChevronRight className="w-4 h-4" /></>
          )}
        </Button>
      </footer>

      {/* Modale de confirmation « Passer le guide » */}
      <AnimatePresence>
        {askConfirmSkip && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-background/85 backdrop-blur-sm p-6"
            onClick={() => setAskConfirmSkip(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl bg-card border border-border/50 shadow-2xl p-6 text-center"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-3">
                <X className="w-6 h-6 text-muted-foreground" />
              </div>
              <h3 className="font-display text-lg font-bold mb-1">Passer le guide ?</h3>
              <p className="text-[13.5px] text-muted-foreground mb-5 leading-relaxed">
                Tu pourras toujours le revoir depuis tes paramètres ou le chatbot d'aide.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setAskConfirmSkip(false)}
                >
                  Continuer le guide
                </Button>
                <Button
                  className="flex-1 rounded-xl"
                  onClick={handleSkipConfirm}
                >
                  Passer
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OnboardingTour;
