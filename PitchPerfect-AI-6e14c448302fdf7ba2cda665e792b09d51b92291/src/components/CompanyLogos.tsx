import React from 'react';
import { Building, Briefcase, Users, Star } from 'lucide-react';

const CompanyLogos: React.FC = () => {
  const companies = [
    { name: "TechFlow Solutions", logo: "TF" },
    { name: "Growth Dynamics", logo: "GD" },
    { name: "Swift Enterprise", logo: "SE" },
    { name: "Nexus Corp", logo: "NC" },
    { name: "Future Tech", logo: "FT" },
    { name: "Innovate Solutions", logo: "IS" }
  ];

  return (
    <div className="py-12 bg-gradient-to-r from-primary-50 to-vibrant-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h3 className="text-lg font-semibold text-deep-navy mb-2">
            Trusted by Sales Teams at Leading Companies
          </h3>
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            Join 10,000+ sales professionals improving their pitch
          </p>
        </div>
        
        <div className="grid grid-cols-3 md:grid-cols-6 gap-8 items-center justify-items-center">
          {companies.map((company, index) => (
            <div key={index} className="flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity duration-300">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-vibrant-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                {company.logo}
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-medium text-deep-navy/80">{company.name}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            <span>Enterprise Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <span>Professional Grade</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Team Collaboration</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyLogos;