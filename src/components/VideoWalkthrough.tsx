import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const VideoWalkthrough: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    { title: "Voice Practice", description: "See how AI analyzes vocal tone and pacing" },
    { title: "Real-time Feedback", description: "Watch instant scoring and suggestions appear" },
    { title: "Progress Tracking", description: "View detailed analytics and improvement charts" },
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-primary-50 to-vibrant-blue-50" aria-labelledby="video-walkthrough-heading">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary-100 text-primary-700 border-primary-200" aria-label="Video demonstration">
            <Play className="h-4 w-4 mr-2" aria-hidden="true" />
            Video Walkthrough
          </Badge>
          <h2 id="video-walkthrough-heading" className="text-3xl md:text-4xl font-bold text-deep-navy mb-4">
            See PitchPerfect AI in Action
          </h2>
          <p className="text-deep-navy/70 max-w-2xl mx-auto text-lg">
            Watch a complete demonstration of our AI-powered sales training platform in under 3 minutes.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            {/* Video Player */}
            <div className="lg:col-span-2">
              <Card className="overflow-hidden shadow-2xl border-2 border-primary-100">
                <div className="relative bg-black aspect-video">
                  {/* YouTube video embed */}
                  <iframe
                    className="w-full h-full"
                    src="https://www.youtube.com/embed/S33kpr7-ls0?rel=0&modestbranding=1&controls=1&showinfo=0"
                    title="PitchPerfect AI product demonstration video"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </Card>
            </div>

            {/* Feature List */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-deep-navy mb-4">
                What You'll See:
              </h3>
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-primary-100 shadow-sm"
                >
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-primary-600 font-semibold text-sm">{index + 1}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-deep-navy mb-1">{feature.title}</h4>
                    <p className="text-deep-navy/70 text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
              
              <div className="pt-4 space-y-3">
                <Button 
                  onClick={() => navigate('/demo')}
                  className="w-full bg-primary-600 hover:bg-primary-700"
                >
                  Try Interactive Demo
                  <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
                </Button>
                <Button 
                  onClick={() => navigate('/signup')}
                  variant="outline"
                  className="w-full border-primary-200 text-primary-700 hover:bg-primary-50"
                >
                  Start Free Trial
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VideoWalkthrough;