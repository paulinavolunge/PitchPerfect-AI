
import React from 'react';
import { MetaTags } from '@/components/shared/MetaTags';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Check, X } from 'lucide-react';

const Compare = () => {
  const comparisonData = [
    {
      feature: 'Real-time voice coaching',
      pitchPerfect: true,
      competitors: false,
      note: 'Immediate feedback as you speak'
    },
    {
      feature: 'Adaptive objection bank',
      pitchPerfect: true,
      competitors: 'limited',
      note: 'Competitors offer only scripted responses'
    },
    {
      feature: 'Progress analytics',
      pitchPerfect: true,
      competitors: false,
      note: 'Track improvement over time'
    },
    {
      feature: 'Custom scenario building',
      pitchPerfect: true,
      competitors: 'limited',
      note: 'Create scenarios specific to your product'
    },
    {
      feature: 'AI-powered feedback',
      pitchPerfect: true,
      competitors: true,
      note: 'In-depth analysis of your performance'
    }
  ];

  return (
    <>
      <MetaTags
        title="Compare PitchPerfect AI vs Competitors | Feature Comparison"
        description="See how PitchPerfect AI compares to other AI sales development tools. Compare features, capabilities, and benefits of our AI-powered sales training platform."
        keywords="sales training comparison, AI SDR tools, pitch practice software, sales coaching platforms"
        canonical="https://ac4815ee-3287-4227-becd-7ec7f5c2d508.lovableproject.com/compare"
      />
      
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow pt-24 pb-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-3xl font-bold mb-2 text-deep-navy">Why Choose PitchPerfect?</h1>
              <p className="text-deep-navy/80 mb-8">
                See how PitchPerfect compares to other AI sales development tools on the market.
              </p>
              
              <div className="bg-white rounded-lg shadow-lg p-6 mb-8 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-vibrant-blue-50">
                      <TableHead className="font-bold text-deep-navy">Feature</TableHead>
                      <TableHead className="font-bold text-primary-600">PitchPerfect AI</TableHead>
                      <TableHead className="font-bold text-deep-navy/70">Other AI SDR Tools</TableHead>
                      <TableHead className="font-bold text-deep-navy">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparisonData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{row.feature}</TableCell>
                        <TableCell>
                          {row.pitchPerfect ? (
                            <Check className="h-5 w-5 text-primary-600" />
                          ) : (
                            <X className="h-5 w-5 text-red-500" />
                          )}
                        </TableCell>
                        <TableCell>
                          {typeof row.competitors === 'boolean' ? (
                            row.competitors ? (
                              <Check className="h-5 w-5 text-primary-600" />
                            ) : (
                              <X className="h-5 w-5 text-red-500" />
                            )
                          ) : (
                            <span className="text-amber-500 flex items-center">
                              ⚠️ {row.competitors}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{row.note}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4 text-deep-navy">The PitchPerfect Advantage</h2>
                <p className="text-deep-navy/80 mb-4">
                  Our platform is built by sales professionals for sales professionals. We understand that 
                  effective sales training requires more than just scripted scenarios and basic feedback.
                </p>
                <p className="text-deep-navy/80 mb-4">
                  With PitchPerfect AI, you get adaptive learning that evolves with you, customizable 
                  scenarios that match your specific selling environment, and detailed analytics that 
                  help you track your progress over time.
                </p>
                <p className="font-medium text-primary-600">
                  Try our free demo today and experience the difference yourself!
                </p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Compare;
