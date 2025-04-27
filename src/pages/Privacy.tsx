
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Privacy = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8 text-brand-dark">Privacy Policy</h1>
        
        <div className="prose prose-lg max-w-4xl">
          <p className="text-lg mb-6">
            At PitchPerfect AI, we take your privacy seriously. This policy outlines how we collect, 
            use, and protect your personal information when you use our platform.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Data Collection</h2>
          <p className="text-lg mb-6">
            We collect information necessary to provide our services, including practice recordings, 
            scripts, and usage data. This helps us improve our AI feedback and personalize your 
            learning experience.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Data Protection</h2>
          <p className="text-lg">
            Your data is encrypted and stored securely. We do not share your personal information 
            with third parties without your explicit consent, except as required by law.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
