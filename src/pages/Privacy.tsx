
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
          <p className="text-lg mb-4">
            We collect information necessary to provide our services, including:
          </p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li className="text-lg">Email addresses for account creation, access, and authentication</li>
            <li className="text-lg">Practice recordings and voice samples when you use our platform</li>
            <li className="text-lg">Sales scripts and pitches that you upload or create</li>
            <li className="text-lg">Performance data and scores from your practice sessions</li>
            <li className="text-lg">Usage data to improve our AI feedback and personalize your experience</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">How We Use Your Data</h2>
          <p className="text-lg mb-4">
            We use the collected information for the following purposes:
          </p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li className="text-lg">To provide and maintain our service</li>
            <li className="text-lg">To personalize your learning experience</li>
            <li className="text-lg">To analyze your performance and provide AI-powered feedback</li>
            <li className="text-lg">To track progress and generate insights about your skill development</li>
            <li className="text-lg">To improve our algorithms and the quality of our platform</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Data Protection</h2>
          <p className="text-lg mb-4">
            Your data security is our priority:
          </p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li className="text-lg">All data is encrypted in transit and at rest using industry-standard encryption protocols</li>
            <li className="text-lg">We implement strict access controls to limit who can access your information</li>
            <li className="text-lg">Regular security audits and updates are performed to maintain data protection</li>
            <li className="text-lg">Personal information is stored only for as long as necessary to provide our services</li>
          </ul>
          <p className="text-lg mb-6">
            We do not share your personal information with third parties without your explicit consent, 
            except as required by law or to protect our rights.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Your Rights</h2>
          <p className="text-lg mb-4">
            You have the right to:
          </p>
          <ul className="list-disc pl-6 mb-6 space-y-2">
            <li className="text-lg">Access the personal data we hold about you</li>
            <li className="text-lg">Request correction of inaccurate data</li>
            <li className="text-lg">Request deletion of your data</li>
            <li className="text-lg">Opt-out of certain data processing activities</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Contact Us</h2>
          <p className="text-lg">
            If you have questions about our privacy practices or would like to exercise your rights,
            please contact us at <a href="mailto:info@pitchperfectai.ai" className="text-brand-green hover:underline">info@pitchperfectai.ai</a>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
