
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Search } from 'lucide-react';
import AISuggestionCard from '@/components/AISuggestionCard';

const Tips = () => {
  const salesTips = [
    {
      title: "Build rapport before pitching",
      description: "Find common ground or references before diving into your product pitch. People buy from those they like and trust.",
      type: "tip"
    },
    {
      title: "Problem-Solution Framework",
      description: "We noticed [problem] is causing [negative impact]. Our [product] addresses this by [key benefit], resulting in [positive outcome].",
      type: "script"
    },
    {
      title: "Use the 'Feel, Felt, Found' technique",
      description: "When handling objections: 'I understand how you feel. Others have felt the same way. What they found was...'",
      type: "tip"
    },
    {
      title: "The 60-Second Value Proposition",
      description: "For [target customer] who [statement of need or opportunity], our [product/service] is a [category] that [statement of key benefit]. Unlike [competing alternative], we [statement of primary differentiation].",
      type: "script"
    },
    {
      title: "Pause strategically after key points",
      description: "Strategic silence gives prospects time to process important information and signals confidence in your message.",
      type: "tip"
    },
    {
      title: "Use client-specific language",
      description: "Research your prospect's industry terminology before meetings and mirror their vocabulary during your pitch.",
      type: "tip"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-6 text-brand-dark">AI Sales Tips & Scripts</h1>
          
          <Card className="mb-8 border-brand-green/30">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="md:w-2/3">
                  <h2 className="text-xl font-medium mb-2 text-brand-dark">Personalized AI Recommendations</h2>
                  <p className="text-brand-dark/70 mb-4">
                    Get custom-tailored sales tips and script suggestions based on your industry, target audience, and improvement areas.
                  </p>
                  <Button className="btn-primary">Generate Personalized Tips</Button>
                </div>
                <div className="md:w-1/3 flex justify-center">
                  <div className="bg-brand-green/20 rounded-full p-6 w-24 h-24 flex items-center justify-center">
                    <div className="bg-brand-green text-white rounded-full p-2">
                      <div className="w-8 h-8" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="mb-8">
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search for tips or scripts..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-green"
              />
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="rounded-full text-sm" size="sm">All Tips</Button>
              <Button variant="outline" className="rounded-full text-sm" size="sm">Objection Handling</Button>
              <Button variant="outline" className="rounded-full text-sm" size="sm">Opening Lines</Button>
              <Button variant="outline" className="rounded-full text-sm" size="sm">Value Proposition</Button>
              <Button variant="outline" className="rounded-full text-sm" size="sm">Closing Techniques</Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {salesTips.map((tip, index) => (
              <AISuggestionCard
                key={index}
                title={tip.title}
                description={tip.description}
                type={tip.type as 'tip' | 'script'}
              />
            ))}
          </div>
          
          <div className="mt-8 text-center">
            <Button variant="outline">Load More Tips</Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Tips;
