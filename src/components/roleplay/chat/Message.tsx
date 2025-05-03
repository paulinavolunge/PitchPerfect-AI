
import React from 'react';
import { AudioWaveform, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import AIContentBadge from '@/components/AIContentBadge';

interface MessageProps {
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isLatestAIMessage: boolean;
  isAISpeaking: boolean;
}

const Message: React.FC<MessageProps> = ({ text, sender, timestamp, isLatestAIMessage, isAISpeaking }) => {
  return (
    <div className={`flex ${sender === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={cn(
          "max-w-[80%] rounded-lg p-3 shadow-sm transition-all relative",
          sender === 'user'
            ? 'bg-brand-blue text-white'
            : 'bg-purple-50 text-brand-dark border border-purple-100',
          isAISpeaking && isLatestAIMessage && sender === 'ai' && 'border-purple-300'
        )}
      >
        {sender === 'ai' && (
          <div className="flex items-center gap-1 mb-1.5">
            <Bot size={14} className="text-purple-600" />
            <span className="text-xs font-medium text-purple-700">AI Response</span>
          </div>
        )}
        <p className="text-sm md:text-base">{text}</p>
        <div className="text-xs mt-1 flex items-center gap-1">
          <span className={sender === 'user' ? 'text-blue-100' : 'text-gray-400'}>
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {sender === 'ai' && isAISpeaking && isLatestAIMessage && (
            <span className="ml-2 inline-flex items-center">
              <AudioWaveform size={14} className="animate-pulse text-purple-600 mr-1" />
              <span className="text-purple-700">Speaking...</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
