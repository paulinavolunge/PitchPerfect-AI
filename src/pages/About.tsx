
import React from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const About = () => {
  return (
    <>
      <Helmet>
        <title>About Us - PitchPerfect AI | AI-Powered Sales Training</title>
        <meta name="description" content="Learn about PitchPerfect AI - the revolutionary platform that helps sales professionals practice and perfect their pitch delivery through AI-powered feedback and realistic simulations." />
        <meta name="keywords" content="sales training, AI coaching, pitch practice, sales skills, objection handling" />
        <meta property="og:title" content="About PitchPerfect AI - AI Sales Training Platform" />
        <meta property="og:description" content="Discover how PitchPerfect AI empowers sales professionals to practice and perfect their pitch delivery in a real-world simulation environment." />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={`${window.location.origin}/about`} />
      </Helmet>
      
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold mb-8 text-brand-dark">About PitchPerfect AI</h1>
          
          <div className="prose prose-lg max-w-4xl">
            <p className="text-lg mb-6">
              PitchPerfect AI was created to empower sales professionals to practice and perfect 
              their pitch delivery and objection handling in a real-world simulation — anytime, 
              anywhere.
            </p>
            
            <p className="text-lg mb-6">
              Our platform offers lifelike AI roleplays through both voice and text, helping users 
              build confidence, improve skills, and close more deals faster.
            </p>
            
            <p className="text-lg mb-6">
              Whether you're just starting out or sharpening your edge, PitchPerfect AI gives you 
              a private space to learn, grow, and succeed.
            </p>
            
            <p className="text-lg font-medium">
              Practice smarter. Sell better. Become PitchPerfect.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default About;
