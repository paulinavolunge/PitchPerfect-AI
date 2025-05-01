
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Upload, AudioWaveform, PlusCircle, FileAudio, RefreshCw, ArrowRightLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import CallUploader from '@/components/recordings/CallUploader';
import CallComparisonView from '@/components/recordings/CallComparisonView';
import RecentCalls from '@/components/recordings/RecentCalls';
import PremiumModal from "@/components/PremiumModal";
import { useNavigate } from 'react-router-dom';

const CallRecordings = () => {
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [selectedCall, setSelectedCall] = useState<any>(null);
  const [isComparing, setIsComparing] = useState(false);
  const { user, isPremium } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Check if user is premium, if not show premium modal
  React.useEffect(() => {
    if (!isPremium) {
      setShowPremiumModal(true);
    }
  }, [isPremium]);
  
  const handleCallUpload = (callData: any) => {
    // In a real implementation, this would process the uploaded file
    toast({
      title: "Call uploaded",
      description: "Your call recording has been uploaded and is being processed.",
    });
    
    // Simulate processing completion
    setTimeout(() => {
      setSelectedCall(callData);
      toast({
        title: "Call processed",
        description: "Your call recording has been analyzed and scored.",
      });
    }, 2000);
  };
  
  const handleCompareToggle = () => {
    if (!selectedCall) {
      toast({
        title: "No call selected",
        description: "Please select a call recording to compare.",
        variant: "destructive"
      });
      return;
    }
    setIsComparing(!isComparing);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <h1 className="text-3xl font-bold text-brand-dark">Call Recordings</h1>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={handleCompareToggle}
                disabled={!selectedCall}
              >
                <ArrowRightLeft size={16} />
                {isComparing ? "Exit Comparison" : "Compare with Practice"}
              </Button>
              
              <Button className="flex items-center gap-2">
                <PlusCircle size={16} />
                Upload New Call
              </Button>
            </div>
          </div>
          
          {isComparing ? (
            <CallComparisonView 
              realCall={selectedCall} 
              onBack={() => setIsComparing(false)} 
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Tabs defaultValue="recent">
                  <TabsList className="mb-4">
                    <TabsTrigger value="recent">Recent Calls</TabsTrigger>
                    <TabsTrigger value="upload">Upload Call</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="recent">
                    <RecentCalls onSelectCall={setSelectedCall} selectedCall={selectedCall} />
                  </TabsContent>
                  
                  <TabsContent value="upload">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-xl">Upload Real Call Recording</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CallUploader onCallUploaded={handleCallUpload} />
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
              
              <div>
                <Card>
                  <CardHeader className="bg-brand-blue/10">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <AudioWaveform className="h-5 w-5" />
                      Call Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {selectedCall ? (
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-brand-dark/70 mb-1">Call Quality Score</p>
                          <div className="text-2xl font-bold text-brand-dark">
                            {selectedCall.score}/10
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-brand-dark/70 mb-1">Duration</p>
                            <div className="font-medium">{selectedCall.duration}</div>
                          </div>
                          <div>
                            <p className="text-sm text-brand-dark/70 mb-1">Date</p>
                            <div className="font-medium">{selectedCall.date}</div>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-brand-dark/70 mb-1">Top Strength</p>
                          <div className="font-medium text-green-600">
                            {selectedCall.topStrength}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-brand-dark/70 mb-1">Top Improvement</p>
                          <div className="font-medium text-amber-600">
                            {selectedCall.topImprovement}
                          </div>
                        </div>
                        
                        <Button 
                          className="w-full"
                          onClick={handleCompareToggle}
                        >
                          Compare with Practice
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-6 space-y-4">
                        <FileAudio className="h-12 w-12 text-brand-dark/30 mx-auto" />
                        <p className="text-brand-dark/70">
                          Select a call recording to view its analytics
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
      
      {/* Premium Modal */}
      <PremiumModal 
        open={showPremiumModal} 
        onOpenChange={(isOpen) => {
          setShowPremiumModal(isOpen);
          if (!isOpen && !isPremium) {
            navigate("/subscription");
          }
        }}
        featureName="call recording analysis"
      />
    </div>
  );
};

export default CallRecordings;
