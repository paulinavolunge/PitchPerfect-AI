
import React, { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

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
            <Link to="/practice">
              <Button className="btn-primary flex items-center gap-2 group">
                Try free 
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
              </Button>
            </Link>
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
          <div className="aspect-w-16 aspect-h-9 max-w-lg mx-auto rounded-lg shadow-lg overflow-hidden">
            <picture>
              {/* Fallback image for browsers that don't support video or when video fails to load */}
              <source srcSet="/lovable-uploads/5b9309ea-3b10-4401-9c33-7d84a6e1fa68.png" type="image/png" media="(max-width: 768px)" />
              
              {/* Video element (GIF alternative for better performance) */}
              <video 
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay 
                muted 
                loop 
                playsInline
                loading="eager"
                poster="/lovable-uploads/5b9309ea-3b10-4401-9c33-7d84a6e1fa68.png"
              >
                {/* Note: You would need to upload a video file and reference it here */}
                <source src="/demo-video.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </picture>
            
            {/* Video overlay with demo content */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent flex flex-col justify-end p-4">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg mb-3 text-sm">
                <p className="font-medium text-brand-blue">Real-time Transcript</p>
                <p className="text-gray-700">"...our solution increased customer retention by 35% in just three months..."</p>
              </div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-brand-blue">AI Performance Score</p>
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">85/100</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs">
                      <span>Clarity</span>
                      <span>90%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-brand-blue h-1.5 rounded-full" style={{ width: "90%" }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs">
                      <span>Engagement</span>
                      <span>80%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-brand-blue h-1.5 rounded-full" style={{ width: "80%" }}></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
          
          <div className="absolute inset-0 bg-brand-blue opacity-10 rounded-lg -z-10 transform translate-x-4 translate-y-4"></div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
