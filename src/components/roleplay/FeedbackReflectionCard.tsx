import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, ChevronRight, Timer } from 'lucide-react';

interface FeedbackReflectionCardProps {
  isVisible: boolean;
  onRevealFeedback: () => void;
  userResponse: string;
}

const FeedbackReflectionCard: React.FC<FeedbackReflectionCardProps> = ({
  isVisible,
  onRevealFeedback,
  userResponse
}) => {
  const [countdown, setCountdown] = useState(5);
  const [showAutoReveal, setShowAutoReveal] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setShowAutoReveal(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible]);

  useEffect(() => {
    if (showAutoReveal) {
      const autoRevealTimer = setTimeout(() => {
        onRevealFeedback();
      }, 1000);
      return () => clearTimeout(autoRevealTimer);
    }
  }, [showAutoReveal, onRevealFeedback]);

  if (!isVisible) return null;

  // Generate encouraging micro-wins based on basic response characteristics
  const generateMicroWin = (response: string) => {
    const responseLength = response.trim().length;
    const hasQuestion = response.includes('?');
    const hasEmpathy = /understand|appreciate|hear|feel|concern/i.test(response);
    const hasSpecifics = /example|instance|case|client|customer/i.test(response);
    
    const microWins = [
      "Good start! 🌟 You engaged with the objection",
      "Nice work! 💪 You stayed professional", 
      "Great attempt! ✨ You're building confidence"
    ];

    if (hasEmpathy) microWins.unshift("Excellent! 🎯 You showed empathy");
    if (hasQuestion) microWins.unshift("Well done! 🤔 You asked a question");
    if (hasSpecifics) microWins.unshift("Smart move! 📈 You mentioned specifics");
    if (responseLength > 100) microWins.unshift("Fantastic! 💬 You gave a detailed response");

    return microWins[0];
  };

  const microWin = generateMicroWin(userResponse);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="max-w-md w-full bg-gradient-to-br from-emerald-50 to-blue-50 border-emerald-200 shadow-2xl">
        <CardContent className="p-6 text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 bg-emerald-100 rounded-full">
              <Sparkles className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-emerald-800 mb-2">
              {microWin}
            </h3>
            <p className="text-sm text-emerald-700">
              Take a moment to reflect on what you just said. How do you think it came across?
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={onRevealFeedback}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              <ChevronRight className="h-4 w-4 mr-2" />
              See My Growth Report
            </Button>
            
            {!showAutoReveal ? (
              <div className="flex items-center justify-center gap-2 text-xs text-emerald-600">
                <Timer className="h-3 w-3" />
                <span>Auto-revealing in {countdown}s</span>
              </div>
            ) : (
              <div className="text-xs text-emerald-700 font-medium animate-pulse">
                ✨ Preparing your personalized coaching...
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-emerald-200">
            <p className="text-xs text-emerald-600 italic">
              💡 Reflection helps you internalize learning faster
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeedbackReflectionCard;