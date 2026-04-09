import React from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import GamifiedRoleplay from '@/components/GamifiedRoleplay';

const Practice = () => {
  return (
    <>
      <Helmet>
        <title>Rounds | PitchPerfect AI</title>
        <meta name="description" content="Beat the AI prospect. Handle real sales objections in a head-to-head round." />
      </Helmet>
      <Navbar />
      <main className="min-h-screen bg-background pt-4 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <GamifiedRoleplay />
        </div>
      </main>
    </>
  );
};

export default Practice;
