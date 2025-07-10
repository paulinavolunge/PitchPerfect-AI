import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Play, CheckCircle, Star, Users, Zap, BarChart, Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PricingCTA from '@/components/PricingCTA';
import InteractiveDemo from '@/components/InteractiveDemo';
import VideoWalkthrough from '@/components/VideoWalkthrough';
import Testimonials from '@/components/Testimonials';
import TrustBadges from '@/components/TrustBadges';
import CompanyLogos from '@/components/CompanyLogos';
import { SkipLink } from '@/components/accessibility/SkipLink';
import { Helmet } from 'react-helmet-async';

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
    navigate('/signup');
  };

  const handleWatchDemoClick = () => {
    console.log("Watch Demo button clicked - navigating to /demo");
    navigate('/demo');
  };

  const features = [
    {
      icon: <Zap className="h-8 w-8 text-vibrant-blue-500" />,
      title: "AI-Powered Practice",
      description: "Practice with intelligent AI that adapts to your industry and responds like real prospects.",
      onClick: handleVoiceTrainingClick
    },
    {
      icon: <BarChart className="h-8 w-8 text-primary-600" />,
      title: "Instant Feedback", 
      description: "Get detailed analysis of your pitch delivery, pacing, and effectiveness immediately after each session.",
      onClick: handleAnalyticsClick
    },
    {
      icon: <Users className="h-8 w-8 text-vibrant-blue-500" />,
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

      <div className="min-h-screen bg-gradient-to-br from-vibrant-blue-50 via-vibrant-blue-100 to-vibrant-blue-200">
        <SkipLink href="#main-content">Skip to main content</SkipLink>
        <SkipLink href="#features">Skip to features</SkipLink>
        <SkipLink href="#testimonials">Skip to testimonials</SkipLink>
        <Navbar />
        
        {/* Hero Section with Enhanced Contrast */}
        <main>
        <section id="main-content" className="pt-24 pb-16 relative overflow-hidden" role="main" aria-labelledby="hero-heading">
          {/* Enhanced floating background elements */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-vibrant-blue-500/20 rounded-full blur-3xl animate-vibrant-float"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-600/15 rounded-full blur-3xl animate-vibrant-float" style={{animationDelay: '1s'}}></div>
          
          <div className="container mx-auto px-4 text-center relative z-10">
            <Badge className="mb-6 bg-white/90 text-deep-navy border-vibrant-blue-500/30 backdrop-blur-sm shadow-vibrant font-semibold">
              <Sparkles className="h-4 w-4 mr-1" />
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
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-primary-600 via-primary-500 to-vibrant-blue-500 hover:from-primary-700 hover:via-primary-600 hover:to-vibrant-blue-600 text-white text-xl font-bold px-8 py-4 h-16 shadow-2xl hover:shadow-primary-500/50 transition-all duration-300 transform hover:scale-105 animate-pulse border-0 ring-4 ring-primary-200 hover:ring-primary-300 md:text-lg md:h-14 md:px-6 sm:text-base sm:h-12 sm:px-4"
                onClick={handleGetStartedClick}
              >
                <Play className="h-6 w-6 mr-3 group-hover:scale-110 transition-transform md:h-5 md:w-5 md:mr-2 sm:h-4 sm:w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Start Practicing Now - Free!</span>
                <span className="sm:hidden">Start Free!</span>
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform md:h-4 md:w-4 sm:ml-1" aria-hidden="true" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 border-primary-400 text-primary-700 hover:bg-primary-50 text-lg font-semibold px-6 py-4 h-16 hover:border-primary-500 transition-all duration-300 bg-white/80 backdrop-blur-sm md:text-base md:h-14 md:px-4 sm:text-sm sm:h-12"
                onClick={handleWatchDemoClick}
              >
                <Play className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform md:h-4 md:w-4 sm:mr-1" aria-hidden="true" />
                <span className="hidden sm:inline">Watch 2-Min Demo</span>
                <span className="sm:hidden">Demo</span>
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-deep-navy/70 animate-slide-up-vibrant font-medium" style={{animationDelay: '0.6s'}}>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-vibrant-blue-500" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-vibrant-blue-500" />
                Instant setup
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-vibrant-blue-500" />
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
                  className="vibrant-card p-8 text-center cursor-pointer card-hover group md:p-6 sm:p-4"
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

        {/* Company Logos Section */}
        <CompanyLogos />

        {/* Enhanced Testimonials */}
        <section id="testimonials">
          <Testimonials />
        </section>

        {/* Trust Badges Section */}
        <section className="py-12 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="container mx-auto px-4">
            <TrustBadges variant="horizontal" />
          </div>
        </section>

        {/* Interactive Demo Section */}
        <InteractiveDemo />

        {/* Video Walkthrough Alternative */}
        <VideoWalkthrough />

        {/* CTA Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="mb-8">
              <TrustBadges variant="compact" className="justify-center mb-6" />
            </div>
            <PricingCTA />
          </div>
        </section>

        <Footer />
        </main>
      </div>
    </>
  );
};

export default Index;
