import { useAds } from '@/hooks/useAds';
import { useCookieConsent } from '@/contexts/CookieConsentContext';
import AdBanner from '@/components/ads/AdBanner';
import AdFreeBanner from './AdFreeBanner';

/**
 * Smart slot: shows the actual sponsored ad when one is available,
 * otherwise falls back to the "Publicités respectueuses" info banner.
 * This avoids stacking two competing blocks at the top of the feed.
 */
const AdOrInfoBanner = ({ placement = 'native' as 'compact' | 'native' | 'sponsored_card' }) => {
  const { currentAd, isAdFree } = useAds(placement);
  const { preferences, hasConsented } = useCookieConsent();

  const adsAllowed = hasConsented && preferences.advertising;
  const showAd = adsAllowed && !isAdFree && !!currentAd;

  if (showAd) {
    return <AdBanner placement={placement} className="mb-3" />;
  }
  return <AdFreeBanner />;
};

export default AdOrInfoBanner;
