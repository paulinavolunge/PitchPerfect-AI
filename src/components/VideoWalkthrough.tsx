import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { trackEvent } from '@/utils/analytics';
import videoPlaceholder from '@/assets/video-placeholder-optimized.webp';

const VideoWalkthrough: React.FC = () => {
  const navigate = useNavigate();
  const [videoError, setVideoError] = React.useState(false);

  const features = [
    { title: "Voice Practice", description: "See how AI analyzes vocal tone and pacing" },
    { title: "Real-time Feedback", description: "Watch instant scoring and suggestions appear" },
    { title: "Progress Tracking", description: "View detailed analytics and improvement charts" },
  ];

  const handleVideoError = () => {
    setVideoError(true);
  };

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
              <Card className="overflow-hidden shadow-2xl border-2 border-primary-100 relative">
                <div className="relative bg-black aspect-video w-full overflow-hidden"
                     style={{ position: 'relative', zIndex: 1 }}>
                  {!videoError ? (
                    <>
                      {/* Local video as primary, YouTube as fallback */}
                      <video
                        className="absolute inset-0 w-full h-full object-cover"
                        autoPlay
                        muted
                        loop
                        playsInline
                        controls
                        onError={handleVideoError}
                        aria-label="PitchPerfect AI Demo Video - Shows how the platform works"
                        title="PitchPerfect AI Demo Video"
                      >
                        <source src="/videos/final_combined_video.mp4" type="video/mp4" />
                        <p className="text-white p-4">
                          Your browser doesn't support video playback.
                        </p>
                      </video>
                    </>
                  ) : (
                    /* Fallback content when video fails to load */
                    <div className="absolute inset-0 w-full h-full">
                      <img 
                        src={videoPlaceholder}
                        alt="PitchPerfect AI Demo Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="text-center text-white p-8">
                          <Play className="h-16 w-16 mx-auto mb-4 opacity-80" />
                          <h3 className="text-xl font-semibold mb-2">Demo Available</h3>
                          <p className="text-sm opacity-90 mb-4">Experience our AI-powered sales training platform</p>
                          <div className="space-y-2">
                            <Button 
                              onClick={() => navigate('/demo')}
                              variant="secondary"
                              size="sm"
                              className="w-full"
                            >
                              Try Interactive Demo
                            </Button>
                            <Button 
                              onClick={() => navigate('/signup')}
                              variant="outline"
                              size="sm"
                              className="w-full border-white/20 text-white hover:bg-white/10"
                            >
                              Start Free Trial
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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
                  onClick={() => {
                    trackEvent('cta_click', { button: 'try_demo', location: 'video_section' });
                    navigate('/demo');
                  }}
                  className="w-full bg-primary-600 hover:bg-primary-700"
                >
                  Try Interactive Demo
                  <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
                </Button>
                <Button 
                  onClick={() => {
                    trackEvent('cta_click', { button: 'start_trial', location: 'video_section' });
                    navigate('/signup');
                  }}
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