
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileAudio, Play, Download, Info, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// Sample data for demonstration purposes
const sampleCalls = [
  {
    id: 'call-1',
    title: 'Product Demo - Enterprise Client',
    date: '2025-04-29',
    duration: '12:47',
    score: 8.2,
    topStrength: 'Effective handling of technical questions',
    topImprovement: 'Could improve closing techniques',
    transcript: 'Sample transcript for the first call...',
    categories: {
      clarity: 8.5,
      confidence: 8.2,
      handling: 7.8,
      vocabulary: 8.4
    }
  },
  {
    id: 'call-2',
    title: 'Discovery Call - Healthcare Sector',
    date: '2025-04-25',
    duration: '18:23',
    score: 7.6,
    topStrength: 'Great rapport building in the introduction',
    topImprovement: 'Missed opportunity for upselling',
    transcript: 'Sample transcript for the second call...',
    categories: {
      clarity: 7.8,
      confidence: 7.5,
      handling: 7.2,
      vocabulary: 7.9
    }
  },
  {
    id: 'call-3',
    title: 'Follow-up Demo - SMB Client',
    date: '2025-04-20',
    duration: '9:05',
    score: 6.9,
    topStrength: 'Clear explanation of pricing structure',
    topImprovement: 'Too much technical jargon for audience',
    transcript: 'Sample transcript for the third call...',
    categories: {
      clarity: 6.8,
      confidence: 7.2,
      handling: 6.5,
      vocabulary: 7.1
    }
  }
];

interface RecentCallsProps {
  onSelectCall: (call: Record<string, unknown>) => void;
  selectedCall: Record<string, unknown> | null;
}

const RecentCalls: React.FC<RecentCallsProps> = ({ onSelectCall, selectedCall }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-amber-600';
    return 'text-red-600';
  };
  
  return (
    <div className="space-y-4">
      {sampleCalls.length > 0 ? (
        sampleCalls.map((call) => (
          <Card 
            key={call.id}
            className={cn(
              "transition-all", 
              selectedCall?.id === call.id 
                ? "border-brand-blue" 
                : "hover:border-brand-blue/50"
            )}
            onClick={() => onSelectCall(call)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex rounded-full bg-brand-blue/10 p-2">
                    <FileAudio className="h-5 w-5 text-brand-blue" />
                  </div>
                  <div>
                    <h3 className="font-medium">{call.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-brand-dark/70">
                      <span>{formatDate(call.date)}</span>
                      <span>•</span>
                      <span>{call.duration}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className={`text-xl font-bold ${getScoreColor(call.score)}`}>
                    {call.score}
                  </div>
                  
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={(e) => {
                      e.stopPropagation();
                      // Play audio logic would go here
                    }}>
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={(e) => {
                      e.stopPropagation();
                      // Download audio logic would go here
                    }}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {selectedCall?.id === call.id && (
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-1 flex items-center gap-2">
                        <Badge variant="outline" className="bg-green-50">Strength</Badge>
                      </p>
                      <p className="text-sm text-brand-dark/80">{call.topStrength}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1 flex items-center gap-2">
                        <Badge variant="outline" className="bg-amber-50">Improvement</Badge>
                      </p>
                      <p className="text-sm text-brand-dark/80">{call.topImprovement}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="text-center p-8 border border-dashed rounded-lg">
          <FileAudio className="h-12 w-12 text-brand-dark/30 mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">No call recordings yet</p>
          <p className="text-brand-dark/70 mb-4">Upload your first call to see analytics and improve your sales pitch</p>
          <Button variant="outline">Upload a Call</Button>
        </div>
      )}
    </div>
  );
};

export default RecentCalls;
