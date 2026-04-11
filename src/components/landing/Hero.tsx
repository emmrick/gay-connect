import SEOHead, { websiteJsonLd, organizationJsonLd } from '@/components/seo/SEOHead';
import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import LandingNavBar from './LandingNavBar';
import HeroSection from './HeroSection';
import ShowcaseSection from './ShowcaseSection';
import FeaturesSection from './FeaturesSection';
import HowItWorksSection from './HowItWorksSection';
import StatsSection from './StatsSection';
import SEOContentSection from './SEOContentSection';
import LandingFooter from './LandingFooter';
import LandingSupportChat from './LandingSupportChat';

interface HeroProps {
  onGetStarted: () => void;
  onLearnMore?: () => void;
}

const Hero = ({ onGetStarted }: HeroProps) => {
  const { theme, setTheme } = useTheme();
  const previousThemeRef = useRef(theme);

  // Force light theme on landing page
  useEffect(() => {
    previousThemeRef.current = theme;
    if (theme !== 'light') {
      setTheme('light');
    }
    return () => {
      if (previousThemeRef.current && previousThemeRef.current !== 'light') {
        setTheme(previousThemeRef.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const combinedJsonLd = { ...websiteJsonLd, ...organizationJsonLd };

  return (
    <section className="relative flex flex-col overflow-hidden">
      <SEOHead
        title="Gay Social - Site de Rencontre Gay, Sexe Gay & Tchat Gay France"
        description="Gay Social : le site gay n°1 pour les rencontres et le sexe entre hommes en France. Tchat gay gratuit, plan cul gay par département, échanges de photos et vidéos. Communauté vérifiée. +18 ans."
        canonical="https://gaysocial.fr/"
        keywords="site gay, rencontre gay, sexe gay, plan cul gay, tchat gay, chat gay, plan gay, drague gay, annonce gay, homme cherche homme, hookup gay, sexfriend gay, gay paris, gay lyon, gay marseille, gay toulouse, gay bordeaux, gay nantes, gay lille, rencontre sexe gay, plan cul homme, site plan cul gay, appli gay, application rencontre gay, mec gay, gay actif, gay passif, gay versatile, bear gay, twink, daddy gay, ours gay"
        jsonLd={combinedJsonLd}
      />

      <LandingNavBar onGetStarted={onGetStarted} />
      <HeroSection onGetStarted={onGetStarted} />
      <ShowcaseSection />
      <FeaturesSection />
      <HowItWorksSection onGetStarted={onGetStarted} />
      <StatsSection />
      <SEOContentSection />
      <LandingFooter onGetStarted={onGetStarted} />
      <LandingSupportChat />
    </section>
  );
};

export default Hero;
