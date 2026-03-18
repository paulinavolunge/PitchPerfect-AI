import React, { Suspense, lazy } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Play, CheckCircle, Zap, BarChart, Sparkles, Mic, MessageSquare, Target, Users, Shield } from 'lucide-react';
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
const TrustBadges = lazy(() => import('@/components/TrustBadges'));
const Features = lazy(() => import('@/components/Features'));
const HowItWorks = lazy(() => import('@/components/HowItWorks'));

const Index = () => {
  const navigate = useNavigate();

  const handleVoiceTrainingClick = () => {
    navigate('/voice-training');
  };

  const handleAnalyticsClick = () => {
    navigate('/analytics');
  };

  const handleAIRoleplayClick = () => {
    navigate('/ai-roleplay');
  };

  const handleGetStartedClick = () => {
    trackEvent('cta_click', { button: 'practice_free', location: 'homepage_hero' });
    navigate('/demo');
  };

  const handleWatchDemoClick = () => {
    trackEvent('cta_click', { button: 'see_how_it_works', location: 'homepage_hero' });
    navigate('/demo');
  };

  const features = [
    {
      icon: <Zap className="h-6 w-6 text-primary-600" />,
      title: "Tough AI Buyers That Push Back",
      description: "No softball practice. Our AI responds like real prospects — with real objections, skepticism, and pushback that prepares you for the actual call.",
      onClick: handleVoiceTrainingClick
    },
    {
      icon: <BarChart className="h-6 w-6 text-primary-600" />,
      title: "Instant Scoring & Coaching",
      description: "Get a score and specific feedback after every session. Know exactly where you lost the prospect and what to say differently next time.",
      onClick: handleAnalyticsClick
    },
    {
      icon: <Users className="h-6 w-6 text-primary-600" />,
      title: "Real Sales Scenarios",
      description: "Cold calls, discovery, demos, pricing objections, closing. Practice the exact conversation you're about to have.",
      onClick: handleAIRoleplayClick
    }
  ];

  return (
    <>
      <Helmet>
        <title>PitchPerfect AI - Stop Losing Deals Because You Weren't Ready</title>
        <meta name="description" content="Practice sales objections with an AI that fights back. Get scored feedback in 30 seconds. Walk into every call ready. Free demo — no signup required." />
        <meta name="keywords" content="sales training, pitch practice, AI roleplay, objection handling, sales skills, sales coaching, revenue enablement" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://pitchperfectai.ai/" />
        <meta property="og:title" content="PitchPerfect AI - Stop Losing Deals Because You Weren't Ready" />
        <meta property="og:description" content="Practice objections with an AI that fights back. Get scored feedback in 30 seconds. Free demo — no signup." />
        <meta property="og:image" content="https://pitchperfectai.ai/og-image.png" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://pitchperfectai.ai/" />
        <meta property="twitter:title" content="PitchPerfect AI - Stop Losing Deals Because You Weren't Ready" />
        <meta property="twitter:description" content="Practice objections with an AI that fights back. Get scored feedback in 30 seconds. Free demo — no signup." />
        <meta property="twitter:image" content="https://pitchperfectai.ai/og-image.png" />

        {/* Structured Data for SEO */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "PitchPerfect AI",
            "applicationCategory": "BusinessApplication",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "ratingCount": "127"
            },
            "description": "AI-powered sales training platform that helps you practice objection handling and perfect your pitch."
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <SkipLink href="#main-content">Skip to main content</SkipLink>
        <SkipLink href="#features">Skip to features</SkipLink>
        <SkipLink href="#testimonials">Skip to testimonials</SkipLink>
        <Navbar />

        <main>
          {/* ============================================ */}
          {/* HERO SECTION — Rewritten for pain + urgency  */}
          {/* ============================================ */}
          <section id="main-content" className="pt-16 sm:pt-24 pb-12 sm:pb-16 relative overflow-hidden" role="main" aria-labelledby="hero-heading" data-onboarding="hero">
            <div className="container mx-auto px-4 text-center relative z-10">
              <Badge className="mb-4 sm:mb-6 bg-primary-50 text-primary-700 border-primary-200 font-medium text-sm">
                <Sparkles className="h-3 w-3 mr-1" />
                Your AI Sales Sparring Partner
              </Badge>

              <h1 id="hero-heading" className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6 leading-tight">
                You know your product. You just freeze<br />
                when they <span className="text-primary-600">push back.</span>
              </h1>

              <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
                PitchPerfect AI is your private sparring partner. Pick a sales scenario, practice against an AI buyer who pushes back, and get a performance score — all in under 10 minutes.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12">
                <Button
                  size="lg"
                  className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  onClick={handleGetStartedClick}
                >
                  Practice Your First Pitch Free →
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-primary-400 text-primary-700 hover:bg-primary-50 font-medium px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg"
                  onClick={handleWatchDemoClick}
                  data-onboarding="demo-button"
                  data-testid="watch-demo-button"
                >
                  See How It Works
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary-600" />
                  Free first session
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary-600" />
                  No credit card
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary-600" />
                  Under 10 minutes
                </div>
              </div>

              <div className="mt-6 sm:mt-8">
                <TrustBadges variant="compact" className="justify-center" />
              </div>

              {/* 3-Step Process — Rewritten for outcome focus */}
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="text-center p-6 bg-card rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                  <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Target className="h-7 w-7 text-primary-600" />
                  </div>
                  <div className="bg-primary-600 text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center mx-auto mb-3">1</div>
                  <h3 className="font-semibold mb-2 text-foreground">Pick Your Scenario</h3>
                  <p className="text-sm text-muted-foreground">Cold call, pricing objection, demo close — choose what you need to nail right now.</p>
                </div>

                <div className="text-center p-6 bg-card rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                  <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-7 w-7 text-primary-600" />
                  </div>
                  <div className="bg-primary-600 text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center mx-auto mb-3">2</div>
                  <h3 className="font-semibold mb-2 text-foreground">Spar with a Tough AI Buyer</h3>
                  <p className="text-sm text-muted-foreground">Our AI pushes back like a real prospect. No softballs. No scripts. Just real practice.</p>
                </div>

                <div className="text-center p-6 bg-card rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                  <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <BarChart className="h-7 w-7 text-primary-600" />
                  </div>
                  <div className="bg-primary-600 text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center mx-auto mb-3">3</div>
                  <h3 className="font-semibold mb-2 text-foreground">Get Scored & Walk In Ready</h3>
                  <p className="text-sm text-muted-foreground">See where you lost them, what to say differently, and go nail your real call.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Trust Bar */}
          <div className="py-3 sm:py-4 border-t border-b border-border/50" style={{ backgroundColor: '#F8FAFC' }}>
            <div className="container mx-auto px-4">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-[13px] sm:text-[14px] text-muted-foreground">
                <span>🏢 Listed in Lohfeld Consulting AI Guide — $170B+ in proposals won</span>
                <span>🔒 100% Private — No manager dashboards</span>
                <span>🚀 Featured on Product Hunt</span>
              </div>
            </div>
          </div>

          {/* WHY NOT JUST USE CHATGPT? — New section       */}
          {/* ============================================ */}
          <section className="py-12 sm:py-16 bg-secondary-50">
            <div className="container mx-auto px-4">
              <div className="text-center mb-8 sm:mb-10">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3">
                  Why Not Just Practice Alone or Use ChatGPT?
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
                  Because generic tools don't make you better at sales. Here's the difference:
                </p>
              </div>

              {/* Comparison Table */}
              <div className="max-w-4xl mx-auto overflow-x-auto">
                <table className="w-full border-collapse bg-card rounded-xl overflow-hidden shadow-sm">
                  <thead>
                    <tr className="bg-primary-600 text-white">
                      <th className="p-3 sm:p-4 text-left text-sm sm:text-base font-semibold"></th>
                      <th className="p-3 sm:p-4 text-center text-sm sm:text-base font-semibold">Practice Alone</th>
                      <th className="p-3 sm:p-4 text-center text-sm sm:text-base font-semibold">ChatGPT</th>
                      <th className="p-3 sm:p-4 text-center text-sm sm:text-base font-semibold bg-primary-700">PitchPerfect AI ✓</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Realistic buyer pushback", "❌ No", "😐 Weak", "✅ Tough & structured"],
                      ["Scores your performance", "❌ No", "❌ No", "✅ After every session"],
                      ["Sales-specific scenarios", "❌ No", "😐 Generic", "✅ Cold call, demo, close"],
                      ["Tracks your improvement", "❌ No", "❌ No", "✅ Dashboard & streaks"],
                      ["Ready in 5 minutes", "😐 Maybe", "😐 Needs prompting", "✅ One click"],
                    ].map(([feature, alone, chatgpt, ppai], i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-card' : 'bg-secondary-50/50'}>
                        <td className="p-3 sm:p-4 text-sm sm:text-base font-medium text-foreground">{feature}</td>
                        <td className="p-3 sm:p-4 text-center text-sm sm:text-base text-muted-foreground">{alone}</td>
                        <td className="p-3 sm:p-4 text-center text-sm sm:text-base text-muted-foreground">{chatgpt}</td>
                        <td className="p-3 sm:p-4 text-center text-sm sm:text-base font-medium text-primary-700 bg-primary-50/50">{ppai}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* ============================================ */}
          {/* URGENCY / WHY NOW section                    */}
          {/* ============================================ */}
          <section className="py-12 sm:py-16 bg-background">
            <div className="container mx-auto px-4 text-center max-w-3xl">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
                Your Next Sales Call Is Coming.
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground mb-6 leading-relaxed">
                Every unpracticed pitch is a gamble. Every objection you haven't rehearsed is a deal you might lose.
                The best sales professionals don't wing it — they prepare.
              </p>
              <p className="text-base text-muted-foreground mb-8">
                PitchPerfect AI lets you practice the exact conversation you're about to have, so you walk in confident instead of hoping for the best.
              </p>
              <Button
                size="lg"
                className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                onClick={handleGetStartedClick}
              >
                Practice Your First Pitch Free
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <p className="text-sm text-muted-foreground mt-4">No signup required · Takes 5 minutes</p>
            </div>
          </section>

          {/* Product Hunt badge */}
          <section className="py-8 sm:py-12 bg-secondary-50">
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

          <section id="features" className="py-12 sm:py-16 bg-background" aria-labelledby="features-heading">
            <div className="container mx-auto px-4">
              <div className="text-center mb-8 sm:mb-12">
                <h2 id="features-heading" className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4">
                  Built for Sales Professionals Who Want to Win
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
                  Not a generic AI chatbot. A practice partner designed specifically for the conversations that close deals.
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

          {/* ============================================ */}
          {/* FAQ — Objection handling for buyers            */}
          {/* ============================================ */}
          <section className="py-12 sm:py-16 bg-secondary-50">
            <div className="container mx-auto px-4 max-w-3xl">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-8 text-center">
                Common Questions
              </h2>
              <div className="space-y-4">
                {[
                  {
                    q: "Is this just ChatGPT with a sales prompt?",
                    a: "No. PitchPerfect AI uses structured sales scenarios with built-in buyer personas, objection libraries, and a scoring system. ChatGPT gives you generic conversation. We give you a tough buyer who scores your performance and tells you exactly where you lost the deal."
                  },
                  {
                    q: "Will AI feedback actually help me sell better?",
                    a: "Our AI evaluates your pitch on specific criteria: objection handling, value articulation, closing technique, and confidence. You get a score and actionable suggestions after every session — not vague encouragement."
                  },
                  {
                    q: "I don't have time to practice.",
                    a: "A single session takes 5–10 minutes. Most users practice right before a scheduled call. Think of it as a warm-up, not a workout."
                  },
                  {
                    q: "Why pay $29/month when the demo is free?",
                    a: "The free demo gives you one session. Subscribers get unlimited practice, all scenario types, progress tracking, advanced coaching feedback, and the ability to drill specific weaknesses. One closed deal pays for years of PitchPerfect AI."
                  },
                  {
                    q: "What if it doesn't work for me?",
                    a: "Try the free demo first with no signup. If you subscribe and it's not helping you within 30 days, get a full refund — no questions asked."
                  }
                ].map((faq, i) => (
                  <details key={i} className="bg-card rounded-lg border p-4 sm:p-5 group">
                    <summary className="font-semibold text-foreground cursor-pointer list-none flex justify-between items-center">
                      {faq.q}
                      <span className="text-primary-600 group-open:rotate-180 transition-transform text-lg ml-2">▾</span>
                    </summary>
                    <p className="mt-3 text-muted-foreground text-sm sm:text-base leading-relaxed">
                      {faq.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          <LazyLoadManager className="py-8 sm:py-12 bg-background" priority="normal">
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