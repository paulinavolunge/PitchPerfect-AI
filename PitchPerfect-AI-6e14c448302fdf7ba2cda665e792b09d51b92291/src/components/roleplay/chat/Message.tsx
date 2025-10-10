
import React from 'react';
import { AudioWaveform, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import AIContentBadge from '@/components/AIContentBadge';
import { generateUniqueId } from '@/utils/accessibility';

interface MessageProps {
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isLatestAIMessage: boolean;
  isAISpeaking: boolean;
}

const Message: React.FC<MessageProps> = ({ text, sender, timestamp, isLatestAIMessage, isAISpeaking }) => {
  const messageId = React.useRef(generateUniqueId('message')).current;
  const isUser = sender === 'user';
  const isAI = sender === 'ai';
  
  return (
    <div 
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
      role="group"
      aria-labelledby={`${messageId}-sender`}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-lg p-3 shadow-sm transition-all relative",
          isUser
            ? 'bg-brand-blue text-white'
            : 'bg-purple-50 text-brand-dark border border-purple-100',
          isAISpeaking && isLatestAIMessage && isAI && 'border-purple-300'
        )}
        role="article"
        aria-describedby={`${messageId}-content ${messageId}-time`}
      >
        {isAI && (
          <div className="flex items-center gap-1 mb-1.5">
            <Bot 
              size={14} 
              className="text-purple-600" 
              aria-hidden="true"
              role="img"
              aria-label="AI assistant icon"
            />
            <span 
              id={`${messageId}-sender`}
              className="text-xs font-medium text-purple-700"
            >
              AI Response
            </span>
          </div>
        )}
        
        {isUser && (
          <span id={`${messageId}-sender`} className="sr-only">
            Your message
          </span>
        )}
        
        <p 
          id={`${messageId}-content`}
          className="text-sm md:text-base"
          role="text"
        >
          {text}
        </p>
        
        <div className="text-xs mt-1 flex items-center gap-1">
          <time 
            id={`${messageId}-time`}
            className={isUser ? 'text-blue-100' : 'text-gray-400'}
            dateTime={timestamp.toISOString()}
            aria-label={`Message sent at ${timestamp.toLocaleString()}`}
          >
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </time>
          
          {isAI && isAISpeaking && isLatestAIMessage && (
            <span 
              className="ml-2 inline-flex items-center"
              role="status"
              aria-live="polite"
              aria-label="AI is currently speaking this message"
            >
              <AudioWaveform 
                size={14} 
                className="animate-pulse text-purple-600 mr-1" 
                aria-hidden="true"
              />
              <span className="text-purple-700">Speaking...</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
