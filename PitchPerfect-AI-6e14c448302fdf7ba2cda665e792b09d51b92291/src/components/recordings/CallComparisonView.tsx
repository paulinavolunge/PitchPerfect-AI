
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, Volume2, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import DemoScorecard from '../demo/DemoScorecard';
import { CallData } from '../../types/feedback';

interface CallComparisonViewProps {
  realCall: CallData;
  onBack: () => void;
}

const CallComparisonView: React.FC<CallComparisonViewProps> = ({ realCall, onBack }) => {
  const [activeSide, setActiveSide] = useState<'real' | 'practice'>('real');
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(20);
  const [volume, setVolume] = useState(70);
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);
  
  // Sample practice call data for comparison
  const practiceCall = {
    id: 'practice-1',
    title: 'Practice Session - Product Demo',
    date: '2025-04-28',
    duration: '7:32',
    score: 6.8,
    overallScore: 6.8,
    transcript: 'This is a sample transcript from the practice session...',
    categories: {
      clarity: 6.5,
      confidence: 7.1,
      handling: 6.2,
      vocabulary: 7.4
    },
    strengths: [
      "Good explanation of core product features",
      "Natural vocal tone and pacing",
      "Clear call-to-action at the end"
    ],
    improvements: [
      "Could better address potential objections",
      "Too much technical jargon for the audience",
      "Missed opportunity to discuss pricing options"
    ],
    feedback: "Your practice pitch has good fundamentals but needs more refinement in handling objections and using appropriate language for your audience. Consider preparing responses to common objections and simplifying technical explanations.",
    percentile: 62
  };
  
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };
  
  const toggleTranscript = () => {
    setTranscriptExpanded(!transcriptExpanded);
  };
  
  const handleProgressChange = (value: number[]) => {
    setProgress(value[0]);
  };
  
  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const calculateProgressSeconds = (percentage: number, duration: string) => {
    const [mins, secs] = duration.split(':').map(Number);
    const totalSeconds = mins * 60 + secs;
    return Math.floor((percentage / 100) * totalSeconds);
  };
  
  const realCallSeconds = calculateProgressSeconds(progress, realCall.duration);
  const practiceCallSeconds = calculateProgressSeconds(progress, practiceCall.duration);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={onBack} className="p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-xl font-semibold">Comparing Real Call vs Practice</h2>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real Call Card */}
        <Card className={activeSide === 'real' ? 'ring-2 ring-brand-blue ring-offset-2' : ''}>
          <CardHeader className="bg-brand-blue/10 flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-xl">Real Call</CardTitle>
            <span className="text-sm text-brand-dark/70">{realCall.date}</span>
          </CardHeader>
          <CardContent className="p-4">
            <div>
              <div className="mb-4">
                <div className="text-xl font-semibold mb-2">{realCall.title}</div>
                <div className="text-brand-dark/70 text-sm">{realCall.duration} • Score: {realCall.score}/10</div>
              </div>
              
              <div className="space-y-4">
                <Tabs defaultValue="audio">
                  <TabsList className="w-full">
                    <TabsTrigger value="audio" className="flex-1">Audio</TabsTrigger>
                    <TabsTrigger value="transcript" className="flex-1">Transcript</TabsTrigger>
                    <TabsTrigger value="scorecard" className="flex-1">Scorecard</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="audio">
                    <div className="space-y-4">
                      <div className="pt-2">
                        <div className="flex justify-between text-xs text-brand-dark/70 mb-2">
                          <span>{formatTime(realCallSeconds)}</span>
                          <span>{realCall.duration}</span>
                        </div>
                        <Slider
                          value={[progress]}
                          min={0}
                          max={100}
                          step={1}
                          onValueChange={handleProgressChange}
                          className="my-1"
                        />
                        <div className="flex justify-center items-center gap-2 mt-4">
                          <Button variant="outline" size="icon">
                            <SkipBack className="h-4 w-4" />
                          </Button>
                          <Button 
                            onClick={togglePlay}
                            className="h-10 w-10 rounded-full bg-brand-blue"
                          >
                            {isPlaying ? (
                              <Pause className="h-5 w-5 text-white" />
                            ) : (
                              <Play className="h-5 w-5 text-white" />
                            )}
                          </Button>
                          <Button variant="outline" size="icon">
                            <SkipForward className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                          <Volume2 className="h-4 w-4" />
                          <Slider
                            value={[volume]}
                            min={0}
                            max={100}
                            step={1}
                            onValueChange={handleVolumeChange}
                            className="w-24"
                          />
                          <Button variant="outline" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="transcript">
                    <div className="bg-gray-50 rounded-md p-3 max-h-60 overflow-y-auto">
                      <p className="text-sm">
                        {realCall.transcript || 'Transcript not available for this call.'}
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="scorecard">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium">Score Breakdown</h4>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                          <div>
                            <p className="text-xs text-brand-dark/70">Clarity</p>
                            <div className="flex items-center gap-2">
                              <Progress value={realCall.categories?.clarity * 10} className="h-2" />
                              <span className="text-sm font-medium">{realCall.categories?.clarity}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-brand-dark/70">Confidence</p>
                            <div className="flex items-center gap-2">
                              <Progress value={realCall.categories?.confidence * 10} className="h-2" />
                              <span className="text-sm font-medium">{realCall.categories?.confidence}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-brand-dark/70">Objection Handling</p>
                            <div className="flex items-center gap-2">
                              <Progress value={realCall.categories?.handling * 10} className="h-2" />
                              <span className="text-sm font-medium">{realCall.categories?.handling}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-brand-dark/70">Vocabulary</p>
                            <div className="flex items-center gap-2">
                              <Progress value={realCall.categories?.vocabulary * 10} className="h-2" />
                              <span className="text-sm font-medium">{realCall.categories?.vocabulary}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium">Key Points</h4>
                        <div className="mt-2 space-y-2">
                          <div className="bg-green-50 p-2 rounded">
                            <p className="text-sm text-green-700">{realCall.topStrength}</p>
                          </div>
                          <div className="bg-amber-50 p-2 rounded">
                            <p className="text-sm text-amber-700">{realCall.topImprovement}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Practice Call Card */}
        <Card className={activeSide === 'practice' ? 'ring-2 ring-brand-blue ring-offset-2' : ''}>
          <CardHeader className="bg-brand-blue/10 flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-xl">Practice Session</CardTitle>
            <span className="text-sm text-brand-dark/70">{practiceCall.date}</span>
          </CardHeader>
          <CardContent className="p-4">
            <div>
              <div className="mb-4">
                <div className="text-xl font-semibold mb-2">{practiceCall.title}</div>
                <div className="text-brand-dark/70 text-sm">{practiceCall.duration} • Score: {practiceCall.score}/10</div>
              </div>
              
              <div className="space-y-4">
                <Tabs defaultValue="audio">
                  <TabsList className="w-full">
                    <TabsTrigger value="audio" className="flex-1">Audio</TabsTrigger>
                    <TabsTrigger value="transcript" className="flex-1">Transcript</TabsTrigger>
                    <TabsTrigger value="scorecard" className="flex-1">Scorecard</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="audio">
                    <div className="space-y-4">
                      <div className="pt-2">
                        <div className="flex justify-between text-xs text-brand-dark/70 mb-2">
                          <span>{formatTime(practiceCallSeconds)}</span>
                          <span>{practiceCall.duration}</span>
                        </div>
                        <Slider
                          value={[progress]}
                          min={0}
                          max={100}
                          step={1}
                          onValueChange={handleProgressChange}
                          className="my-1"
                        />
                        <div className="flex justify-center items-center gap-2 mt-4">
                          <Button variant="outline" size="icon">
                            <SkipBack className="h-4 w-4" />
                          </Button>
                          <Button 
                            onClick={togglePlay}
                            className="h-10 w-10 rounded-full bg-brand-blue"
                          >
                            {isPlaying ? (
                              <Pause className="h-5 w-5 text-white" />
                            ) : (
                              <Play className="h-5 w-5 text-white" />
                            )}
                          </Button>
                          <Button variant="outline" size="icon">
                            <SkipForward className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                          <Volume2 className="h-4 w-4" />
                          <Slider
                            value={[volume]}
                            min={0}
                            max={100}
                            step={1}
                            onValueChange={handleVolumeChange}
                            className="w-24"
                          />
                          <Button variant="outline" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="transcript">
                    <div className="bg-gray-50 rounded-md p-3 max-h-60 overflow-y-auto">
                      <p className="text-sm">
                        {practiceCall.transcript || 'Transcript not available for this practice session.'}
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="scorecard">
                    <div className="max-h-80 overflow-y-auto pr-2">
                      <DemoScorecard scoreData={practiceCall} />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="bg-brand-blue/5">
          <CardTitle className="text-xl flex items-center justify-between">
            <span>Comparison Analysis</span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-sm h-8" 
              onClick={toggleTranscript}
            >
              {transcriptExpanded ? (
                <>
                  <span>Hide Details</span>
                  <ChevronUp className="ml-1 h-4 w-4" />
                </>
              ) : (
                <>
                  <span>Show Details</span>
                  <ChevronDown className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-brand-dark/70 mb-1">Real Call Score</p>
                <div className="text-2xl font-bold text-brand-dark">{realCall.score}/10</div>
              </div>
              <div>
                <p className="text-sm text-brand-dark/70 mb-1">Practice Score</p>
                <div className="text-2xl font-bold text-brand-dark">{practiceCall.score}/10</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <h3 className="font-medium mb-2">Key Differences</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-green-600 font-bold">•</span>
                    <span>Your real call demonstrated better objection handling (+18%) than practice sessions</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>Your practice sessions show stronger closing techniques (-12% in real calls)</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <span className="text-green-600 font-bold">•</span>
                    <span>Better use of industry terminology in real calls (+23%)</span>
                  </li>
                </ul>
              </div>
            </div>
            
            {transcriptExpanded && (
              <div className="pt-3 border-t">
                <h3 className="font-medium mb-3">Detailed Comparison</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Speech Pattern Analysis</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-brand-dark/70">Speaking Rate</p>
                        <div className="flex items-center gap-2">
                          <div className="font-medium">Practice:</div>
                          <div className="text-sm">182 words/min</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="font-medium">Real:</div>
                          <div className="text-sm">165 words/min</div>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-brand-dark/70">Filler Words</p>
                        <div className="flex items-center gap-2">
                          <div className="font-medium">Practice:</div>
                          <div className="text-sm">8 instances</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="font-medium">Real:</div>
                          <div className="text-sm">12 instances</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">Content Analysis</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-brand-dark/70">Key Message Delivery</p>
                        <div className="flex items-center gap-2">
                          <div className="font-medium">Practice:</div>
                          <div className="text-sm">3 of 5 points</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="font-medium">Real:</div>
                          <div className="text-sm">4 of 5 points</div>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-brand-dark/70">Persuasion Techniques</p>
                        <div className="flex items-center gap-2">
                          <div className="font-medium">Practice:</div>
                          <div className="text-sm">Strong</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="font-medium">Real:</div>
                          <div className="text-sm">Average</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <h3 className="font-medium mb-2">AI Recommendations</h3>
              <p className="text-sm text-brand-dark/80">
                Your real calls show improvement in objection handling compared to practice sessions. 
                Continue practicing closing techniques, which are stronger in your practice sessions 
                but not translating fully to real calls. Consider focusing future practice on maintaining 
                consistent pace and reducing filler words when under pressure.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CallComparisonView;
