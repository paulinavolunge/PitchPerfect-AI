import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Rocket, UserPlus, Diamond } from 'lucide-react'; // Changed Clock to Diamond
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import VideoPlayer from '@/components/VideoPlayer';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/context/AuthContext';
import { useGuestMode } from '@/context/GuestModeContext';
import { useToast } from '@/hooks/use-toast';
import WaveAnimation from '@/components/animations/WaveAnimation';
import ParallaxSection from '@/components/animations/ParallaxSection';

const Hero = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  // Destructure new auth values
  const { user, isPremium, creditsRemaining, trialUsed, startFreeTrial } = useAuth();
  const { startGuestMode } = useGuestMode();
  const { toast } = useToast();

  // Determine if we're in development mode (already existed)
  const isDevelopment = import.meta.env.DEV === true;

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

  // Add debug logging (already existed)
  useEffect(() => {
    console.log('Hero component auth state:', { 
      user_exists: Boolean(user), 
      isPremium, 
      creditsRemaining, 
      trialUsed 
    });
  }, [user, isPremium, creditsRemaining, trialUsed]);

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

  const handlePrimaryCtaClick = async () => {
    if (!user) {
      // If user is not logged in, redirect to signup to get 1 free pitch analysis
      navigate('/signup');
    } else if (!isPremium) {
      // User is logged in but not premium
      if (!trialUsed) {
        // If they haven't used their free analysis, attempt to grant it (handled by AuthContext)
        await startFreeTrial();
        navigate('/demo'); // Direct to demo to use the free analysis
      } else if (creditsRemaining > 0) {
        // If they have credits, go to demo/practice
        navigate('/demo');
      } else {
        // No credits, trial used, not premium - prompt to upgrade
        navigate('/pricing');
      }
    } else {
      // User is premium, go to dashboard
      navigate('/dashboard');
    }
  };

  const handleTryAsGuest = () => {
    startGuestMode();
    toast({
      title: "Guest Mode Activated",
      description: "Try PitchPerfect AI without creating an account. Your data won't be saved.",
    });
    navigate('/roleplay');
  };

  // Render appropriate button based on user status with extra safety checks
  const renderActionButton = () => {
    if (!user || user === null) {
      // Case 1: User is not logged in - offer free analysis via signup
      return (
        <Button 
          className="bg-[#008D95] hover:bg-[#007A80] text-white font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2 group px-5 py-6 h-auto text-base md:text-lg hover:scale-105"
          onClick={handlePrimaryCtaClick}
          aria-label="Begin a Practice Call"
        >
          Begin a Practice Call <Rocket className="group-hover:translate-x-1 transition-transform" size={isMobile ? 20 : 18} />
        </Button>
      );
    } else if (isPremium) {
      // Case 2: User has premium subscription
      return (
        <Button 
          className="bg-[#008D95] hover:bg-[#007A80] text-white font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2 group px-5 py-6 h-auto text-base md:text-lg hover:scale-105"
          onClick={handlePrimaryCtaClick}
          aria-label="Go to Dashboard"
        >
          Go to Dashboard <ArrowRight className="group-hover:translate-x-1 transition-transform" size={isMobile ? 20 : 18} />
        </Button>
      );
    } else if (!trialUsed) {
      // Case 3: User is logged in, but hasn't used their free pitch analysis yet
      return (
        <Button 
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2 group px-5 py-6 h-auto text-base md:text-lg hover:scale-105"
          onClick={handlePrimaryCtaClick}
          aria-label="Get 1 Free Pitch Analysis"
        >
          <Diamond className="mr-1" size={isMobile ? 20 : 18} />
          Get 1 Free Pitch Analysis
        </Button>
      );
    } else if (creditsRemaining > 0) {
      // Case 4: User is logged in, used trial, has credits
      return (
        <Button 
          className="bg-[#008D95] hover:bg-[#007A80] text-white font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2 group px-5 py-6 h-auto text-base md:text-lg hover:scale-105"
          onClick={handlePrimaryCtaClick}
          aria-label="Start New Practice"
        >
          Start New Practice ({creditsRemaining} credits) <ArrowRight className="group-hover:translate-x-1 transition-transform" size={isMobile ? 20 : 18} />
        </Button>
      );
    } else {
      // Case 5: User is logged in, used trial, no credits, not premium
      return (
        <Button 
          className="bg-[#008D95] hover:bg-[#007A80] text-white font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2 group px-5 py-6 h-auto text-base md:text-lg hover:scale-105"
          onClick={handlePrimaryCtaClick}
          aria-label="Upgrade to Premium"
        >
          Upgrade to Premium <ArrowRight className="group-hover:translate-x-1 transition-transform" size={isMobile ? 20 : 18} />
        </Button>
      );
    }
  };

  return (
    <ParallaxSection className="pt-20 md:pt-24 pb-16 md:pb-20 overflow-hidden relative">
      <div className="absolute inset-0 -z-10 opacity-50">
        <WaveAnimation color="#008D95" amplitude={15} opacity={0.2} />
      </div>

      <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:w-1/2 space-y-5 md:space-y-6 mb-8 lg:mb-0"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-brand-dark leading-tight">
            Beat Every Objection <span className="text-[#008D95]">with AI-Powered Practice</span>
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
            {renderActionButton()}

            <Button 
              variant="outline" 
              className="bg-white text-brand-dark border-[#E2E8F0] hover:bg-gray-50 transition-colors flex items-center gap-2 group px-5 py-6 h-auto text-base md:text-lg hover:scale-105"
              onClick={handleScrollToDemo}
              aria-label="Start Demo"
            >
              Start Demo
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={isMobile ? 20 : 18} />
            </Button>

            {/* Only show the Try as Guest button if user is not authenticated and not in guest mode already */}
            {!user && !isGuestMode && (
              <Button 
                variant="ghost" 
                className="bg-white text-brand-dark hover:bg-gray-50 transition-colors flex items-center gap-2 group px-5 py-6 h-auto text-base md:text-lg hover:scale-105"
                onClick={handleTryAsGuest}
                aria-label="Try as Guest"
              >
                <UserPlus className="group-hover:scale-110 transition-transform" size={isMobile ? 20 : 18} />
                Try as Guest
              </Button>
            )}
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
            className="max-w-lg mx-auto shadow-lg rounded-lg overflow-hidden relative z-10"
            onStartClick={handleStartDemo}
            showStartButton={!sessionStarted}
          />

          {/* Enhanced background effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-blue/20 to-[#008D95]/30 rounded-lg -z-10 transform translate-x-4 translate-y-4 blur-lg"></div>
        </motion.div>
      </div>
    </ParallaxSection>
  );
};

export default Hero;
