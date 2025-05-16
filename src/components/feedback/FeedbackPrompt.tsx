
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface FeedbackPromptProps {
  sessionId?: string;
  feedbackType: 'roleplay' | 'practice' | 'demo';
  onFeedbackSubmitted?: (wasHelpful: boolean) => void;
  className?: string;
}

const FeedbackPrompt: React.FC<FeedbackPromptProps> = ({ 
  sessionId, 
  feedbackType,
  onFeedbackSubmitted,
  className = '' 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const submitFeedback = async (wasHelpful: boolean) => {
    if (hasSubmitted) return;
    
    setIsSubmitting(true);
    
    try {
      // Store feedback in localStorage for guest users or when offline
      const feedbackData = {
        sessionId: sessionId || `session-${Date.now()}`,
        feedbackType,
        wasHelpful,
        timestamp: new Date().toISOString(),
        userId: user?.id || 'guest'
      };
      
      // Store in localStorage (for all users as backup)
      const existingFeedback = JSON.parse(localStorage.getItem('user_feedback') || '[]');
      existingFeedback.push(feedbackData);
      localStorage.setItem('user_feedback', JSON.stringify(existingFeedback));
      
      // Also send to analytics if available
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'user_feedback', {
          'session_id': feedbackData.sessionId,
          'feedback_type': feedbackData.feedbackType,
          'was_helpful': wasHelpful,
          'user_id': feedbackData.userId
        });
      }
      
      // If user is logged in and Supabase is available, store in database
      if (user?.id && supabase) {
        try {
          const { error } = await supabase
            .from('user_feedback')
            .insert([{
              user_id: user.id,
              session_id: sessionId || `session-${Date.now()}`,
              feedback_type: feedbackType,
              is_helpful: wasHelpful,
              created_at: new Date().toISOString()
            }]);
            
          if (error) {
            console.error('Error saving feedback to database:', error);
          }
        } catch (dbError) {
          console.error('Database error when saving feedback:', dbError);
        }
      }
      
      // Call the callback if provided
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted(wasHelpful);
      }
      
      setHasSubmitted(true);
      
      toast({
        title: "Thank you for your feedback",
        description: "Your input helps us improve our AI assistant.",
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Couldn't submit feedback",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (hasSubmitted) {
    return (
      <div className={`text-sm text-brand-dark/70 ${className}`}>
        Thanks for your feedback!
      </div>
    );
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center gap-2 ${className}`}>
      <div className="text-sm text-brand-dark/70 mr-2">Was this helpful?</div>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => submitFeedback(true)}
          disabled={isSubmitting}
          className="flex items-center gap-1 h-8 min-w-[80px]"
          aria-label="This was helpful"
        >
          <ThumbsUp className="h-4 w-4" />
          <span>Yes</span>
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => submitFeedback(false)}
          disabled={isSubmitting}
          className="flex items-center gap-1 h-8 min-w-[80px]"
          aria-label="This was not helpful"
        >
          <ThumbsDown className="h-4 w-4" />
          <span>No</span>
        </Button>
      </div>
    </div>
  );
};

export default FeedbackPrompt;
