
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Play, CheckCircle, Star, Users, Zap, BarChart, Sparkles, TrendingUp, Shield, Clock } from 'lucide-react';
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
      icon: <Zap className="h-8 w-8 text-primary-500" />,
      title: "AI-Powered Practice",
      description: "Practice with intelligent AI that adapts to your industry and responds like real prospects with realistic objections and scenarios.",
      onClick: handleVoiceTrainingClick
    },
    {
      icon: <BarChart className="h-8 w-8 text-accent-600" />,
      title: "Instant Feedback", 
      description: "Get detailed analysis of your pitch delivery, pacing, and effectiveness immediately after each session with actionable insights.",
      onClick: handleAnalyticsClick
    },
    {
      icon: <Users className="h-8 w-8 text-primary-500" />,
      title: "Real Scenarios",
      description: "Train with realistic objection handling scenarios based on actual sales situations from top-performing sales teams.",
      onClick: handleAIRoleplayClick
    }
  ];

  const stats = [
    { icon: Users, value: "15,000+", label: "Sales Professionals Trained" },
    { icon: TrendingUp, value: "89%", label: "Average Improvement Rate" },
    { icon: Star, value: "4.9/5", label: "User Satisfaction Rating" }
  ];

  const trustIndicators = [
    { icon: CheckCircle, text: "No credit card required" },
    { icon: Shield, text: "Enterprise-grade security" },
    { icon: Clock, text: "Setup in under 60 seconds" }
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

      <div className="min-h-screen bg-gradient-hero">
        <Navbar />
        
        {/* Hero Section */}
        <section className="section-padding relative overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-gradient-mesh opacity-40"></div>
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
          
          <div className="container-custom text-center relative z-10">
            <Badge className="mb-8 bg-white/90 text-primary-700 border-primary-200 backdrop-blur-sm shadow-soft font-semibold text-base px-6 py-3">
              <Sparkles className="h-5 w-5 mr-2" />
              AI-Powered Sales Training Platform
            </Badge>
            
            <h1 className="hero-headline mb-8 animate-fade-in-up">
              Master Your Sales Pitch<br />
              <span className="text-primary-500">with AI Practice</span>
            </h1>
            
            <p className="text-xl text-premium mb-12 max-w-3xl mx-auto leading-relaxed font-medium animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              Transform your sales performance with intelligent AI that responds like real prospects. 
              Practice objection handling, perfect your pitch delivery, and watch your closing rate soar with personalized feedback.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
              <Button 
                size="lg" 
                className="premium-button group text-lg font-semibold h-16 px-10"
                onClick={handleGetStartedClick}
              >
                <Play className="h-6 w-6 mr-3 group-hover:scale-110 transition-transform" />
                Start Free Practice
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className="outline-button group text-lg h-16 px-10"
                onClick={handleWatchDemoClick}
              >
                <ArrowRight className="h-6 w-6 mr-3 group-hover:translate-x-1 transition-transform" />
                Watch Demo
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm animate-fade-in-up" style={{animationDelay: '0.6s'}}>
              {trustIndicators.map((indicator, index) => (
                <div key={index} className="trust-indicator">
                  <indicator.icon className="h-5 w-5 text-primary-500" />
                  {indicator.text}
                </div>
              ))}
            </div>

            {/* Stats Section */}
            <div className="mt-24 pt-16 border-t border-neutral-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center animate-scale-in" style={{ animationDelay: `${0.8 + index * 0.2}s` }}>
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-primary rounded-2xl mb-6 shadow-premium">
                      <stat.icon className="h-10 w-10 text-white" />
                    </div>
                    <div className="text-5xl font-bold text-headline mb-3">{stat.value}</div>
                    <div className="text-premium font-medium text-lg">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="section-padding bg-white/70 backdrop-blur-sm">
          <div className="container-custom">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold text-headline mb-6">
                Why Sales Professionals Choose PitchPerfect AI
              </h2>
              <p className="text-premium max-w-3xl mx-auto text-xl font-medium leading-relaxed">
                Our AI understands sales conversations and provides the realistic practice you need to excel in today's competitive market.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="feature-card cursor-pointer animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.2}s` }}
                  onClick={feature.onClick}
                >
                  <div className="flex justify-center mb-8 group-hover:scale-110 transition-transform duration-300">
                    <div className="p-5 bg-gradient-to-br from-primary-100 to-accent-100 rounded-2xl shadow-soft">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-headline mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-premium leading-relaxed font-medium text-lg">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="section-padding bg-gradient-to-r from-white to-primary-50/30">
          <div className="container-custom">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold text-headline mb-6">
                Trusted by Sales Professionals Worldwide
              </h2>
              <p className="text-premium text-xl font-medium">
                Join thousands who've transformed their sales performance
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
              {[
                {
                  name: "Sarah Johnson",
                  role: "Senior Sales Manager", 
                  company: "TechCorp Solutions",
                  content: "PitchPerfect AI helped me improve my closing rate by 47% in just 2 months. The AI feedback is incredibly detailed and actionable. It's like having a sales coach available 24/7.",
                  rating: 5,
                  avatar: "SJ"
                },
                {
                  name: "Mike Chen",
                  role: "Account Executive",
                  company: "Growth Dynamics",
                  content: "Finally, a way to practice objection handling without bothering my colleagues. The AI responses are amazingly realistic, and I can practice anytime. My confidence has skyrocketed.",
                  rating: 5,
                  avatar: "MC"
                }
              ].map((testimonial, index) => (
                <div key={index} className="premium-card p-10 animate-fade-in-up" style={{ animationDelay: `${index * 0.3}s` }}>
                  <div className="flex items-center mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-6 w-6 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-premium mb-8 italic text-lg leading-relaxed font-medium">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-bold text-headline text-lg">{testimonial.name}</p>
                      <p className="text-premium font-medium">{testimonial.role}</p>
                      <p className="text-neutral-500 text-sm">{testimonial.company}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="section-padding">
          <div className="container-custom max-w-4xl">
            <PricingCTA />
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default Index;
