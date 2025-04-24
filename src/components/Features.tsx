
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

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
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-4 text-brand-dark">Elevate Your Sales Game</h2>
          <p className="text-lg text-brand-dark/70">
            PitchPerfect AI offers powerful features to help you master your sales techniques and close more deals.
          </p>
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
      </div>
    </section>
  );
};

export default Features;
