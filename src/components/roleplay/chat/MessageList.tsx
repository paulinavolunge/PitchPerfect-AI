
import React from 'react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  confidence?: number; // Optional confidence score for AI responses
}

interface MessageListProps {
  messages: Message[];
  isAISpeaking?: boolean;
  className?: string;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isAISpeaking, className }) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Show confidence indicator for AI responses with lower confidence
  const showConfidenceIndicator = (message: Message) => {
    return message.sender === 'ai' && 
           typeof message.confidence === 'number' && 
           message.confidence < 85;
  };
  
  return (
    <div className={cn("flex-1 overflow-y-auto p-4", className)}>
      <div className="space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.sender === 'user' ? "justify-end" : "justify-start",
              "animate-fade-in"
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-lg p-3 relative",
                message.sender === 'user'
                  ? "bg-[#3A66DB] text-white rounded-tr-none"
                  : "bg-gray-100 text-gray-800 rounded-tl-none",
                isAISpeaking && message.id === messages[messages.length - 1].id && message.sender === 'ai'
                  ? "border-2 border-brand-blue/50 animate-pulse"
                  : ""
              )}
            >
              {showConfidenceIndicator(message) && (
                <div className="absolute -top-2 -right-2 bg-amber-400 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center" title="AI confidence is lower for this response">
                  !
                </div>
              )}
              <div className="whitespace-pre-wrap break-words">{message.text}</div>
              <div className={cn(
                "text-xs mt-1",
                message.sender === 'user' ? "text-white/70" : "text-gray-500"
              )}>
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No messages yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageList;
