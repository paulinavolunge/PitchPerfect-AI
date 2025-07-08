
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useGuestMode } from '@/context/GuestModeContext';
import { useNavigate } from 'react-router-dom';
import { Play, Users, TrendingUp, Star, ArrowRight, Zap, Target, BarChart3, CheckCircle } from 'lucide-react';
import { trackEvent } from '@/utils/analytics';
import ParallaxSection from '@/components/animations/ParallaxSection';
import TiltCard from '@/components/animations/TiltCard';
import FadeTransition from '@/components/animations/FadeTransition';
import { AccessibleImage } from '@/components/ui/accessible-image';
import { EnhancedButton } from '@/components/ui/enhanced-button';

const Hero: React.FC = () => {
  const { user } = useAuth();
  const { isGuestMode, startGuestMode } = useGuestMode();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleGetStarted = () => {
    if (user && !isGuestMode) {
      trackEvent('cta_get_started_authenticated');
      navigate('/dashboard');
    } else {
      trackEvent('cta_get_started_unauthenticated');
      navigate('/signup');
    }
  };

  const handleTryDemo = () => {
    trackEvent('cta_try_demo');
    if (!user) {
      startGuestMode();
    }
    navigate('/demo');
  };

  const statistics = [
    { icon: Users, value: "10,000+", label: "Sales Professionals Trained" },
    { icon: TrendingUp, value: "85%", label: "Average Improvement Rate" },
    { icon: Star, value: "4.9/5", label: "User Satisfaction Rating" }
  ];

  const features = [
    {
      icon: Zap,
      title: "AI-Powered Feedback",
      description: "Get instant, personalized feedback on your sales pitches using advanced AI analysis"
    },
    {
      icon: Target,
      title: "Role-Play Scenarios",
      description: "Practice with realistic customer scenarios tailored to your industry and experience level"
    },
    {
      icon: BarChart3,
      title: "Performance Analytics",
      description: "Track your progress with detailed analytics and personalized improvement recommendations"
    }
  ];

  const trustIndicators = [
    { icon: CheckCircle, text: "No credit card required" },
    { icon: CheckCircle, text: "Instant setup" },
    { icon: CheckCircle, text: "Free trial included" }
  ];

  return (
    <div className="hero-section relative overflow-hidden">
      <ParallaxSection className="relative z-10">
        <div className="container mx-auto px-4 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left column - Enhanced Content */}
            <FadeTransition show={isVisible}>
              <div className="space-y-8 animate-professional-fade-in">
                <div className="space-y-6">
                  <div className="inline-flex items-center space-x-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full border border-electric-blue-200 shadow-sm">
                    <div className="w-2 h-2 bg-electric-blue-500 rounded-full animate-electric-pulse" aria-hidden="true" />
                    <span className="text-sm font-semibold text-navy-700">AI-Powered Sales Training</span>
                  </div>
                  
                  {/* Enhanced Logo with 2x resolution */}
                  <div className="flex items-center mb-6">
                    <AccessibleImage
                      src="/assets/logo-pitchperfectai.png"
                      srcSet="/assets/logo-pitchperfectai@2x.png 2x"
                      alt="PitchPerfect AI Logo - AI-powered sales training platform"
                      className="h-16 w-auto mr-4"
                      errorFallback={
                        <div className="h-16 w-16 bg-electric-blue-500 rounded-lg flex items-center justify-center mr-4">
                          <span className="text-white font-bold text-xl">PA</span>
                        </div>
                      }
                    />
                    <h1 className="hero-headline">
                      <span className="primary-text">Perfect Your </span>
                      <span className="navy-highlight">Sales</span>
                      <br />
                      <span className="electric-highlight">Pitch </span>
                      <span className="primary-text">with AI</span>
                    </h1>
                  </div>
                  
                  <p className="text-xl text-navy-600 leading-relaxed max-w-xl font-medium">
                    Train your sales team with AI-powered role-play scenarios. Get instant feedback, 
                    improve conversion rates, and close more deals with personalized coaching.
                  </p>
                </div>

                {/* Enhanced CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <EnhancedButton 
                    onClick={handleGetStarted}
                    size="lg"
                    enhanced={true}
                    icon={ArrowRight}
                    className="text-lg animate-conversion-glow"
                    aria-label="Start practicing your sales pitch for free"
                  >
                    Get Started Free
                  </EnhancedButton>
                  
                  <EnhancedButton 
                    variant="outline"
                    onClick={handleTryDemo}
                    size="lg"
                    icon={Play}
                    className="text-lg"
                    aria-label="Watch a demo of PitchPerfect AI"
                  >
                    Watch Demo
                  </EnhancedButton>
                </div>

                {/* Professional Trust Indicators */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                  {trustIndicators.map((indicator, index) => (
                    <div key={index} className="trust-indicator flex items-center gap-2">
                      <indicator.icon className="h-4 w-4 text-electric-blue-600" aria-hidden="true" />
                      <span>{indicator.text}</span>
                    </div>
                  ))}
                </div>

                {/* Enhanced Social Proof */}
                <div className="flex items-center space-x-6 pt-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex -space-x-2" aria-label="Customer avatars">
                      {[1, 2, 3, 4].map((i) => (
                        <div 
                          key={i} 
                          className="w-8 h-8 rounded-full bg-gradient-to-br from-electric-blue-500 to-navy-600 border-2 border-white shadow-sm" 
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                    <span className="text-navy-600 font-medium">Trusted by 10,000+ professionals</span>
                  </div>
                  <div className="hidden sm:block w-px h-5 bg-navy-200" aria-hidden="true" />
                  <div className="hidden sm:flex items-center space-x-2">
                    <Star className="h-5 w-5 text-yellow-500 fill-current" aria-hidden="true" />
                    <span className="text-navy-600 font-medium">4.9/5 rating</span>
                  </div>
                </div>
              </div>
            </FadeTransition>

            {/* Right column - Enhanced Visual */}
            <FadeTransition show={isVisible}>
              <div className="relative animate-slide-up">
                <TiltCard className="relative z-10">
                  <div className="professional-card p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-navy-900">Live Practice Session</h3>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" aria-hidden="true" />
                        <span className="text-sm text-navy-600 font-medium">Recording</span>
                      </div>
                    </div>
                    
                    {/* Enhanced mock conversation */}
                    <div className="space-y-4">
                      <div className="bg-electric-blue-50 border border-electric-blue-100 rounded-lg p-4">
                        <p className="text-sm text-navy-700 font-medium">"Tell me about your product's main benefits..."</p>
                        <span className="text-xs text-electric-blue-600 mt-2 block font-semibold">AI Customer</span>
                      </div>
                      <div className="bg-navy-50 border border-navy-100 rounded-lg p-4 ml-8">
                        <p className="text-sm text-navy-700 font-medium">"Our solution increases efficiency by 40% while reducing costs..."</p>
                        <span className="text-xs text-navy-500 mt-2 block font-semibold">You</span>
                      </div>
                    </div>

                    {/* Enhanced mock feedback */}
                    <div className="feature-highlight border-electric-blue-200">
                      <h4 className="text-sm font-bold text-navy-900 mb-3 flex items-center">
                        <Zap className="h-4 w-4 text-electric-blue-600 mr-2" aria-hidden="true" />
                        AI Feedback
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-electric-blue-500 rounded-full mt-2" aria-hidden="true" />
                          <span className="text-sm text-navy-600 font-medium">Excellent use of specific metrics</span>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2" aria-hidden="true" />
                          <span className="text-sm text-navy-600 font-medium">Consider addressing objections earlier</span>
                        </div>
                        <div className="mt-4 bg-electric-blue-50 rounded-lg p-3">
                          <div className="text-xs text-electric-blue-700 font-semibold mb-1">Performance Score</div>
                          <div className="text-2xl font-bold text-electric-blue-600">8.5/10</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TiltCard>

                {/* Enhanced floating elements */}
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-electric-blue-400 to-electric-blue-600 rounded-full opacity-20 animate-float" aria-hidden="true" />
                <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-gradient-to-br from-navy-400 to-navy-600 rounded-full opacity-15 animate-float delay-1000" aria-hidden="true" />
              </div>
            </FadeTransition>
          </div>

          {/* Enhanced Statistics */}
          <FadeTransition show={isVisible}>
            <div className="mt-24 pt-16 border-t border-navy-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {statistics.map((stat, index) => (
                  <div key={index} className="text-center animate-scale-in-professional" style={{ animationDelay: `${index * 0.2}s` }}>
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-electric-blue-500 to-navy-600 rounded-xl mb-6 shadow-lg">
                      <stat.icon className="h-8 w-8 text-white" aria-hidden="true" />
                    </div>
                    <div className="text-4xl font-bold text-navy-900 mb-3">{stat.value}</div>
                    <div className="text-navy-600 font-medium">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </FadeTransition>

          {/* Enhanced Features Preview */}
          <FadeTransition show={isVisible}>
            <div className="mt-24">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-navy-900 mb-6">Why Choose PitchPerfect AI?</h2>
                <p className="text-xl text-navy-600 max-w-3xl mx-auto font-medium">
                  Our AI-powered platform provides everything you need to master your sales skills and close more deals
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                {features.map((feature, index) => (
                  <TiltCard key={index}>
                    <div className="professional-card p-8 group hover:border-electric-blue-200 transition-all duration-300">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-electric-blue-500 to-navy-600 rounded-xl mb-6 group-hover:scale-110 transition-transform shadow-lg">
                        <feature.icon className="h-8 w-8 text-white" aria-hidden="true" />
                      </div>
                      <h3 className="text-xl font-bold text-navy-900 mb-4">{feature.title}</h3>
                      <p className="text-navy-600 leading-relaxed font-medium">{feature.description}</p>
                    </div>
                  </TiltCard>
                ))}
              </div>
            </div>
          </FadeTransition>
        </div>
      </ParallaxSection>
    </div>
  );
};

export default Hero;
