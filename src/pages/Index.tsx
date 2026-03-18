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

          {/* THIS ISN'T CHATGPT — Comparison section */}
          <section className="py-12 sm:py-16" style={{ backgroundColor: '#F8FAFC' }}>
            <div className="container mx-auto px-4 max-w-4xl">
              <div className="text-center mb-8 sm:mb-10">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3">
                  This Isn't ChatGPT With a Sales Prompt.
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
                  ChatGPT agrees with you, goes off-topic, and never pushes back. PitchPerfect AI runs structured sales scenarios with a scoring engine. You get a score, not a pep talk.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ChatGPT Card */}
                <div className="bg-card rounded-xl border p-6 sm:p-8 shadow-sm">
                  <h3 className="text-lg font-bold text-foreground mb-4">ChatGPT Response</h3>
                  <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-4 italic">
                    "That's a great pitch! You're doing really well. Here are some tips to consider: try to be more empathetic, use the prospect's name, and remember to ask open-ended questions. Keep it up! 😊"
                  </p>
                  <p className="text-sm font-semibold text-destructive">✗ Generic advice. No pushback. No score.</p>
                </div>

                {/* PitchPerfect AI Card */}
                <div className="rounded-xl p-6 sm:p-8 shadow-sm" style={{ backgroundColor: '#0f172a' }}>
                  <h3 className="text-lg font-bold text-white mb-4">PitchPerfect AI Response</h3>
                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-4 italic">
                    "We already use [Competitor] and we're happy with them. I've got a board meeting in 20 minutes. Give me one concrete reason I should keep listening instead of hanging up."
                  </p>
                  <p className="text-sm font-semibold" style={{ color: '#22c55e' }}>✓ Realistic pushback. Scored 7.4/10. Specific feedback.</p>
                </div>
              </div>
            </div>
          </section>

          {/* REAL SALES SCENARIOS section */}
          <section className="py-12 sm:py-16" style={{ backgroundColor: '#F8FAFC' }}>
            <div className="container mx-auto px-4 max-w-4xl">
              <div className="text-center mb-8 sm:mb-10">
                <Badge className="mb-4 bg-primary-50 text-primary-700 border-primary-200 font-medium text-sm">
                  Real Sales Scenarios
                </Badge>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3">
                  Practice the Exact Call You're About to Make.
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
                  Not generic communication tips. Real sales scenarios designed around the conversations that make or break your month.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card rounded-xl border-l-4 border-l-primary-600 border p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-foreground mb-2">🎯 Cold Call — First 30 Seconds</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">Get past "I'm not interested" and earn the meeting. Practice your opener and handle instant rejection.</p>
                </div>
                <div className="bg-card rounded-xl border-l-4 border-l-primary-600 border p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-foreground mb-2">💰 Pricing Objection</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">Handle "That's too expensive" without flinching. Practice value framing and avoiding the discount trap.</p>
                </div>
                <div className="bg-card rounded-xl border-l-4 border-l-primary-600 border p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-foreground mb-2">🎤 Demo Close</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">Ask for the business when the demo goes well. Practice trial closes and handling "let me think about it."</p>
                </div>
                <div className="bg-card rounded-xl border-l-4 border-l-primary-600 border p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-foreground mb-2">🚪 Gatekeeper Bypass</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">Get past the front desk to the decision-maker with assertive-but-respectful techniques that work.</p>
                </div>
              </div>

              <div className="text-center mt-8">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-primary-400 text-primary-700 hover:bg-primary-50 font-medium px-6 py-3 text-base sm:text-lg"
                  onClick={() => navigate('/practice')}
                >
                  Start With Any Scenario — Free →
                </Button>
              </div>
            </div>
          </section>


          {/* FAQ / STRAIGHT ANSWERS section */}
          <section className="py-12 sm:py-16" style={{ backgroundColor: '#F8FAFC' }}>
            <div className="container mx-auto px-4 max-w-4xl">
              <div className="text-center mb-8 sm:mb-10">
                <Badge className="mb-4 bg-primary-50 text-primary-700 border-primary-200 font-medium text-sm">
                  Straight Answers
                </Badge>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3">
                  You're Skeptical. Good — That Means You're a Real Salesperson.
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { q: "I don't have time for this.", a: "A session takes under 10 minutes. That's less time than replaying a call you lost in your head on the drive home." },
                  { q: "Will this actually help me close more?", a: "You practice against realistic objections before the real call. You walk in prepared instead of winging it. Preparation beats talent when talent doesn't prepare." },
                  { q: "Why not just use ChatGPT?", a: "ChatGPT won't push back, won't score you, and won't run structured scenarios. It gives advice. We give reps. There's a difference between reading about pushups and doing them." },
                  { q: "$29/month seems like a lot.", a: "It's less than the commission on one deal you'd lose by freezing on an objection you never practiced. One closed deal pays for years of PitchPerfect AI." },
                  { q: "I've been selling for 15 years.", a: "The AI adapts. Veterans get harder pushback — multi-layered objections, misdirections, the kind of thing a VP of Procurement throws at you. This sharpens the edge, not teaches the basics." },
                  { q: "What if I try it and it's not for me?", a: "Free first session. No credit card. Under 10 minutes. If it doesn't help, you've lost nothing except a few minutes." },
                ].map((faq, i) => (
                  <div key={i} className="bg-card rounded-xl border p-6 shadow-sm">
                    <h3 className="text-base sm:text-lg font-bold text-foreground mb-2">"{faq.q}"</h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>


          <LazyLoadManager className="py-12 sm:py-16" data-onboarding="pricing" priority="high" rootMargin="250px">
            <div className="container mx-auto px-4 max-w-3xl">
              <div className="mb-6 sm:mb-8">
                <TrustBadges variant="compact" className="justify-center mb-4 sm:mb-6" />
              </div>
              <PricingCTA />
            </div>
          </LazyLoadManager>

          {/* FOUNDER NOTE section */}
          <section className="py-12 sm:py-16" style={{ backgroundColor: '#F8FAFC' }}>
            <div className="container mx-auto px-4 max-w-3xl">
              <div className="flex flex-col sm:flex-row items-start gap-5 sm:gap-6">
                <div className="w-14 h-14 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl font-bold text-white">P</span>
                </div>
                <div>
                  <p className="text-base sm:text-lg text-foreground leading-relaxed italic mb-4">
                    "I built PitchPerfect AI because I spent years as an Account Executive, handling objections on hundreds of sales calls and learning the hard way that preparation beats talent. Every rep deserves a sparring partner that tells them the truth — not a chatbot that says great job."
                  </p>
                  <p className="font-bold text-foreground">Paulina Vol — Founder</p>
                  <p className="text-sm text-muted-foreground">Former Account Executive · 5+ years in B2B sales</p>
                </div>
              </div>
            </div>
          </section>

          {/* FINAL CTA section */}
          <section className="py-16 sm:py-20" style={{ backgroundColor: '#0F172A' }}>
            <div className="container mx-auto px-4 max-w-3xl text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
                Your next deal is this week. Are you walking in cold?
              </h2>
              <p className="text-lg sm:text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                One 10-minute session. That's all it takes to feel the difference. No credit card, no commitment, no one watching.
              </p>
              <Button
                size="lg"
                className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 mb-6"
                onClick={handleGetStartedClick}
              >
                Practice Your First Pitch Free →
              </Button>
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary-400" />
                  Free first session
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary-400" />
                  No credit card
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary-400" />
                  Under 10 minutes
                </div>
              </div>
            </div>
          </section>

          <LazyLoadManager priority="low">
            <Footer />
          </LazyLoadManager>

          {/* Mobile sticky CTA bar */}
          <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-border p-3">
            <Button
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 text-base"
              onClick={handleGetStartedClick}
            >
              Practice Your First Pitch Free →
            </Button>
          </div>

        </main>
        {/* Spacer for mobile sticky bar */}
        <div className="h-16 md:hidden" />
      </div>
    </>
  );
};

export default Index;