import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TeamAnalytics from '@/components/dashboard/TeamAnalytics';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import PremiumModal from '@/components/PremiumModal';

const TeamDashboard = () => {
  const { isPremium, user } = useAuth();
  const [showPremiumModal, setShowPremiumModal] = React.useState(!isPremium);
  const navigate = useNavigate();

  React.useEffect(() => {
    // If not premium, show the premium modal
    if (!isPremium) {
      setShowPremiumModal(true);
    }
  }, [isPremium]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-12">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            className="mb-6 flex items-center gap-2 text-brand-dark/70"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Button>
          
          <TeamAnalytics />
        </div>
      </main>
      
      <Footer />
      
      {/* Premium Modal */}
      <PremiumModal 
        isOpen={showPremiumModal} 
        onClose={() => {
          setShowPremiumModal(false);
          if (!isPremium) {
            navigate("/subscription");
          }
        }}
        feature="team analytics"
      />
    </div>
  );
};

export default TeamDashboard;
