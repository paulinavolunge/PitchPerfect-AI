
import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import VideoPlayer from '@/components/VideoPlayer';

const Hero = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Ensure the video plays automatically when loaded
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.log('Auto-play was prevented:', error);
      });
    }
  }, []);

  return (
    <section className="pt-24 pb-20 bg-gradient-to-b from-brand-blue/10 to-white overflow-hidden">
      <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:w-1/2 space-y-6 mb-10 lg:mb-0"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-brand-dark leading-tight">
            Perfect your pitch <span className="text-brand-blue">with AI—live.</span>
          </h1>
          <p className="text-xl text-brand-dark/80 max-w-xl">
            Train, practice, and refine your sales pitches with real-time voice feedback and personalized AI coaching.
          </p>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex flex-wrap gap-4"
          >
            <a href="#demo-sandbox">
              <Button className="btn-primary flex items-center gap-2 group">
                Try free 
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
              </Button>
            </a>
            <Link to="/subscription">
              <Button variant="outline" className="btn-secondary">
                Learn More
              </Button>
            </Link>
          </motion.div>
          <p className="text-sm text-brand-dark/60">
            Trusted by 10,000+ sales professionals from leading companies
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="lg:w-1/2 relative"
        >
          <VideoPlayer 
            posterSrc="/lovable-uploads/5b9309ea-3b10-4401-9c33-7d84a6e1fa68.png"
            videoSrc="/demo-video.mp4"
            fallbackSrc="/lovable-uploads/5b9309ea-3b10-4401-9c33-7d84a6e1fa68.png"
            className="max-w-lg mx-auto shadow-lg"
          />
          
          <div className="absolute inset-0 bg-brand-blue opacity-10 rounded-lg -z-10 transform translate-x-4 translate-y-4"></div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
