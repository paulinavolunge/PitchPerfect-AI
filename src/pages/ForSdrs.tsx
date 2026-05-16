import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Phone, Target, TrendingUp, Play } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';

const BASE_URL = 'https://www.pitchperfectai.ai';

const ForSdrs = () => (
  <>
    <Helmet>
      <title>PitchPerfect AI for SDRs &amp; BDRs — AI Cold Call Training</title>
      <meta
        name="description"
        content="SDRs: practice cold-call openers against a tough AI prospect. Get scored on your hook, tone, and objection handling. Beat quota faster."
      />
      <link rel="canonical" href={`${BASE_URL}/for-sdrs`} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content="PitchPerfect AI for SDRs — Master Cold Calls in 90 Seconds" />
      <meta property="og:description" content="Practice cold-call openers with AI. Get scored on your hook, pace, and objection handling." />
      <meta property="og:url" content={`${BASE_URL}/for-sdrs`} />
      <meta property="og:image" content={`${BASE_URL}/og-image.png`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="PitchPerfect AI for SDRs — Master Cold Calls in 90 Seconds" />
      <meta name="twitter:description" content="Practice cold-call openers with AI. Get scored on your hook, pace, and objection handling." />
      <meta name="twitter:image" content={`${BASE_URL}/og-image.png`} />
    </Helmet>

    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-grow">
        {/* Hero */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-50 py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm font-semibold text-blue-600 tracking-widest uppercase mb-3">
              For SDRs &amp; BDRs
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-5">
              Stop fumbling the opener.<br />Practice until cold calls feel easy.
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mb-8 leading-relaxed">
              PitchPerfect AI's AI prospect hangs up on weak openers and pushes back hard on
              budget and timing. Get scored after every 90-second round — see exactly where
              you're losing the conversation.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild size="lg" className="text-lg px-8 h-14">
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
              Built specifically for top-of-funnel reps
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  Icon: Phone,
                  title: 'Cold-call opener drills',
                  body: 'Practice your first 15 seconds until they\'re automatic. AI scores your hook, pacing, and confidence level.',
                },
                {
                  Icon: Target,
                  title: 'Objection handling',
                  body: '"Send me an email." "We already use someone." "Bad timing." Train responses until they\'re instant.',
                },
                {
                  Icon: TrendingUp,
                  title: 'Score out of 100',
                  body: 'Each round scored on hook quality, tone, objection handling, and ask. Track your improvement week by week.',
                },
              ].map(({ Icon, title, body }) => (
                <div key={title} className="bg-blue-50 rounded-2xl p-6">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
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
              "I went from 4% connect-to-meeting rate to 11% in 3 weeks just by drilling
              my opener every morning."
            </blockquote>
            <cite className="text-gray-500 text-sm not-italic">— SDR, B2B SaaS company</cite>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
            Ready to hit quota faster?
          </h2>
          <p className="text-gray-600 mb-8 text-lg">
            Start your first 90-second round right now — free, no credit card.
          </p>
          <Button asChild size="lg" className="text-lg px-10 h-14">
            <Link to="/signup">Get started free</Link>
          </Button>
        </section>
      </main>

      <Footer />
    </div>
  </>
);

export default ForSdrs;
