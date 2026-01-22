
import React from 'react';
import { TrendingUp, Users, Clock, Target } from 'lucide-react';

const ValueProposition: React.FC = () => {
  const benefits = [
    {
      icon: TrendingUp,
      title: "Proven ROI",
      description: "Users see 40% improvement in sales performance within 30 days",
      stat: "40% boost"
    },
    {
      icon: Clock,
      title: "Time Efficient",
      description: "Practice anytime, anywhere. Just 15 minutes daily builds confidence",
      stat: "15 min/day"
    },
    {
      icon: Target,
      title: "Real Results",
      description: "AI-powered feedback helps you close 25% more deals",
      stat: "25% more deals"
    },
    {
      icon: Users,
      title: "Team Ready",
      description: "Scale training across your entire sales organization",
      stat: "Unlimited users"
    }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white py-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-brand-dark mb-4">
            Why Sales Teams Choose PitchPerfect AI
          </h2>
          <p className="text-lg text-brand-dark/70 max-w-2xl mx-auto">
            More than just practice – it's proven performance improvement that drives real business results
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <div 
                key={index}
                className="text-center bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-blue/10 rounded-lg mb-4">
                  <IconComponent className="h-6 w-6 text-brand-blue" />
                </div>
                <div className="text-2xl font-bold text-brand-green mb-2">{benefit.stat}</div>
                <h3 className="font-semibold text-brand-dark mb-2">{benefit.title}</h3>
                <p className="text-sm text-brand-dark/70">{benefit.description}</p>
              </div>
            );
          })}
        </div>

        {/* ROI Calculator Section */}
        <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-brand-dark mb-4">Calculate Your ROI</h3>
            <p className="text-brand-dark/70">See how much PitchPerfect AI can save your organization</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-brand-dark mb-2">Average Deal Size</div>
              <div className="text-3xl font-bold text-brand-blue">$15,000</div>
              <div className="text-sm text-brand-dark/70 mt-1">Typical B2B deal value</div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-brand-dark mb-2">Performance Boost</div>
              <div className="text-3xl font-bold text-brand-green">+25%</div>
              <div className="text-sm text-brand-dark/70 mt-1">More deals closed</div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-brand-dark mb-2">Monthly ROI</div>
              <div className="text-3xl font-bold text-purple-600">$3,750</div>
              <div className="text-sm text-brand-dark/70 mt-1">Per sales rep</div>
            </div>
          </div>
          
          <div className="text-center mt-6">
            <p className="text-sm text-brand-dark/70">
              *Based on 1 additional deal closed per month per rep using Professional plan
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValueProposition;
