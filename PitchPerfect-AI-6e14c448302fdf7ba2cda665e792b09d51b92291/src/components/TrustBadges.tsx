import React from 'react';
import { Shield, Lock, CheckCircle, Star, Award, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TrustBadgesProps {
  variant?: 'horizontal' | 'vertical' | 'compact';
  showText?: boolean;
  className?: string;
}

const TrustBadges: React.FC<TrustBadgesProps> = ({ 
  variant = 'horizontal', 
  showText = true,
  className = ''
}) => {
  const badges = [
    {
      icon: <Shield className="h-5 w-5 text-green-600" />,
      text: "SSL Secured",
      subtext: "256-bit encryption"
    },
    {
      icon: <Lock className="h-5 w-5 text-blue-600" />,
      text: "Privacy Protected",
      subtext: "GDPR compliant"
    },
    {
      icon: <CheckCircle className="h-5 w-5 text-primary-600" />,
      text: "Verified Reviews",
      subtext: "Real user feedback"
    },
    {
      icon: <Star className="h-5 w-5 text-yellow-500" />,
      text: "4.9/5 Rating",
      subtext: "Based on 500+ reviews"
    },
    {
      icon: <Award className="h-5 w-5 text-purple-600" />,
      text: "Industry Leader",
      subtext: "AI sales training"
    },
    {
      icon: <Users className="h-5 w-5 text-teal-600" />,
      text: "10,000+ Users",
      subtext: "Trusted worldwide"
    }
  ];

  const compactBadges = badges.slice(0, 3);
  const displayBadges = variant === 'compact' ? compactBadges : badges;

  if (variant === 'vertical') {
    return (
      <div className={`space-y-3 ${className}`}>
        {displayBadges.map((badge, index) => (
          <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm border">
            {badge.icon}
            {showText && (
              <div>
                <p className="font-medium text-sm text-deep-navy">{badge.text}</p>
                <p className="text-xs text-muted-foreground">{badge.subtext}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center justify-center gap-4 ${className}`}>
        {displayBadges.map((badge, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            {badge.icon}
            {showText && <span className="font-medium text-deep-navy">{badge.text}</span>}
          </div>
        ))}
      </div>
    );
  }

  // Horizontal variant (default)
  return (
    <div className={`bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 ${className}`}>
      <div className="text-center mb-4">
        <h3 className="font-semibold text-deep-navy mb-1">Trusted & Secure</h3>
        <p className="text-sm text-muted-foreground">Your data and privacy are our top priority</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {displayBadges.map((badge, index) => (
          <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
            {badge.icon}
            {showText && (
              <div>
                <p className="font-medium text-sm text-deep-navy">{badge.text}</p>
                <p className="text-xs text-muted-foreground">{badge.subtext}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrustBadges;