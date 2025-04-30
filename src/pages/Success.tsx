
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

const SuccessPage = () => {
  const navigate = useNavigate();
  const { refreshSubscription } = useAuth();

  useEffect(() => {
    // Refresh the session to update premium status
    refreshSubscription();
  }, [refreshSubscription]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-lg w-full px-6 py-12 bg-white rounded-lg shadow-md text-center"
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mb-6 mx-auto w-24 h-24 flex items-center justify-center rounded-full bg-green-100"
          >
            <CheckCircle className="w-12 h-12 text-green-500" />
          </motion.div>
          
          <h1 className="text-3xl font-bold mb-4 text-brand-dark">Payment Successful!</h1>
          <p className="mb-8 text-gray-600">
            Thank you for subscribing to PitchPerfect AI Premium. Your account has been upgraded and you now have access to all premium features.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="btn-primary"
              onClick={() => navigate('/roleplay')}
            >
              Try Roleplay Now
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </Button>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default SuccessPage;
