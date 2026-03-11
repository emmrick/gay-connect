import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Cookie, X, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const COOKIE_CONSENT_KEY = 'gc_cookie_consent';

type ConsentChoice = 'accepted' | 'rejected' | 'custom';

interface CookiePreferences {
  essential: boolean; // always true
  preferences: boolean;
  analytics: boolean;
}

const CookieConsentBanner = () => {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    preferences: true,
    analytics: false,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!stored) {
        // Delay to avoid showing immediately on first render
        const timer = setTimeout(() => setVisible(true), 1500);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage not available
    }
  }, []);

  const saveConsent = (choice: ConsentChoice, prefs: CookiePreferences) => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
        choice,
        preferences: prefs,
        timestamp: new Date().toISOString(),
      }));
    } catch {}
    setVisible(false);
  };

  const handleAcceptAll = () => {
    saveConsent('accepted', { essential: true, preferences: true, analytics: true });
  };

  const handleRejectNonEssential = () => {
    saveConsent('rejected', { essential: true, preferences: false, analytics: false });
  };

  const handleSaveCustom = () => {
    saveConsent('custom', preferences);
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6"
      >
        <div className="max-w-2xl mx-auto bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-5 pb-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Cookie className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-bold text-base text-foreground">
                  🍪 Utilisation des cookies
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Gay Connect utilise des cookies et le stockage local pour assurer le bon fonctionnement 
                  du site et mémoriser vos préférences. Nous n'utilisons <strong>aucun cookie publicitaire 
                  ni traceur tiers</strong>.{' '}
                  <button 
                    onClick={() => {
                      // Navigate to cookie policy - handled via window.location to avoid router dependency
                      window.location.href = '/legal#cookies';
                    }}
                    className="text-primary hover:underline"
                  >
                    En savoir plus
                  </button>
                </p>
              </div>
            </div>
          </div>

          {/* Details toggle */}
          <div className="px-5">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              Personnaliser mes choix
            </button>

            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="py-3 space-y-3">
                    {/* Essential - always on */}
                    <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/50">
                      <div>
                        <p className="text-sm font-medium text-foreground">Essentiels</p>
                        <p className="text-xs text-muted-foreground">Authentification, session, sécurité</p>
                      </div>
                      <div className="text-xs text-muted-foreground italic">Obligatoire</div>
                    </label>

                    {/* Preferences */}
                    <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/50 cursor-pointer">
                      <div>
                        <p className="text-sm font-medium text-foreground">Préférences</p>
                        <p className="text-xs text-muted-foreground">Thème, langue, navigation mémorisée</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.preferences}
                        onChange={(e) => setPreferences(p => ({ ...p, preferences: e.target.checked }))}
                        className="w-4 h-4 rounded accent-primary"
                      />
                    </label>

                    {/* Analytics */}
                    <label className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/50 cursor-pointer">
                      <div>
                        <p className="text-sm font-medium text-foreground">Statistiques anonymes</p>
                        <p className="text-xs text-muted-foreground">Amélioration du service (aucun tiers)</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) => setPreferences(p => ({ ...p, analytics: e.target.checked }))}
                        className="w-4 h-4 rounded accent-primary"
                      />
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Buttons */}
          <div className="p-5 pt-3 flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRejectNonEssential}
              className="flex-1 text-xs"
            >
              Refuser les non-essentiels
            </Button>
            {showDetails ? (
              <Button
                size="sm"
                onClick={handleSaveCustom}
                className="flex-1 text-xs bg-gradient-to-r from-primary to-primary/80"
              >
                Enregistrer mes choix
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleAcceptAll}
                className="flex-1 text-xs bg-gradient-to-r from-primary to-primary/80"
              >
                Tout accepter
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CookieConsentBanner;
