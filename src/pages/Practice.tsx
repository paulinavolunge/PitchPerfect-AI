
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Mic, MicOff, Pause, Play, RefreshCcw } from 'lucide-react';

const Practice = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  
  const toggleRecording = () => {
    if (isRecording) {
      setShowFeedback(true);
    }
    setIsRecording(!isRecording);
  };
  
  const resetPractice = () => {
    setIsRecording(false);
    setShowFeedback(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold text-brand-dark">Practice Your Pitch</h1>
              <Button variant="outline" onClick={resetPractice} className="flex items-center gap-2">
                <RefreshCcw size={16} />
                New Session
              </Button>
            </div>
            
            <Card className="mb-8">
              <CardContent className="p-8">
                <div className="text-center">
                  <h2 className="text-xl font-medium mb-6">Product Demo Pitch</h2>
                  
                  {!showFeedback ? (
                    <div className="space-y-8">
                      <p className="text-brand-dark/70 max-w-lg mx-auto">
                        Demonstrate your product's key features and benefits in a clear, engaging 2-3 minute pitch.
                      </p>
                      
                      <div className="flex justify-center">
                        <Button
                          className={`rounded-full h-20 w-20 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-brand-green hover:bg-brand-green/90'}`}
                          onClick={toggleRecording}
                        >
                          {isRecording ? (
                            <MicOff size={32} />
                          ) : (
                            <Mic size={32} />
                          )}
                        </Button>
                      </div>
                      
                      {isRecording && (
                        <div className="animate-pulse text-red-500 font-medium">
                          Recording...
                        </div>
                      )}
                      
                      <div className="flex justify-center gap-4">
                        <Button variant="outline" className="flex items-center gap-2">
                          <Play size={16} />
                          Example
                        </Button>
                        <Button variant="outline" className="flex items-center gap-2">
                          <Pause size={16} />
                          Pause
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <div className="bg-brand-blue/20 rounded-xl p-6 text-left">
                        <h3 className="font-medium text-lg mb-4 text-brand-dark">AI Feedback</h3>
                        
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium text-brand-dark mb-2">Strengths</h4>
                            <ul className="list-disc pl-5 space-y-1 text-brand-dark/70">
                              <li>Clear explanation of the product's core functionality</li>
                              <li>Good enthusiasm and energy throughout the pitch</li>
                              <li>Strong closing statement with clear call-to-action</li>
                            </ul>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-brand-dark mb-2">Areas for Improvement</h4>
                            <ul className="list-disc pl-5 space-y-1 text-brand-dark/70">
                              <li>Speaking pace was 15% too fast in the technical section</li>
                              <li>Consider adding more specific customer examples</li>
                              <li>The value proposition could be stated earlier in the pitch</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-brand-dark/70 mb-1">Clarity</p>
                          <div className="flex items-center justify-center gap-2">
                            <div className="text-2xl font-bold text-brand-dark">76%</div>
                            <div className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">+5%</div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-brand-dark/70 mb-1">Engagement</p>
                          <div className="flex items-center justify-center gap-2">
                            <div className="text-2xl font-bold text-brand-dark">82%</div>
                            <div className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">+8%</div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-brand-dark/70 mb-1">Pacing</p>
                          <div className="flex items-center justify-center gap-2">
                            <div className="text-2xl font-bold text-brand-dark">65%</div>
                            <div className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">-3%</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-center gap-4">
                        <Button className="btn-primary" onClick={resetPractice}>
                          Try Again
                        </Button>
                        <Button variant="outline">
                          Save Feedback
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="font-medium text-lg mb-4 text-brand-dark">Tips for this scenario</h3>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <div className="text-brand-green font-bold">•</div>
                    <p className="text-brand-dark/70">Start with a compelling problem statement that resonates with your audience</p>
                  </li>
                  <li className="flex gap-3">
                    <div className="text-brand-green font-bold">•</div>
                    <p className="text-brand-dark/70">Limit your pitch to 2-3 key benefits rather than listing all features</p>
                  </li>
                  <li className="flex gap-3">
                    <div className="text-brand-green font-bold">•</div>
                    <p className="text-brand-dark/70">Include a specific success metric or case study to build credibility</p>
                  </li>
                  <li className="flex gap-3">
                    <div className="text-brand-green font-bold">•</div>
                    <p className="text-brand-dark/70">End with a clear, low-friction next step for your prospect</p>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Practice;
