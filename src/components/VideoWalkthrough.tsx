import React from 'react';
import { Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const VideoWalkthrough = ({ isMobile }: { isMobile: boolean }) => {
  return (
    <section className="bg-gradient-to-br from-primary-50 to-primary-100 py-20">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-deep-navy mb-4">See PitchPerfect AI in Action</h2>
        <p className="text-deep-navy/70 mb-10 text-base md:text-lg max-w-2xl mx-auto">
          Watch a quick walkthrough of how our AI roleplay and feedback system works to level up your cold call game.
        </p>

        <div className="rounded-xl overflow-hidden max-w-4xl mx-auto shadow-lg">
          <iframe
            className="w-full aspect-video"
            src="https://www.youtube.com/embed/INSERT_YOUR_VIDEO_ID"
            title="PitchPerfect AI Walkthrough"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        <div className="mt-10">
          <Link to="/signup">
            <Button
              className="bg-primary-600 hover:bg-primary-700 text-white font-medium shadow-md hover:shadow-lg flex items-center gap-2 px-6 py-4 rounded-xl text-base md:text-lg"
              aria-label="Start your free trial"
            >
              Try Free Now <Rocket className="ml-2" size={isMobile ? 20 : 18} aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default VideoWalkthrough;