import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import VideoPlayer from '@/components/VideoPlayer';
import { useIsMobile } from '@/hooks/use-mobile';

const Hero = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Ensure the video plays automatically when loaded
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.log('Auto-play was prevented:', error);
      });
    }

    // Listen for the custom event that signals a demo has started
    const handleDemoStart = () => {
      setSessionStarted(true);
    };

    window.addEventListener('start-demo-auto', handleDemoStart);
    
    return () => {
      window.removeEventListener('start-demo-auto', handleDemoStart);
    };
  }, []);

  const handleScrollToDemo = (e: React.MouseEvent) => {
    e.preventDefault();
    const demoSection = document.getElementById('demo-sandbox');
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: 'smooth' });
      // We're removing the auto-start behavior - don't trigger the demo start event
    }
  };

  const handleStartDemo = () => {
    const startDemoEvent = new CustomEvent('start-demo-auto');
    window.dispatchEvent(startDemoEvent);
    setSessionStarted(true);
  };

  return (
    <section className="pt-20 md:pt-24 pb-16 md:pb-20 bg-gradient-to-b from-brand-blue/10 to-white overflow-hidden">
      <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:w-1/2 space-y-5 md:space-y-6 mb-8 lg:mb-0"
        >
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-brand-dark leading-tight">
            Perfect your pitch <span className="text-brand-blue">with AI—live.</span>
          </h1>
          <p className="text-lg md:text-xl text-brand-dark/80 max-w-xl">
            Train, practice, and refine your sales pitches with real-time voice feedback and personalized AI coaching.
          </p>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex flex-wrap gap-4"
          >
            <Link to="/signup">
              <Button 
                className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-medium shadow-lg hover:shadow-xl flex items-center gap-2 group px-5 py-6 h-auto text-base md:text-lg"
              >
                Try Free Now <Rocket className="group-hover:translate-x-1 transition-transform" size={isMobile ? 20 : 18} />
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="bg-white text-brand-dark border-[#E2E8F0] hover:bg-gray-50 flex items-center gap-2 group px-5 py-6 h-auto text-base md:text-lg"
              onClick={handleScrollToDemo}
            >
              See Demo
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={isMobile ? 20 : 18} />
            </Button>
          </motion.div>
          <p className="text-sm text-brand-dark/60">
            Trusted by 10,000+ sales professionals from leading companies
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="lg:w-1/2 relative lg:pt-0 pt-8"
        >
          <VideoPlayer 
            posterSrc="/lovable-uploads/5b9309ea-3b10-4401-9c33-7d84a6e1fa68.png"
            videoSrc="/demo-video.mp4"
            fallbackSrc="/lovable-uploads/5b9309ea-3b10-4401-9c33-7d84a6e1fa68.png"
            className="max-w-lg mx-auto shadow-lg"
            onStartClick={handleStartDemo}
            showStartButton={!sessionStarted}
          />
          
          <div className="absolute inset-0 bg-brand-blue opacity-10 rounded-lg -z-10 transform translate-x-4 translate-y-4"></div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
