
import React from 'react';

const TrustedBy: React.FC = () => {
  const companies = [
    {
      name: "TechCorp",
      logo: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=200&h=80&fit=crop&crop=center"
    },
    {
      name: "Sales Innovators", 
      logo: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=200&h=80&fit=crop&crop=center"
    },
    {
      name: "Growth Solutions",
      logo: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=200&h=80&fit=crop&crop=center"
    },
    {
      name: "Enterprise Plus", 
      logo: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=200&h=80&fit=crop&crop=center"
    },
    {
      name: "Future Tech",
      logo: "https://images.unsplash.com/photo-1483058712412-4245e9b90334?w=200&h=80&fit=crop&crop=center"
    }
  ];

  return (
    <div className="bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h3 className="text-lg font-semibold text-brand-dark/70 mb-6">
            Trusted by sales teams at leading companies
          </h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center justify-center">
          {companies.map((company, index) => (
            <div 
              key={index}
              className="flex items-center justify-center p-4 grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100"
            >
              <img 
                src={company.logo} 
                alt={`${company.name} logo`}
                className="h-8 md:h-10 w-auto object-contain"
              />
            </div>
          ))}
        </div>
        
        <div className="text-center mt-8">
          <p className="text-sm text-brand-dark/60">
            Join 500+ sales teams who trust PitchPerfect AI to improve their performance
          </p>
        </div>
      </div>
    </div>
  );
};

export default TrustedBy;
