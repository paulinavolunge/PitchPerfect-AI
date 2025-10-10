import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface MobileFeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
  className?: string;
}

const MobileFeatureCard: React.FC<MobileFeatureCardProps> = ({
  icon,
  title,
  description,
  onClick,
  className = ''
}) => {
  return (
    <Card className={`hover:shadow-lg transition-all duration-300 ${className}`}>
      <CardHeader className="text-center pb-3">
        <div className="flex justify-center mb-3">
          <div className="p-3 bg-gradient-to-br from-primary-100 to-vibrant-blue-100 rounded-xl">
            {icon}
          </div>
        </div>
        <CardTitle className="text-lg font-semibold text-deep-navy">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-center pt-0">
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          {description}
        </p>
        {onClick && (
          <Button
            variant="outline"
            onClick={onClick}
            className="w-full group hover:bg-primary-50 hover:border-primary-200"
          >
            Try Now
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default MobileFeatureCard;