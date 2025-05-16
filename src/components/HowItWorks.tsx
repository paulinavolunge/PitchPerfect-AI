
import React from 'react';
import { ArrowDown, Mic, BarChart, RefreshCw, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import ParallaxSection from './animations/ParallaxSection';

const steps = [
  {
    number: "01",
    title: "Record Your Pitch",
    description: "Use our simple voice recorder to capture your sales pitch in real-time.",
    icon: Mic,
    color: "#4A90E6"
  },
  {
    number: "02",
    title: "Get AI Analysis",
    description: "Our AI analyzes your pitch for tone, pacing, clarity, and persuasiveness.",
    icon: BarChart,
    color: "#008D95"
  },
  {
    number: "03",
    title: "Receive Feedback",
    description: "Get detailed feedback with specific improvement suggestions.",
    icon: Sparkles,
    color: "#F97316"
  },
  {
    number: "04",
    title: "Practice & Improve",
    description: "Apply the feedback, practice again, and track your improvement over time.",
    icon: RefreshCw,
    color: "#9b87f5"
  }
];

// Animation variants for staggered children
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const HowItWorks = () => {
  return (
    <ParallaxSection className="py-20" overlayColor="#f8fafc">
      <div className="container mx-auto px-4">
        <motion.div 
          className="text-center max-w-2xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold mb-4 text-brand-dark">How It Works</h2>
          <p className="text-lg text-brand-dark/70">
            A simple four-step process to transform your sales pitch capabilities
          </p>
        </motion.div>
        
        <motion.div 
          className="flex flex-col items-center max-w-md mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
        >
          {steps.map((step, index) => {
            const Icon = step.icon;
            
            return (
              <motion.div key={index} className="relative w-full" variants={itemVariants}>
                <div className="flex flex-row items-center gap-6 mb-8">
                  <div className="relative">
                    <div 
                      className="bg-white rounded-full h-16 w-16 flex items-center justify-center shadow-md border border-gray-100 transition-all duration-300 hover:shadow-lg hover:scale-110"
                      style={{ backgroundColor: `${step.color}10` }}
                    >
                      <Icon className="text-xl" style={{ color: step.color }} size={24} />
                      <div className="absolute -top-2 -right-2 bg-white rounded-full h-6 w-6 flex items-center justify-center shadow-sm border border-gray-100">
                        <span className="text-xs font-bold text-brand-dark">{step.number}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-medium mb-2 text-brand-dark">{step.title}</h3>
                    <p className="text-brand-dark/70">{step.description}</p>
                  </div>
                </div>
                
                {index < steps.length - 1 && (
                  <motion.div 
                    className="flex justify-center w-full my-2"
                    animate={{ y: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  >
                    <ArrowDown className="text-brand-green" size={24} />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </ParallaxSection>
  );
};

export default HowItWorks;
