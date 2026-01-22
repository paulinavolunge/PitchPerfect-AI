
import React from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Terms = () => {
  return (
    <>
      <Helmet>
        <title>Terms of Service - PitchPerfect AI</title>
        <meta name="description" content="Read the terms of service for PitchPerfect AI platform. Understand your rights and responsibilities when using our AI-powered sales training platform." />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href={`${window.location.origin}/terms`} />
      </Helmet>
      
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold mb-8 text-brand-dark">Terms of Service</h1>
          
          <div className="prose prose-lg max-w-4xl">
            <p className="text-lg mb-6">
              By using PitchPerfect AI, you agree to these terms of service. Our platform is designed 
              to help sales professionals improve their pitching skills through AI-powered feedback 
              and practice sessions.
            </p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">Usage Terms</h2>
            <p className="text-lg mb-6">
              PitchPerfect AI is provided "as is" and is intended for professional development purposes. 
              Users are responsible for the content they upload and share through our platform.
            </p>
            
            <h2 className="text-2xl font-semibold mt-8 mb-4">Service Availability</h2>
            <p className="text-lg">
              We strive to maintain high availability of our service but cannot guarantee uninterrupted access. 
              We reserve the right to modify or discontinue features with reasonable notice.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Terms;
