
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
            PitchPerfect AI is revolutionizing the way sales professionals practice and perfect their pitches. 
            Our AI-powered platform provides real-time feedback, personalized coaching, and interactive roleplay 
            scenarios to help you develop and refine your sales skills.
          </p>
          
          <p className="text-lg mb-6">
            Founded by a team of sales veterans and AI specialists, we understand the challenges of mastering 
            sales presentations. That's why we've created a platform that combines cutting-edge artificial 
            intelligence with proven sales methodologies to help you close more deals with confidence.
          </p>
          
          <p className="text-lg">
            Whether you're new to sales or a seasoned professional, PitchPerfect AI provides the tools and 
            feedback you need to take your pitching skills to the next level.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
