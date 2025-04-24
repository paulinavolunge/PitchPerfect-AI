
import React from 'react';
import { AudioWaveform } from 'lucide-react';

interface MessageProps {
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isLatestAIMessage: boolean;
  isAISpeaking: boolean;
}

const Message: React.FC<MessageProps> = ({ text, sender, timestamp, isLatestAIMessage, isAISpeaking }) => {
  return (
    <div className={`flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl p-4 ${
          sender === 'user'
            ? 'bg-brand-green/10 text-brand-dark'
            : 'bg-brand-blue/10 text-brand-dark'
        }`}
      >
        <p>{text}</p>
        <div className="text-xs text-gray-500 mt-1">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {sender === 'ai' && isAISpeaking && isLatestAIMessage && (
            <span className="ml-2 inline-flex items-center">
              <AudioWaveform size={14} className="animate-pulse text-brand-green mr-1" />
              Speaking...
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
