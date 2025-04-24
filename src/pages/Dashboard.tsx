
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ArrowRight } from 'lucide-react';
import AISuggestionCard from '@/components/AISuggestionCard';

const Dashboard = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8 text-brand-dark">Your Dashboard</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
              
              <Card>
                <CardHeader className="bg-brand-blue/10 pb-4">
                  <CardTitle className="text-xl text-brand-dark">Your Progress</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-sm text-brand-dark/70">Total Sessions</p>
                      <p className="text-3xl font-bold text-brand-dark">12</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-sm text-brand-dark/70">Improvement</p>
                      <p className="text-3xl font-bold text-brand-green">+24%</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-sm text-brand-dark/70">Practice Time</p>
                      <p className="text-3xl font-bold text-brand-dark">3.5h</p>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="font-medium mb-3">Key Metrics Improvement</h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Clarity</span>
                          <span>75%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full">
                          <div className="h-2 bg-brand-green rounded-full w-3/4"></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Engagement</span>
                          <span>68%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full">
                          <div className="h-2 bg-brand-green rounded-full w-2/3"></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Pacing</span>
                          <span>82%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full">
                          <div className="h-2 bg-brand-green rounded-full w-4/5"></div>
                        </div>
                      </div>
                    </div>
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
                  <Button className="btn-primary w-full mb-4">Start New Practice</Button>
                  <Button variant="outline" className="w-full">Browse Scenarios</Button>
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
                
                <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                  View All Tips
                  <ArrowRight size={16} />
                </Button>
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
