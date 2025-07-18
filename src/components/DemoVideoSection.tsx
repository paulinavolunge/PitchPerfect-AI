import React from 'react';
import { Button } from '@/components/ui/button';

const DemoVideoSection = () => {
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
          <div className="relative rounded-xl overflow-hidden shadow-2xl bg-black">
            <video
              className="w-full h-auto"
              autoPlay
              muted
              loop
              playsInline
              controls
              aria-label="PitchPerfect AI Demo Video - Shows how the platform works"
              title="PitchPerfect AI Demo Video"
            >
              <source src="/videos/final_combined_video.mp4" type="video/mp4" />
              <p className="text-white p-4">
                Your browser doesn't support video playback. 
                Please download the video to watch the demo.
              </p>
            </video>
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