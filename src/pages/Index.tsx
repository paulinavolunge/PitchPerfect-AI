
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Play, CheckCircle, Star, Users, Zap, BarChart, Sparkles } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PricingCTA from '@/components/PricingCTA';
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
      icon: <Zap className="h-8 w-8 text-primary" />,
      title: "AI-Powered Practice",
      description: "Practice with intelligent AI that adapts to your industry and responds like real prospects.",
      onClick: handleVoiceTrainingClick
    },
    {
      icon: <BarChart className="h-8 w-8 text-sky-blue" />,
      title: "Instant Feedback", 
      description: "Get detailed analysis of your pitch delivery, pacing, and effectiveness immediately after each session.",
      onClick: handleAnalyticsClick
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
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

      <div className="min-h-screen bg-gradient-to-br from-soft-blue-50 via-soft-blue-100 to-sky-blue">
        <Navbar />
        
        {/* Hero Section */}
        <section className="pt-24 pb-16 relative overflow-hidden">
          {/* Floating background elements */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-sky-blue/20 rounded-full blur-3xl animate-gentle-float"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-gentle-float" style={{animationDelay: '1s'}}></div>
          
          <div className="container mx-auto px-4 text-center relative z-10">
            <Badge className="mb-6 bg-white/80 text-navy border-sky-blue/30 backdrop-blur-sm shadow-soft">
              <Sparkles className="h-4 w-4 mr-1" />
              AI-Powered Sales Training
            </Badge>
            
            <h1 className="hero-text mb-6 animate-slide-up-soft">
              Master Your Sales Pitch<br />
              <span className="text-primary">with AI Practice</span>
            </h1>
            
            <p className="text-xl text-navy/70 mb-8 max-w-2xl mx-auto leading-relaxed font-medium animate-slide-up-soft" style={{animationDelay: '0.2s'}}>
              Practice objection handling and perfect your pitch with intelligent AI that responds like real prospects. 
              Get instant feedback and watch your closing rate soar.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-slide-up-soft" style={{animationDelay: '0.4s'}}>
              <Button 
                size="lg" 
                className="soft-button group"
                onClick={handleGetStartedClick}
              >
                <Play className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                Start Free Practice
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className="outline-button group"
                onClick={handleWatchDemoClick}
              >
                <ArrowRight className="h-5 w-5 mr-2 group-hover:translate-x-1 transition-transform" />
                Watch Demo
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-navy/60 animate-slide-up-soft" style={{animationDelay: '0.6s'}}>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                Instant setup
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                Free trial included
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white/50 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">
                Why Sales Professionals Choose PitchPerfect AI
              </h2>
              <p className="text-navy/70 max-w-2xl mx-auto text-lg">
                Our AI understands sales conversations and provides the realistic practice you need to excel.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="modern-card p-8 text-center cursor-pointer card-hover group"
                  onClick={feature.onClick}
                >
                  <div className="flex justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <div className="p-4 bg-gradient-to-br from-soft-blue-100 to-sky-blue rounded-2xl">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-navy mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-navy/70 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 bg-gradient-to-r from-white to-soft-blue-50/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">
                Trusted by Sales Professionals
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {[
                {
                  name: "Sarah Johnson",
                  role: "Sales Manager", 
                  content: "PitchPerfect AI helped me improve my closing rate by 35% in just 2 months. The feedback is incredibly detailed.",
                  rating: 5
                },
                {
                  name: "Mike Chen",
                  role: "Account Executive",
                  content: "Finally, a way to practice objection handling without bothering my colleagues. The AI responses are amazingly realistic.",
                  rating: 5
                }
              ].map((testimonial, index) => (
                <div key={index} className="modern-card p-8 card-hover">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-navy/80 mb-6 italic text-lg leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <p className="font-semibold text-navy text-lg">{testimonial.name}</p>
                    <p className="text-navy/60">{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-3xl">
            <PricingCTA />
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default Index;
