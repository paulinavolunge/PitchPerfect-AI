
import React, { Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Play, CheckCircle, Users, Zap, BarChart, Sparkles } from 'lucide-react';
import { SkipLink } from '@/components/accessibility/SkipLink';
import { MetaTags } from '@/components/shared/MetaTags';
import { EnhancedButton } from '@/components/ui/enhanced-button';
import { useLazyLoading } from '@/hooks/use-lazy-loading';
import { OptimizedImage } from '@/components/ui/optimized-image';
import AccessibilityEnhancements from '@/components/accessibility/AccessibilityEnhancements';

// Critical components loaded immediately
import Navbar from '@/components/Navbar';
import TrustBadges from '@/components/TrustBadges';

// Lazy load non-critical components
const Footer = lazy(() => import('@/components/Footer'));
const PricingCTA = lazy(() => import('@/components/PricingCTA'));
const InteractiveDemo = lazy(() => import('@/components/InteractiveDemo'));
const VideoWalkthrough = lazy(() => import('@/components/VideoWalkthrough'));
const Testimonials = lazy(() => import('@/components/Testimonials'));
const CompanyLogos = lazy(() => import('@/components/CompanyLogos'));

const Index = () => {
  const navigate = useNavigate();
  const shouldLoadSections = useLazyLoading({ threshold: 0.3 });

  const handleVoiceTrainingClick = () => {
    console.log("Voice Training button clicked - navigating to /voice-training");
    navigate('/voice-training');
  };

  const handleAnalyticsClick = () => {
    console.log("Analytics button clicked - navigating to /analytics");
    navigate('/analytics');
  };

  const handleAIRoleplayClick = () => {
    console.log("AI Roleplay button clicked - navigating to /ai-roleplay");
    navigate('/ai-roleplay');
  };

  const handleGetStartedClick = () => {
    console.log("Get Started button clicked - navigating to /signup");
    navigate('/signup');
  };

  const handleWatchDemoClick = () => {
    console.log("Watch Demo button clicked - navigating to /demo");
    navigate('/demo');
  };

  const features = [
    {
      icon: <Zap className="h-8 w-8 text-vibrant-blue-500" aria-hidden="true" />,
      title: "AI-Powered Practice",
      description: "Practice with intelligent AI that adapts to your industry and responds like real prospects.",
      onClick: handleVoiceTrainingClick
    },
    {
      icon: <BarChart className="h-8 w-8 text-primary-600" aria-hidden="true" />,
      title: "Instant Feedback", 
      description: "Get detailed analysis of your pitch delivery, pacing, and effectiveness immediately after each session.",
      onClick: handleAnalyticsClick
    },
    {
      icon: <Users className="h-8 w-8 text-vibrant-blue-500" aria-hidden="true" />,
      title: "Real Scenarios",
      description: "Train with realistic objection handling scenarios based on actual sales situations.",
      onClick: handleAIRoleplayClick
    }
  ];

  return (
    <AccessibilityEnhancements>
      <MetaTags
        title="PitchPerfect AI - Master Your Sales Pitch with AI Practice"
        description="Practice and perfect your sales pitch with AI-powered roleplay scenarios. Get instant feedback and improve your objection handling skills."
        keywords="sales pitch practice, objection handling, AI coaching, sales enablement, roleplay training, sales training, pitch improvement, sales skills development"
        canonical="https://ac4815ee-3287-4227-becd-7ec7f5c2d508.lovableproject.com"
      />

      <div className="min-h-screen bg-gradient-to-br from-vibrant-blue-50 via-vibrant-blue-100 to-vibrant-blue-200"
           role="application" 
           aria-label="PitchPerfect AI - Sales Training Platform">
        <SkipLink href="#main-content">Skip to main content</SkipLink>
        <SkipLink href="#features">Skip to features</SkipLink>
        <SkipLink href="#testimonials">Skip to testimonials</SkipLink>
        <Navbar />
        
        {/* Hero Section with Enhanced Contrast */}
        <main>
        <section id="main-content" className="pt-24 pb-16 relative overflow-hidden" role="main" aria-labelledby="hero-heading">
          {/* Enhanced floating background elements */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-vibrant-blue-500/20 rounded-full blur-3xl animate-vibrant-float" aria-hidden="true"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-600/15 rounded-full blur-3xl animate-vibrant-float" style={{animationDelay: '1s'}} aria-hidden="true"></div>
          
          <div className="container mx-auto px-4 text-center relative z-10">
            <Badge className="mb-6 bg-white/90 text-deep-navy border-vibrant-blue-500/30 backdrop-blur-sm shadow-vibrant font-semibold">
              <Sparkles className="h-4 w-4 mr-1" aria-hidden="true" />
              AI-Powered Sales Training
            </Badge>
            
            <h1 id="hero-heading" className="hero-text mb-6 animate-slide-up-vibrant font-extrabold">
              Master Your Sales Pitch<br />
              <span className="text-vibrant-blue-500">with AI Practice</span>
            </h1>
            
            <p className="text-xl text-deep-navy/80 mb-8 max-w-2xl mx-auto leading-relaxed font-semibold animate-slide-up-vibrant" style={{animationDelay: '0.2s'}}>
              Practice objection handling and perfect your pitch with intelligent AI that responds like real prospects. 
              Get instant feedback and watch your closing rate soar.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-slide-up-vibrant" style={{animationDelay: '0.4s'}}>
              <EnhancedButton 
                size="lg" 
                enhanced={true}
                onClick={handleGetStartedClick}
                icon={Play}
                className="text-xl px-8 py-4 h-16 md:text-lg md:h-14 md:px-6 sm:text-base sm:h-12 sm:px-4 min-h-[44px] min-w-[44px] focus:ring-4 focus:ring-blue-300 focus:outline-none"
                aria-label="Start practicing your sales pitch for free - opens signup page"
                role="button"
                tabIndex={0}
              >
                <span className="hidden sm:inline">Start Practicing Now - Free!</span>
                <span className="sm:hidden">Start Free!</span>
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform md:h-4 md:w-4 sm:ml-1" aria-hidden="true" />
              </EnhancedButton>
              
              <EnhancedButton 
                variant="outline" 
                size="lg"
                onClick={handleWatchDemoClick}
                icon={Play}
                className="border-2 border-[#002B99] text-[#002B99] hover:bg-[#002B99] hover:text-white text-lg font-semibold px-6 py-4 h-16 transition-all duration-300 bg-white backdrop-blur-sm md:text-base md:h-14 md:px-4 sm:text-sm sm:h-12 min-h-[44px] min-w-[44px] focus:ring-4 focus:ring-blue-300 focus:outline-none"
                aria-label="Watch a 2-minute demo of PitchPerfect AI - opens demo page"
                role="button"
                tabIndex={0}
              >
                <span className="hidden sm:inline">Watch 2-Min Demo</span>
                <span className="sm:hidden">Demo</span>
              </EnhancedButton>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-deep-navy/70 animate-slide-up-vibrant font-medium" style={{animationDelay: '0.6s'}}>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-vibrant-blue-500" aria-hidden="true" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-vibrant-blue-500" aria-hidden="true" />
                Instant setup
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-vibrant-blue-500" aria-hidden="true" />
                Free trial included
              </div>
            </div>
            
            {/* Trust indicators */}
            <div className="mt-8 animate-slide-up-vibrant" style={{animationDelay: '0.8s'}}>
              <TrustBadges variant="compact" className="justify-center" />
            </div>
          </div>
        </section>

        {/* Features Section with Enhanced Cards */}
        <section id="features" className="py-16 bg-white/70 backdrop-blur-sm" aria-labelledby="features-heading">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 id="features-heading" className="text-3xl md:text-4xl font-bold text-deep-navy mb-4">
                Why Sales Professionals Choose PitchPerfect AI
              </h2>
              <p className="text-deep-navy/70 max-w-2xl mx-auto text-lg font-medium">
                Our AI understands sales conversations and provides the realistic practice you need to excel.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="vibrant-card p-8 text-center cursor-pointer card-hover group md:p-6 sm:p-4 min-h-[44px] min-w-[44px] focus:ring-4 focus:ring-blue-300 focus:outline-none"
                  onClick={feature.onClick}
                  role="button"
                  tabIndex={0}
                  aria-label={`Learn more about ${feature.title} - ${feature.description}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      feature.onClick();
                    }
                  }}
                >
                  <div className="flex justify-center mb-6 group-hover:scale-110 transition-transform duration-300 md:mb-4">
                    <div className="p-4 bg-gradient-to-br from-vibrant-blue-100 to-vibrant-blue-200 rounded-2xl shadow-vibrant md:p-3">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-deep-navy mb-3 md:text-lg">
                    {feature.title}
                  </h3>
                  <p className="text-deep-navy/70 leading-relaxed font-medium md:text-sm">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Lazy loaded sections */}
        {shouldLoadSections && (
          <Suspense fallback={<div className="py-8 text-center">Loading...</div>}>
            {/* Company Logos Section */}
            <CompanyLogos />

            {/* Enhanced Testimonials */}
            <section id="testimonials">
              <Testimonials />
            </section>

            {/* Trust Badges Section */}
            <section className="py-12 bg-gradient-to-r from-gray-50 to-gray-100" aria-label="Security and trust indicators">
              <div className="container mx-auto px-4">
                <TrustBadges variant="horizontal" />
              </div>
            </section>

            {/* Interactive Demo Section */}
            <InteractiveDemo />

            {/* Video Walkthrough Alternative */}
            <VideoWalkthrough />

            {/* CTA Section */}
            <section className="py-16" aria-label="Get started call-to-action">
              <div className="container mx-auto px-4 max-w-3xl">
                <div className="mb-8">
                  <TrustBadges variant="compact" className="justify-center mb-6" />
                </div>
                <PricingCTA />
              </div>
            </section>

            <Footer />
          </Suspense>
        )}
        </main>
      </div>
    </AccessibilityEnhancements>
  );
};

export default Index;
