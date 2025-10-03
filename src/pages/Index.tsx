import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, Zap, BarChart, MessageSquare, CheckCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Helmet } from 'react-helmet-async';
import { trackEvent } from '@/utils/analytics';



const Index = () => {
  const navigate = useNavigate();

  const handleGetStartedClick = () => {
    trackEvent('cta_click', { button: 'get_started', location: 'homepage' });
    navigate('/signup');
  };

  const handleWatchDemoClick = () => {
    trackEvent('cta_click', { button: 'watch_demo', location: 'homepage' });
    navigate('/demo');
  };

  const coreFeatures = [
    {
      icon: MessageSquare,
      title: "Practice with AI",
      description: "Have realistic sales conversations with AI that responds like real prospects"
    },
    {
      icon: BarChart,
      title: "Get Instant Feedback",
      description: "Receive detailed coaching on your pitch, objection handling, and delivery"
    },
    {
      icon: Zap,
      title: "Improve & Close More",
      description: "Track your progress and watch your closing rate soar"
    }
  ];

  return (
    <>
      <Helmet>
        <title>PitchPerfect AI - Practice Sales Pitches with AI</title>
        <meta name="description" content="AI-powered sales pitch practice. Talk to realistic AI prospects, get instant coaching feedback, and improve your closing rate." />
        <meta property="og:title" content="PitchPerfect AI - Practice Sales Pitches with AI" />
        <meta property="og:description" content="AI-powered sales pitch practice. Get instant coaching feedback and improve your closing rate." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main>
          {/* Hero Section */}
          <section className="pt-24 pb-16 px-4">
            <div className="container mx-auto max-w-4xl text-center">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                Practice Your Sales Pitch<br />
                <span className="text-primary">with AI Coaching</span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Talk to realistic AI prospects, handle objections, and get instant feedback to improve your pitch and close more deals.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-6"
                  onClick={handleGetStartedClick}
                >
                  Start Practicing Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg"
                  className="text-lg px-8 py-6"
                  onClick={handleWatchDemoClick}
                >
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Free trial included
                </div>
              </div>
            </div>
          </section>

          {/* What It Does - Simple 3 Steps */}
          <section className="py-16 bg-secondary/30">
            <div className="container mx-auto px-4 max-w-5xl">
              <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
              
              <div className="grid md:grid-cols-3 gap-8">
                {coreFeatures.map((feature, index) => (
                  <div key={index} className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-4">
                      <feature.icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Simple CTA */}
          <section className="py-16">
            <div className="container mx-auto px-4 text-center max-w-3xl">
              <h2 className="text-3xl font-bold mb-4">Ready to improve your pitch?</h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join thousands of sales professionals who practice with PitchPerfect AI
              </p>
              <Button 
                size="lg" 
                className="text-lg px-8 py-6"
                onClick={handleGetStartedClick}
              >
                Start Free Practice
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default Index;
