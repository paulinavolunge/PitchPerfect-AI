import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Rocket, Users, BarChart3, Play } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';

const BASE_URL = 'https://www.pitchperfectai.ai';

const ForFounders = () => (
  <>
    <Helmet>
      <title>PitchPerfect AI for Founders — Practice Your Sales Pitch</title>
      <meta
        name="description"
        content="Founders doing their own sales: practice discovery calls and pitch objections with AI. Get scored, get feedback, close your first customers faster."
      />
      <link rel="canonical" href={`${BASE_URL}/for-founders`} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content="PitchPerfect AI for Founders — Nail Your First Sales Calls" />
      <meta property="og:description" content="Practice discovery calls with AI. Know your pitch cold before talking to your first enterprise buyer." />
      <meta property="og:url" content={`${BASE_URL}/for-founders`} />
      <meta property="og:image" content={`${BASE_URL}/og-image.png`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="PitchPerfect AI for Founders — Nail Your First Sales Calls" />
      <meta name="twitter:description" content="Practice discovery calls with AI. Know your pitch cold before talking to your first enterprise buyer." />
      <meta name="twitter:image" content={`${BASE_URL}/og-image.png`} />
    </Helmet>

    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-grow">
        {/* Hero */}
        <section className="bg-gradient-to-br from-violet-50 to-purple-50 py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm font-semibold text-violet-600 tracking-widest uppercase mb-3">
              For Founders
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-5">
              Know your pitch cold before<br />the meeting that matters.
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mb-8 leading-relaxed">
              You built the product. Now practice selling it. PitchPerfect AI runs you through
              discovery calls, budget objections, and "we already have a vendor" pushback —
              so the real call feels like a replay.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" className="text-lg px-8 h-14 bg-violet-600 hover:bg-violet-700">
                <Link to="/signup">
                  <Play className="h-5 w-5 fill-current mr-2" />
                  Start free — no credit card
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg px-8 h-14">
                <Link to="/demo">Watch a demo</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
              Everything a founder needs to sell confidently
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  Icon: Users,
                  title: 'Discovery call practice',
                  body: 'Learn to ask the right questions before pitching. AI scores your discovery framework, listening ratio, and pain identification.',
                },
                {
                  Icon: Rocket,
                  title: 'Founder-specific objections',
                  body: '"You\'re too early." "We tried something like this." "I need to check with my team." Know your answers cold.',
                },
                {
                  Icon: BarChart3,
                  title: 'Instant AI feedback',
                  body: 'Get scored on talk ratio, filler words, confidence, and closing ask — after every 90-second round.',
                },
              ].map(({ Icon, title, body }) => (
                <div key={title} className="bg-violet-50 rounded-2xl p-6">
                  <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Social proof */}
        <section className="bg-gray-50 py-14 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <blockquote className="text-xl font-medium text-gray-800 italic mb-4">
              "I closed my first $50k enterprise deal two weeks after starting to practice
              with PitchPerfect. The AI pushback prepared me for every objection they threw."
            </blockquote>
            <cite className="text-gray-500 text-sm not-italic">— Founder, Series A startup</cite>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Start selling like you've done it 100 times.
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            Practice your discovery call right now — free, no credit card, 90 seconds.
          </p>
          <Button asChild size="lg" className="text-lg px-10 h-14 bg-violet-600 hover:bg-violet-700">
            <Link to="/signup">Get started free</Link>
          </Button>
        </section>
      </main>

      <Footer />
    </div>
  </>
);

export default ForFounders;
