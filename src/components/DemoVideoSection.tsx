import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

const DemoVideoSection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVideoClick = () => {
    togglePlay();
  };

  return (
    <section className="py-12 bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">See PitchPerfect AI in Action</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Watch how our AI-powered platform helps sales professionals master objection handling 
            and improve their pitch delivery in real-time.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="relative group rounded-xl overflow-hidden shadow-2xl bg-black">
            <video
              ref={videoRef}
              className="w-full h-auto cursor-pointer"
              autoPlay
              muted
              loop
              playsInline
              onClick={handleVideoClick}
              aria-label="PitchPerfect AI Demo Video - Shows how the platform works"
              title="PitchPerfect AI Demo Video"
            >
              <source src="/videos/final_combined_video.mp4" type="video/mp4" />
              <p className="text-white p-4">
                Your browser doesn't support video playback. 
                Please download the video to watch the demo.
              </p>
            </video>
            
            {/* Video Controls Overlay */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={togglePlay}
                  className="bg-black/50 text-white hover:bg-black/70"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={toggleMute}
                  className="bg-black/50 text-white hover:bg-black/70"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              </div>
              
              <div className="text-white text-sm bg-black/50 px-2 py-1 rounded">
                Click to {isPlaying ? 'pause' : 'play'}
              </div>
            </div>
          </div>
          
          <div className="text-center mt-6">
            <Button 
              size="lg" 
              onClick={() => window.open('/demo', '_blank')}
              className="bg-primary hover:bg-primary/90"
            >
              Try Interactive Demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DemoVideoSection;