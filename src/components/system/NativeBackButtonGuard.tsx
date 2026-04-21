import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

/**
 * Garde global du bouton retour matériel sur Android natif (Capacitor).
 * - Si on est sur la racine "/", on minimise l'app au lieu de la fermer.
 * - Sinon, on délègue à l'historique du navigateur (React Router) pour
 *   reculer d'un cran. Les hooks `useMobileNavigation` montés sur les
 *   pages enfant interceptent en priorité grâce à leur sentinelle.
 */
const NativeBackButtonGuard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor?.isNativePlatform?.()) return;

    let isCleanedUp = false;
    const handlePromise = CapacitorApp.addListener('backButton', () => {
      // Laisse les écouteurs locaux (useMobileNavigation) s'exécuter en premier.
      // Ils consomment l'événement via window.history.back().
      // Si personne ne l'a intercepté, on gère ici.
      setTimeout(() => {
        if (isCleanedUp) return;

        const path = window.location.pathname;
        const atRoot = path === '/' || path === '' || path === '/home';

        if (atRoot) {
          // Évite la fermeture brutale → minimise simplement l'app
          CapacitorApp.minimizeApp().catch(() => {});
        } else if (window.history.length > 1) {
          navigate(-1);
        } else {
          navigate('/', { replace: true });
        }
      }, 0);
    });

    return () => {
      isCleanedUp = true;
      Promise.resolve(handlePromise).then((h) => h?.remove?.()).catch(() => {});
    };
  }, [location.pathname, navigate]);

  return null;
};

export default NativeBackButtonGuard;
