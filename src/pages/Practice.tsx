import React from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import GamifiedRoleplay from '@/components/GamifiedRoleplay';
import { useFreeTrialLimit } from '@/hooks/useFreeTrialLimit';
import UpgradePaywallModal from '@/components/practice/UpgradePaywallModal';

const Practice = () => {
  const {
    hasReachedLimit,
    remainingAttempts,
    currentLimit,
  } = useFreeTrialLimit();

  return (
    <>
      <Helmet>
        <title>Practice | PitchPerfect AI</title>
        <meta name="description" content="Practice handling sales objections with AI-powered gamified roleplay sessions." />
      </Helmet>

      <Navbar />

      <main className="min-h-screen bg-background pt-4 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <GamifiedRoleplay />
        </div>
      </main>

      {hasReachedLimit && (
        <UpgradePaywallModal open={true} />
      )}
    </>
  );
};

export default Practice;
