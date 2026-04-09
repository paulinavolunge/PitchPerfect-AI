import React from 'react';
import { Button } from '@/components/ui/button';
import { Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Helmet } from 'react-helmet-async';

/**
 * The old pricing comparison page has been replaced with a single CTA
 * that sends visitors to the homepage cold call hook. Every purchase
 * decision should happen AFTER a user has emotional investment from
 * completing a call — never from a cold comparison table.
 *
 * The /pricing route is kept because external links, SEO, and
 * bookmarks still point here.
 */
const Pricing = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    // Land on the homepage with a query flag that Index.tsx reads to
    // auto-open the ColdCallHook dialog.
    navigate('/?cta=cold-call');
  };

  return (
    <>
      <Helmet>
        <title>Try a Round First — PitchPerfect AI</title>
        <meta
          name="description"
          content="The best way to see our pricing is to try a round first. Take a free cold call, see your score, then decide."
        />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />

        <main className="flex-grow flex items-center justify-center px-4 py-16">
          <div className="max-w-xl w-full text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
              The best way to see our pricing? Try a round first.
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground mb-8">
              Take a free cold call. See your score. Then decide.
            </p>

            <Button
              size="lg"
              onClick={handleStart}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-6 text-base sm:text-lg"
            >
              <Phone className="h-5 w-5 mr-2" />
              Start Your Free Round
            </Button>

            <p className="text-xs sm:text-sm text-muted-foreground mt-4">
              Plans start at $4.99. No subscription required.
            </p>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Pricing;
