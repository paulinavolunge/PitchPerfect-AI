
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useIsMobile } from '@/hooks/use-mobile';

// import HeroSection from '@/components/HeroSection';
// import Testimonials from '@/components/Testimonials';
// import Footer from '@/components/Footer';
// import PricingCTA from '@/components/PricingCTA';
// import InteractiveDemo from '@/components/InteractiveDemo';
// import CompanyLogos from '@/components/CompanyLogos';
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
        <div className="min-h-screen flex items-center justify-center">
          <h1 className="text-4xl font-bold text-center">Testing Page Load</h1>
        </div>
        {/* <HeroSection isMobile={isMobile} /> */}
        {/* <CompanyLogos /> */}
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
