
import React from 'react';
import { ArrowDown } from 'lucide-react';

const steps = [
  {
    number: "01",
    title: "Record Your Pitch",
    description: "Use our simple voice recorder to capture your sales pitch in real-time."
  },
  {
    number: "02",
    title: "Get AI Analysis",
    description: "Our AI analyzes your pitch for tone, pacing, clarity, and persuasiveness."
  },
  {
    number: "03",
    title: "Receive Feedback",
    description: "Get detailed feedback with specific improvement suggestions."
  },
  {
    number: "04",
    title: "Practice & Improve",
    description: "Apply the feedback, practice again, and track your improvement over time."
  }
];

const HowItWorks = () => {
  return (
    <section className="py-20 bg-brand-blue/20">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4 text-brand-dark">How It Works</h2>
          <p className="text-lg text-brand-dark/70">
            A simple four-step process to transform your sales pitch capabilities
          </p>
        </div>
        
        <div className="flex flex-col items-center max-w-md mx-auto">
          {steps.map((step, index) => (
            <div key={index} className="relative w-full">
              <div className="flex flex-row items-center gap-6 mb-8">
                <div className="bg-white rounded-full h-16 w-16 flex items-center justify-center shadow-md border border-gray-100">
                  <span className="text-xl font-bold text-brand-green">{step.number}</span>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xl font-medium mb-2 text-brand-dark">{step.title}</h3>
                  <p className="text-brand-dark/70">{step.description}</p>
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <div className="flex justify-center w-full my-2">
                  <ArrowDown className="text-brand-green" size={24} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
