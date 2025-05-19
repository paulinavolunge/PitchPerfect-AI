
import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CheckCircle } from 'lucide-react';

const EmailConfirmed = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-grow flex items-center justify-center px-4">
        <div className="max-w-md text-center p-8 rounded-md shadow-md border bg-gray-50">
          <CheckCircle className="mx-auto text-green-500 w-12 h-12 mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Email Verified!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for confirming your email. You're all set to start using PitchPerfect AI!
          </p>
          <Link
            to="/dashboard"
            className="inline-block bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
          >
            Go to Dashboard
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EmailConfirmed;
