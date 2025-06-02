
import React from 'react';

interface AIFeedbackProps {
  text: string;
}

export default function FeedbackDisplay({ text }: AIFeedbackProps) {
  return (
    <div 
      aria-live="polite" 
      aria-atomic="true"
      role="status"
    >
      {text}
    </div>
  );
}
