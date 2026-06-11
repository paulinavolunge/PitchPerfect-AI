
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Search, Bot } from 'lucide-react';
import AISuggestionCard from '@/components/AISuggestionCard';
import { useToast } from '@/hooks/use-toast';
import AIDisclosure from '@/components/AIDisclosure';

const Tips = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Tips');
  const [displayedTips, setDisplayedTips] = useState(6);
  const [appliedTips, setAppliedTips] = useState<{title: string, description: string}[]>([]);
  const [activeScripts, setActiveScripts] = useState<{title: string, description: string}[]>([]);

  useEffect(() => {
    try {
      const savedTips = JSON.parse(localStorage.getItem('appliedSalesTips') || '[]');
      // migrate legacy format (array of strings)
      const normalized = savedTips.map((t: any) =>
        typeof t === 'string' ? { title: t, description: '' } : t
      );
      setAppliedTips(normalized);
      const savedScripts = JSON.parse(localStorage.getItem('activeSalesScripts') || '[]');
      setActiveScripts(savedScripts);
    } catch (e) {
      console.error('Failed to load saved tips/scripts', e);
    }
  }, []);

  const handleRemoveTip = (title: string) => {
    const updated = appliedTips.filter(t => t.title !== title);
    setAppliedTips(updated);
    localStorage.setItem('appliedSalesTips', JSON.stringify(updated));
  };

  const handleRemoveScript = (title: string) => {
    const updated = activeScripts.filter(s => s.title !== title);
    setActiveScripts(updated);
    localStorage.setItem('activeSalesScripts', JSON.stringify(updated));
  };

  const allSalesTips = [
    {
      title: "Build rapport before pitching",
      description: "Find common ground or references before diving into your product pitch. People buy from those they like and trust.",
      type: "tip",
      category: "Opening Lines"
    },
    {
      title: "Problem-Solution Framework",
      description: "We noticed [problem] is causing [negative impact]. Our [product] addresses this by [key benefit], resulting in [positive outcome].",
      type: "script",
      category: "Value Proposition"
    },
    {
      title: "Use the 'Feel, Felt, Found' technique",
      description: "When handling objections: 'I understand how you feel. Others have felt the same way. What they found was...'",
      type: "tip",
      category: "Objection Handling"
    },
    {
      title: "The 60-Second Value Proposition",
      description: "For [target customer] who [statement of need or opportunity], our [product/service] is a [category] that [statement of key benefit]. Unlike [competing alternative], we [statement of primary differentiation].",
      type: "script",
      category: "Value Proposition"
    },
    {
      title: "Pause strategically after key points",
      description: "Strategic silence gives prospects time to process important information and signals confidence in your message.",
      type: "tip",
      category: "Closing Techniques"
    },
    {
      title: "Use client-specific language",
      description: "Research your prospect's industry terminology before meetings and mirror their vocabulary during your pitch.",
      type: "tip",
      category: "Opening Lines"
    },
    {
      title: "Ask open-ended questions",
      description: "Use questions that require more than a yes/no answer to better understand customer needs and challenges.",
      type: "tip",
      category: "Opening Lines"
    },
    {
      title: "The SPIN selling technique",
      description: "Situation → Problem → Implication → Need-payoff. Guide prospects through these four steps to uncover real needs.",
      type: "script",
      category: "Closing Techniques"
    },
    {
      title: "Use social proof effectively",
      description: "Reference similar customers who've achieved success with your product: 'Companies like yours have seen a 30% increase in...'",
      type: "tip",
      category: "Objection Handling"
    },
    {
      title: "The contrast principle",
      description: "Show the gap between where they are and where they could be with your solution to create urgency.",
      type: "tip",
      category: "Closing Techniques"
    }
  ];

  const filterCategories = ["All Tips", "Objection Handling", "Opening Lines", "Value Proposition", "Closing Techniques"];

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterClick = (filter: string) => {
    setActiveFilter(filter);
    toast({
      title: "Filter Applied",
      description: `Showing ${filter} sales tips`,
    });
  };

  const handleLoadMore = () => {
    setDisplayedTips(prev => Math.min(prev + 3, allSalesTips.length));
    
    if (displayedTips + 3 >= allSalesTips.length) {
      toast({
        title: "No More Tips Available",
        description: "You've reached the end of our tips collection",
      });
    } else {
      toast({
        title: "Loading More Tips",
        description: "Loading additional sales tips",
      });
    }
  };

  const handleGeneratePersonalizedTips = () => {
    toast({
      title: "Generating Personalized Tips",
      description: "AI is analyzing your profile to create custom recommendations",
    });
  };

  const handleApplyTipOrScript = (title: string, description: string, type: 'tip' | 'script') => {
    if (type === 'tip') {
      const newTip = { title, description };
      setAppliedTips(prev => {
        if (prev.some(t => t.title === title)) return prev;
        const updated = [...prev, newTip];
        localStorage.setItem('appliedSalesTips', JSON.stringify(updated));
        return updated;
      });
      toast({
        title: "Tip Applied",
        description: "Added to 'Your Applied Tips'. It will guide your next round.",
      });
    } else {
      // Handle script application
      const newScript = { title, description };
      setActiveScripts(prev => {
        // Don't add duplicates
        if (prev.some(script => script.title === title)) {
          return prev;
        }
        return [...prev, newScript];
      });
      
      // Save to localStorage
      const savedScripts = JSON.parse(localStorage.getItem('activeSalesScripts') || '[]');
      if (!savedScripts.some((script: any) => script.title === title)) {
        localStorage.setItem('activeSalesScripts', JSON.stringify([...savedScripts, newScript]));
      }
      
      // Copy script to clipboard for immediate use
      navigator.clipboard.writeText(description).catch(err => 
        console.error("Failed to copy script to clipboard:", err)
      );
      
      toast({
        title: "Script Ready to Use",
        description: "Script has been copied to clipboard and saved to your library",
      });
    }
  };

  // Filter tips based on search query and active filter - modified to be case insensitive
  const filteredTips = allSalesTips.filter(tip => {
    const matchesSearch = searchQuery === '' || 
                          tip.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tip.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = activeFilter === "All Tips" || tip.category === activeFilter;
    
    return matchesSearch && matchesFilter;
  });

  // Get the tips to display (limited by displayedTips)
  const salesTips = filteredTips.slice(0, displayedTips);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2 text-brand-dark">AI Sales Tips & Scripts</h1>
          
          <AIDisclosure 
            variant="compact"
            description="This page contains AI-generated sales tips and scripts. Review and adapt them to your specific needs."
            className="mb-4"
          />
          
          {appliedTips.length > 0 && (
            <Card className="mb-8 border-brand-blue/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-medium text-brand-dark">Your Applied Tips</h2>
                  <span className="text-xs text-brand-dark/60">{appliedTips.length} active</span>
                </div>
                <div className="space-y-3">
                  {appliedTips.map((tip, index) => (
                    <div key={index} className="p-3 bg-brand-blue/5 border border-brand-blue/20 rounded-lg flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-brand-dark">{tip.title}</h3>
                        {tip.description && (
                          <p className="text-sm text-brand-dark/70 mt-1">{tip.description}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-brand-dark/60 hover:text-destructive shrink-0"
                        onClick={() => handleRemoveTip(tip.title)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-brand-dark/60 mt-4">
                  These tips will be referenced as guidance in your next practice round.
                </p>
              </CardContent>
            </Card>
          )}

          {activeScripts.length > 0 && (
            <Card className="mb-8 border-purple-300/30">
              <CardContent className="p-6">
                <h2 className="text-xl font-medium mb-4 text-brand-dark">Your Active Scripts</h2>
                <div className="space-y-4">
                  {activeScripts.map((script, index) => (
                    <div key={index} className="p-3 bg-purple-300/5 border border-purple-300/20 rounded-lg flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-brand-dark">{script.title}</h3>
                        <p className="text-sm text-brand-dark/70 mt-1">{script.description}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-brand-dark/60 hover:text-destructive shrink-0"
                        onClick={() => handleRemoveScript(script.title)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card className="mb-8 border-purple-300/30">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="md:w-2/3">
                  <h2 className="text-xl font-medium mb-2 text-brand-dark">Personalized AI Recommendations</h2>
                  <p className="text-brand-dark/70 mb-4">
                    Get custom-tailored sales tips and script suggestions based on your industry, target audience, and improvement areas.
                  </p>
                  <Button 
                    className="btn-primary bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
                    onClick={handleGeneratePersonalizedTips}
                  >
                    <Bot size={16} />
                    Generate Personalized Tips
                  </Button>
                </div>
                <div className="md:w-1/3 flex justify-center">
                  <div className="bg-purple-100 rounded-full p-6 w-24 h-24 flex items-center justify-center">
                    <div className="bg-purple-600 text-white rounded-full p-2">
                      <Bot size={24} />
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
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            
            <div className="flex flex-wrap gap-3">
              {filterCategories.map((filter) => (
                <Button 
                  key={filter}
                  variant={activeFilter === filter ? "default" : "outline"} 
                  className={`rounded-full text-sm ${activeFilter === filter ? 'bg-brand-green hover:bg-brand-green/90' : ''}`}
                  size="sm"
                  onClick={() => handleFilterClick(filter)}
                >
                  {filter}
                </Button>
              ))}
            </div>
          </div>
          
          {salesTips.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {salesTips.map((tip, index) => (
                <div key={index}>
                  <AISuggestionCard
                    title={tip.title}
                    description={tip.description}
                    type={tip.type as 'tip' | 'script'}
                    onApply={handleApplyTipOrScript}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-700">No matching tips found</h3>
              <p className="text-gray-500 mt-2">Try adjusting your search or filter</p>
            </div>
          )}
          
          {filteredTips.length > displayedTips && (
            <div className="mt-8 text-center">
              <Button 
                variant="outline"
                onClick={handleLoadMore}
              >
                Load More Tips
              </Button>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Tips;
