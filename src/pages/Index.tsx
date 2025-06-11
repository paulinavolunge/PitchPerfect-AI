
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Play, CheckCircle, Star, Users, Zap, BarChart } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PricingCTA from '@/components/PricingCTA';
import { Helmet } from 'react-helmet-async';

const Index = () => {
  const navigate = useNavigate();

  const handleVoiceTrainingClick = () => {
    console.log("Voice Training clicked");
    navigate('/voice-training');
  };

  const handleAnalyticsClick = () => {
    console.log("Analytics clicked");
    navigate('/analytics');
  };

  const handleAIRoleplayClick = () => {
    console.log("AI Roleplay clicked");
    navigate('/ai-roleplay');
  };

  const handleGetStartedClick = () => {
    console.log("Get Started clicked");
    navigate('/signup');
  };

  const features = [
    {
      icon: <Zap className="h-8 w-8 text-brand-green" />,
      title: "AI-Powered Practice",
      description: "Practice with intelligent AI that adapts to your industry and responds like real prospects.",
      onClick: handleVoiceTrainingClick
    },
    {
      icon: <BarChart className="h-8 w-8 text-brand-blue" />,
      title: "Instant Feedback",
      description: "Get detailed analysis of your pitch delivery, pacing, and effectiveness immediately after each session.",
      onClick: handleAnalyticsClick
    },
    {
      icon: <Users className="h-8 w-8 text-brand-green" />,
      title: "Real Scenarios",
      description: "Train with realistic objection handling scenarios based on actual sales situations.",
      onClick: handleAIRoleplayClick
    }
  ];

  const testimonials = [
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

      <div className="min-h-screen">
        <Navbar />
        
        {/* Hero Section */}
        <section className="pt-24 pb-16 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4 text-center">
            <Badge className="mb-4 bg-brand-green/10 text-brand-green border-brand-green/20">
              🚀 AI-Powered Sales Training
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold text-brand-dark mb-6">
              Master Your Sales Pitch<br />
              <span className="text-brand-green">with AI Practice</span>
            </h1>
            
            <p className="text-xl text-brand-dark/70 mb-8 max-w-2xl mx-auto">
              Practice objection handling and perfect your pitch with intelligent AI that responds like real prospects. 
              Get instant feedback and watch your closing rate soar.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                size="lg" 
                className="bg-brand-green hover:bg-brand-green/90"
                onClick={handleGetStartedClick}
              >
                <Play className="h-4 w-4 mr-2" />
                Start Free Practice
              </Button>
              
              <Button asChild variant="outline" size="lg">
                <Link to="/demo">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Watch Demo
                </Link>
              </Button>
            </div>

            <div className="flex items-center justify-center gap-6 text-sm text-brand-dark/60">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                No credit card required
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Instant setup
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Free trial included
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-brand-dark mb-4">
                Why Sales Professionals Choose PitchPerfect AI
              </h2>
              <p className="text-brand-dark/70 max-w-2xl mx-auto">
                Our AI understands sales conversations and provides the realistic practice you need to excel.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="text-center p-6 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
                  onClick={feature.onClick}
                >
                  <div className="flex justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-brand-dark mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-brand-dark/70">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-brand-dark mb-4">
                Trusted by Sales Professionals
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-brand-dark/80 mb-4 italic">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <p className="font-semibold text-brand-dark">{testimonial.name}</p>
                    <p className="text-sm text-brand-dark/60">{testimonial.role}</p>
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
