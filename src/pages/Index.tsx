import React, { Suspense, lazy } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Play, CheckCircle, Star, Users, Zap, BarChart, Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { LazyComponent } from '@/components/LazyComponent';
import LazyLoadManager from '@/components/optimized/LazyLoadManager';
import OptimizedImage from '@/components/optimized/OptimizedImage';
import { LazySection } from '@/components/LazySection';
import { SkipLink } from '@/components/accessibility/SkipLink';
import { Helmet } from 'react-helmet-async';
import { trackEvent } from '@/utils/analytics';


// Lazy load heavy components below the fold with prioritization
const Footer = lazy(() => import('@/components/Footer'));
const PricingCTA = lazy(() => import('@/components/PricingCTA'));
const VideoWalkthrough = lazy(() => import('@/components/VideoWalkthrough'));
const Testimonials = lazy(() => import('@/components/Testimonials'));
const TrustBadges = lazy(() => import('@/components/TrustBadges'));
const CompanyLogos = lazy(() => import('@/components/CompanyLogos'));
const Features = lazy(() => import('@/components/Features'));
const HowItWorks = lazy(() => import('@/components/HowItWorks'));

const Index = () => {
  const navigate = useNavigate();

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
    trackEvent('cta_click', { button: 'get_started', location: 'homepage_hero' });
    navigate('/signup');
  };

  const handleWatchDemoClick = () => {
    console.log("Watch Demo button clicked - navigating to /demo");
    trackEvent('cta_click', { button: 'watch_demo', location: 'homepage_hero' });
    navigate('/demo');
  };

  const features = [
    {
      icon: <Zap className="h-6 w-6 text-primary-600" />,
      title: "AI-Powered Practice",
      description: "Practice with intelligent AI that adapts to your industry and responds like real prospects.",
      onClick: handleVoiceTrainingClick
    },
    {
      icon: <BarChart className="h-6 w-6 text-primary-600" />,
      title: "Instant Feedback", 
      description: "Get detailed analysis of your pitch delivery, pacing, and effectiveness immediately after each session.",
      onClick: handleAnalyticsClick
    },
    {
      icon: <Users className="h-6 w-6 text-primary-600" />,
      title: "Real Scenarios",
      description: "Train with realistic objection handling scenarios based on actual sales situations.",
      onClick: handleAIRoleplayClick
    }
  ];

  return (
    <>
      <Helmet>
        <title>PitchPerfect AI - Master Your Sales Pitch with AI Practice</title>
        <meta name="description" content="Practice and perfect your sales pitch with AI-powered roleplay scenarios. Get instant feedback and improve your objection handling skills." />
        <meta name="keywords" content="sales training, pitch practice, AI roleplay, objection handling, sales skills" />
        <meta property="og:title" content="PitchPerfect AI - Master Your Sales Pitch" />
        <meta property="og:description" content="Practice and perfect your sales pitch with AI-powered roleplay scenarios." />
        
      </Helmet>

      <div className="min-h-screen bg-background">
        <SkipLink href="#main-content">Skip to main content</SkipLink>
        <SkipLink href="#features">Skip to features</SkipLink>
        <SkipLink href="#testimonials">Skip to testimonials</SkipLink>
        <Navbar />
        
        <main>
        <section id="main-content" className="pt-16 sm:pt-24 pb-12 sm:pb-16 relative overflow-hidden" role="main" aria-labelledby="hero-heading" data-onboarding="hero">
          <div className="container mx-auto px-4 text-center relative z-10">
            <Badge className="mb-4 sm:mb-6 bg-primary-50 text-primary-700 border-primary-200 font-medium text-sm">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered Sales Training
            </Badge>

            <h1 id="hero-heading" className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6 leading-tight">
              Master Your Sales Pitch<br />
              <span className="text-primary-600">with AI Practice</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
              Practice objection handling and perfect your pitch with intelligent AI that responds like real prospects. 
              Get instant feedback and watch your closing rate soar.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12">
              <Button 
                size="lg" 
                className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                onClick={handleGetStartedClick}
              >
                <Play className="h-4 w-4 sm:h-5 sm:w-5 mr-2" aria-hidden="true" />
                Start Practicing Now - Free!
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2" aria-hidden="true" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 border-primary-400 text-primary-700 hover:bg-primary-50 font-medium px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg"
                    onClick={handleWatchDemoClick}
                    data-onboarding="demo-button"
              >
                <Play className="h-4 w-4 sm:h-5 sm:w-5 mr-2" aria-hidden="true" />
                Watch 2-Min Demo
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary-600" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary-600" />
                Instant setup
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary-600" />
                Free trial included
              </div>
            </div>
            
            <div className="mt-6 sm:mt-8">
              <TrustBadges variant="compact" className="justify-center" />
            </div>
          </div>
        </section>

        <section className="py-8 sm:py-12 bg-background">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              🚀 Featured on Product Hunt
            </h3>
            <a href="https://www.producthunt.com/products/pitchperfect-ai?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-pitchperfect-ai-2" target="_blank" rel="noopener noreferrer" className="inline-block">
              <img 
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=994740&theme=neutral&t=1752904510680" 
                alt="PitchPerfect AI - Perfect your sales objections with AI & close more deals | Product Hunt" 
                className="w-[250px] h-[54px]" 
                width="250" 
                height="54" 
              />
            </a>
          </div>
        </section>

        <section id="features" className="py-12 sm:py-16 bg-secondary-50" aria-labelledby="features-heading">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8 sm:mb-12">
              <h2 id="features-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
                Why Sales Professionals Choose PitchPerfect AI
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
                Our AI understands sales conversations and provides the realistic practice you need to excel.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="bg-card p-6 sm:p-8 text-center cursor-pointer rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 group"
                  onClick={feature.onClick}
                  role="button"
                  tabIndex={0}
                  aria-label={`Learn more about ${feature.title}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      feature.onClick();
                    }
                  }}
                >
                  <div className="flex justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform duration-300">
                    <div className="p-3 sm:p-4 bg-primary-100 rounded-2xl">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 sm:mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

<LazyLoadManager priority="high" rootMargin="300px">
  <CompanyLogos />
</LazyLoadManager>

<section id="testimonials" data-onboarding="testimonials">
  <LazyLoadManager priority="normal" rootMargin="200px">
    <Testimonials />
  </LazyLoadManager>
</section>

<LazyLoadManager className="py-8 sm:py-12 bg-secondary-100" priority="normal">
  <div className="container mx-auto px-4">
    <TrustBadges variant="horizontal" />
  </div>
</LazyLoadManager>

<LazyLoadManager priority="low" rootMargin="100px">
  <VideoWalkthrough />
</LazyLoadManager>

<LazyLoadManager className="py-12 sm:py-16" data-onboarding="pricing" priority="high" rootMargin="250px">

          <div className="container mx-auto px-4 max-w-3xl">
            <div className="mb-6 sm:mb-8">
              <TrustBadges variant="compact" className="justify-center mb-4 sm:mb-6" />
            </div>
            <PricingCTA />
          </div>
</LazyLoadManager>

<LazyLoadManager priority="low">
  <Footer />
</LazyLoadManager>

        </main>
      </div>
    </>
  );
};

export default Index;
