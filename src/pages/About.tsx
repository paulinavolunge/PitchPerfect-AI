
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const About = () => {
  return (
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
  );
};

export default About;
