import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useGuestMode } from '@/context/GuestModeContext';
import { useNavigate } from 'react-router-dom';
import { Play, Users, TrendingUp, Star, ArrowRight, Zap, Target, BarChart3 } from 'lucide-react';
import { trackEvent } from '@/utils/analytics';
import ParallaxSection from '@/components/animations/ParallaxSection';
import TiltCard from '@/components/animations/TiltCard';
import FadeTransition from '@/components/animations/FadeTransition';

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

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50/30 to-green-50/30">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-12">
        <div className="w-72 h-72 bg-gradient-to-br from-brand-blue/20 to-brand-green/20 rounded-full blur-3xl" />
      </div>
      <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12">
        <div className="w-72 h-72 bg-gradient-to-tr from-brand-green/20 to-brand-blue/20 rounded-full blur-3xl" />
      </div>

      <ParallaxSection className="relative z-10">
        <div className="container mx-auto px-4 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left column - Content */}
            <FadeTransition>
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200/50 shadow-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-gray-700">AI-Powered Sales Training</span>
                  </div>
                  
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                    Perfect Your{' '}
                    <span className="bg-gradient-to-r from-brand-blue to-brand-green bg-clip-text text-transparent">
                      Sales Pitch
                    </span>{' '}
                    with AI
                  </h1>
                  
                  <p className="text-xl text-gray-600 leading-relaxed max-w-xl">
                    Train your sales team with AI-powered role-play scenarios. Get instant feedback, 
                    improve conversion rates, and close more deals with personalized coaching.
                  </p>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={handleGetStarted}
                    size="lg"
                    className="bg-gradient-to-r from-brand-blue to-brand-green hover:from-brand-blue/90 hover:to-brand-green/90 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  
                  <Button 
                    onClick={handleTryDemo}
                    variant="outline" 
                    size="lg"
                    className="border-2 border-gray-300 hover:border-brand-blue text-gray-700 hover:text-brand-blue font-semibold px-8 py-4 rounded-xl transition-all duration-300 group bg-white/50 backdrop-blur-sm"
                  >
                    <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                    Try Demo
                  </Button>
                </div>

                {/* Trust indicators */}
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <div className="flex -space-x-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-blue to-brand-green border-2 border-white" />
                      ))}
                    </div>
                    <span className="ml-2">Trusted by 10,000+ professionals</span>
                  </div>
                  <div className="hidden sm:block w-px h-4 bg-gray-300" />
                  <div className="hidden sm:flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span>4.9/5 rating</span>
                  </div>
                </div>
              </div>
            </FadeTransition>

            {/* Right column - Visual */}
            <FadeTransition>
              <div className="relative">
                <TiltCard className="relative z-10">
                  <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-200/50 p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Live Practice Session</h3>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-sm text-gray-600">Recording</span>
                      </div>
                    </div>
                    
                    {/* Mock conversation */}
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-sm text-gray-700">"Tell me about your product's main benefits..."</p>
                        <span className="text-xs text-gray-500 mt-1 block">AI Customer</span>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 ml-8">
                        <p className="text-sm text-gray-700">"Our solution increases efficiency by 40% while reducing costs..."</p>
                        <span className="text-xs text-gray-500 mt-1 block">You</span>
                      </div>
                    </div>

                    {/* Mock feedback */}
                    <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 border border-blue-200/50">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">AI Feedback</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                          <span className="text-xs text-gray-600">Great use of specific metrics</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                          <span className="text-xs text-gray-600">Consider addressing objections earlier</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TiltCard>

                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-brand-blue to-brand-green rounded-full opacity-20 animate-pulse" />
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-brand-green to-brand-blue rounded-full opacity-20 animate-pulse delay-1000" />
              </div>
            </FadeTransition>
          </div>

          {/* Statistics */}
          <FadeTransition>
            <div className="mt-20 pt-12 border-t border-gray-200/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {statistics.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-brand-blue to-brand-green rounded-lg mb-4">
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                    <div className="text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </FadeTransition>

          {/* Features Preview */}
          <FadeTransition>
            <div className="mt-20">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose PitchPerfect AI?</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Our AI-powered platform provides everything you need to master your sales skills
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8">
                {features.map((feature, index) => (
                  <TiltCard key={index}>
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 hover:border-brand-blue/30 transition-all duration-300 group">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-brand-blue to-brand-green rounded-lg mb-4 group-hover:scale-110 transition-transform">
                        <feature.icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
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
