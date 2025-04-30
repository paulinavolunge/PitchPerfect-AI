
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Hero = () => {
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
            Perfect Your <span className="text-brand-blue">Sales Pitch</span> with AI
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
                Start Practicing 
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
          <motion.div 
            whileHover={{ y: -5, boxShadow: "0 10px 25px rgba(74, 144, 230, 0.2)" }}
            transition={{ type: "spring", stiffness: 300 }}
            className="bg-white rounded-lg shadow-lg p-6 md:p-8 max-w-md mx-auto relative z-10"
          >
            <div className="bg-brand-blue/10 p-4 rounded-md mb-4 flex items-center gap-3">
              <div className="bg-brand-blue text-white p-2 rounded-md flex items-center justify-center">
                <motion.div 
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [1, 0.8, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                  className="w-5 h-5"
                />
              </div>
              <span className="font-medium">Recording your pitch...</span>
            </div>
            
            <div className="space-y-3">
              <motion.div 
                animate={{ 
                  width: ["60%", "75%", "60%"]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="h-2 bg-gray-200 rounded-full"
              />
              <motion.div 
                animate={{ 
                  width: ["100%", "90%", "100%"]
                }}
                transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
                className="h-2 bg-gray-200 rounded-full"
              />
              <motion.div 
                animate={{ 
                  width: ["75%", "85%", "75%"]
                }}
                transition={{ duration: 3.5, repeat: Infinity, delay: 0.3 }}
                className="h-2 bg-gray-200 rounded-full"
              />
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="mt-6 speech-bubble"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-brand-blue/20 text-brand-blue p-1 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4" />
                </div>
                <span className="font-medium text-sm">AI Feedback</span>
              </div>
              <p className="text-sm text-brand-dark/80">
                Try emphasizing the key benefits more and speaking 15% slower for better engagement.
              </p>
            </motion.div>
          </motion.div>
          
          <div className="absolute inset-0 bg-brand-blue opacity-10 rounded-lg -z-10 transform translate-x-4 translate-y-4"></div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
