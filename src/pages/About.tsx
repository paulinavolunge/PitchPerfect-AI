
import React from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const About = () => {
  return (
    <>
      <Helmet>
        <title>About Us - PitchPerfect AI | The AI Cold Call Challenge</title>
        <meta name="description" content="Learn about PitchPerfect AI — the cold call challenge that pushes back like a real buyer, scores you in 30 seconds, and helps you crush your next deal." />
        <meta name="keywords" content="cold call challenge, AI buyer, sales rounds, sales skills, objection handling" />
        <meta property="og:title" content="About PitchPerfect AI - The AI Cold Call Challenge" />
        <meta property="og:description" content="Discover how PitchPerfect AI empowers sales reps to sharpen their close in a real-world simulation environment." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`${window.location.origin}/about`} />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold mb-8 text-brand-dark">About PitchPerfect AI</h1>

          <div className="prose prose-lg max-w-4xl">
            <p className="text-lg mb-6">
              PitchPerfect AI was built to help sales reps go head-to-head with AI buyers
              who push back with real objections — anytime, anywhere.
            </p>

            <p className="text-lg mb-6">
              The platform runs lifelike AI rounds through both voice and text, helping reps
              build confidence, sharpen their close, and crush more deals.
            </p>

            <p className="text-lg mb-6">
              Whether you're just starting out or sharpening your edge, PitchPerfect AI gives you
              a private space to learn, grow, and succeed.
            </p>

            <p className="text-lg font-medium">
              Run more rounds. Close more deals. Become PitchPerfect.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default About;
