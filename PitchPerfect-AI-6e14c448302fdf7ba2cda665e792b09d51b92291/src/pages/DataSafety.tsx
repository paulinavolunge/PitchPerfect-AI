
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Shield, Check, AlertTriangle, Info } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const DataSafety = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-green-600" />
          <h1 className="text-4xl font-bold text-brand-dark">Data Safety & Security</h1>
        </div>
        
        <div className="prose prose-lg max-w-4xl">
          <p className="text-lg mb-6">
            At PitchPerfect AI, we prioritize the safety and security of your data. This page explains 
            our data handling practices, the permissions our app requires, and how we protect your information.
          </p>
          
          <Separator className="my-8" />
          
          <h2 className="text-2xl font-semibold mt-8 mb-4 flex items-center gap-2">
            <Info className="h-6 w-6 text-blue-600" />
            App Permissions
          </h2>
          
          <div className="space-y-6 mb-8">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="font-medium text-lg mb-2">Microphone Access</h3>
              <p className="mb-2">
                We request microphone access to enable voice recording during pitch practice sessions and AI roleplay conversations.
              </p>
              <div className="flex items-center gap-2 text-amber-600 mt-3">
                <AlertTriangle className="h-5 w-5" />
                <p className="text-sm font-medium">
                  You will always be prompted before microphone access is used, and you can revoke this permission at any time.
                </p>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="font-medium text-lg mb-2">Internet Access</h3>
              <p>
                Internet access is required to connect to our servers for AI processing, saving your practice data,
                and syncing your progress across devices.
              </p>
            </div>
          </div>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4 flex items-center gap-2">
            <Shield className="h-6 w-6 text-green-600" />
            Data Collection & Usage
          </h2>
          
          <p className="mb-4">
            We collect and process the following types of data:
          </p>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Voice Recordings & Transcripts</p>
                <p className="text-gray-600">Used only to provide feedback on your sales pitches and deleted when no longer needed</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Performance Metrics</p>
                <p className="text-gray-600">Stored to track your progress over time and provide personalized coaching</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Account Information</p>
                <p className="text-gray-600">Email and basic profile data for authentication and account management</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Usage Analytics</p>
                <p className="text-gray-600">Anonymous data about how you use the app to improve our features</p>
              </div>
            </div>
          </div>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Data Protection Measures</h2>
          
          <div className="space-y-4 mb-8">
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h3 className="font-medium text-lg mb-2 text-green-800">Encryption</h3>
              <p className="text-green-800">
                All sensitive data is encrypted at rest and in transit using industry-standard AES-256 encryption.
                Your voice recordings, transcripts, and personal information are protected using advanced security protocols.
              </p>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="font-medium text-lg mb-2 text-blue-800">Access Controls</h3>
              <p className="text-blue-800">
                We implement strict access controls to ensure that only you can access your data.
                Our database uses row-level security to prevent unauthorized access.
              </p>
            </div>
            
            <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
              <h3 className="font-medium text-lg mb-2 text-purple-800">AI Transparency</h3>
              <p className="text-purple-800">
                We clearly label all AI-generated content in our app. You can control AI content display settings
                in your account preferences.
              </p>
            </div>
          </div>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">User Controls</h2>
          
          <p className="mb-4">
            You have full control over your data:
          </p>
          
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>Download your data at any time from your account settings</li>
            <li>Delete specific recordings or practice sessions</li>
            <li>Request complete account deletion</li>
            <li>Opt out of analytics and AI improvement data sharing</li>
          </ul>
          
          <div className="bg-amber-50 p-6 rounded-lg border border-amber-200 mt-8">
            <h3 className="font-medium text-lg mb-2 text-amber-800">Google Play Data Safety</h3>
            <p className="text-amber-800 mb-3">
              This information is provided in accordance with Google Play's Data Safety requirements.
              Our practices are designed to comply with global privacy regulations including GDPR and CCPA.
            </p>
            <p className="text-amber-800">
              If you have any questions or concerns about our data handling practices, please contact us at{' '}
              <a href="mailto:privacy@pitchperfectai.com" className="text-amber-800 underline">
                privacy@pitchperfectai.com
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DataSafety;
