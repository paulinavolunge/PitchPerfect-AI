
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

const features = [
  {
    icon: "🎯",
    title: "Real-time Feedback",
    description: "Get instant feedback on your delivery, pacing, clarity, and engagement levels while you speak."
  },
  {
    icon: "📊",
    title: "Progress Tracking",
    description: "Monitor your improvement over time with detailed analytics and performance metrics."
  },
  {
    icon: "🤖",
    title: "AI Coaching",
    description: "Receive personalized coaching tips from our advanced AI system trained on top-performing sales pitches."
  },
  {
    icon: "🎭",
    title: "Scenario Practice",
    description: "Practice handling various customer scenarios and objections in a safe, simulated environment."
  },
  {
    icon: "📚",
    title: "Pitch Library",
    description: "Access a growing library of effective pitch templates and examples across different industries."
  },
  {
    icon: "🔄",
    title: "Unlimited Practice",
    description: "Practice as much as you need with unlimited recording sessions and feedback loops."
  },
];

const Features = () => {
  const isMobile = useIsMobile();
  
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-4 text-brand-dark">Elevate Your Sales Game</h2>
          <p className="text-lg text-brand-dark/70 mb-10">
            PitchPerfect AI offers powerful features to help you master your sales techniques and close more deals.
          </p>
          
          <Link to="/signup" className="inline-block mb-12">
            <Button 
              className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-medium shadow-lg hover:shadow-xl flex items-center gap-2 group px-5 py-6 h-auto text-base md:text-lg"
            >
              Try Free Now <Rocket className="group-hover:translate-x-1 transition-transform" size={isMobile ? 20 : 18} />
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="card-hover border border-gray-100">
              <CardContent className="p-6">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-medium mb-2 text-brand-dark">{feature.title}</h3>
                <p className="text-brand-dark/70">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Link to="/signup">
            <Button 
              className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-medium shadow-lg hover:shadow-xl flex items-center gap-2 group px-5 py-6 h-auto text-base md:text-lg"
            >
              Start Your Free Trial <Rocket className="group-hover:translate-x-1 transition-transform" size={isMobile ? 20 : 18} />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Features;
