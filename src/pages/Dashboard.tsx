
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ArrowRight } from 'lucide-react';
import AISuggestionCard from '@/components/AISuggestionCard';
import DashboardStats from '@/components/DashboardStats';
import UserSubscriptionStatus from '@/components/dashboard/UserSubscriptionStatus';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user, refreshSubscription } = useAuth();
  
  useEffect(() => {
    // Refresh subscription status when dashboard loads
    if (user) {
      refreshSubscription();
    }
  }, [user, refreshSubscription]);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8 text-brand-dark">Your Dashboard</h1>
          
          <div className="mb-8">
            <UserSubscriptionStatus />
          </div>
          
          <DashboardStats />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader className="bg-brand-blue/10 pb-4">
                  <CardTitle className="text-xl text-brand-dark">Recent Practice Sessions</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium">Product Demo Pitch</h3>
                        <p className="text-sm text-brand-dark/70">2 hours ago • 3:45 min</p>
                      </div>
                      <Button variant="ghost" className="text-brand-green hover:bg-brand-green/10">View Feedback</Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium">Cold Call Introduction</h3>
                        <p className="text-sm text-brand-dark/70">Yesterday • 2:12 min</p>
                      </div>
                      <Button variant="ghost" className="text-brand-green hover:bg-brand-green/10">View Feedback</Button>
                    </div>
                    
                    <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                      View All Sessions
                      <ArrowRight size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-6">
              <Card className="bg-brand-green/5 border-brand-green/30">
                <CardContent className="p-6">
                  <h3 className="text-xl font-medium mb-4 text-brand-dark">Quick Practice</h3>
                  <p className="text-brand-dark/70 mb-6">
                    Ready to improve your pitch skills? Start a new practice session now.
                  </p>
                  <Link to="/practice">
                    <Button className="w-full mb-4 bg-brand-green hover:bg-brand-green/90">
                      Start New Practice
                    </Button>
                  </Link>
                  <Link to="/roleplay">
                    <Button variant="outline" className="w-full">
                      Try Roleplay Scenarios
                    </Button>
                  </Link>
                </CardContent>
              </Card>
              
              <div className="space-y-4">
                <h3 className="font-medium text-xl text-brand-dark">AI Suggestions</h3>
                <AISuggestionCard
                  title="Use Benefit-Focused Language"
                  description="Try framing features in terms of customer benefits using phrases like 'which means that you can...'"
                  type="tip"
                />
                
                <AISuggestionCard
                  title="Elevator Pitch Template"
                  description="Our [product] helps [target audience] to [solve problem] by [unique approach] unlike [alternative]."
                  type="script"
                />
                
                <Link to="/tips">
                  <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                    View All Tips
                    <ArrowRight size={16} />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Dashboard;
