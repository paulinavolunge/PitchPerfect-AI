
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useIsMobile } from '@/hooks/use-mobile';

import Hero from '@/components/Hero';
import CompanyLogos from '@/components/CompanyLogos';
// import Testimonials from '@/components/Testimonials';
// import Footer from '@/components/Footer';
// import PricingCTA from '@/components/PricingCTA';
// import InteractiveDemo from '@/components/InteractiveDemo';
// import VideoWalkthrough from '@/components/VideoWalkthrough';

const Index = () => {
  const isMobile = useIsMobile();

  return (
    <>
      <Helmet>
        <title>PitchPerfect AI – Master Sales Objection Handling</title>
        <meta name="description" content="AI-powered roleplay and feedback to level up your cold calls and close deals faster. Try it free!" />
      </Helmet>

      <main>
        <Hero />
        <CompanyLogos />
        {/* <InteractiveDemo /> */}
        {/* <VideoWalkthrough isMobile={isMobile} /> */}
        {/* <Testimonials isMobile={isMobile} /> */}
        {/* <PricingCTA /> */}
      </main>

      {/* <Footer /> */}
    </>
  );
};

export default Index;
