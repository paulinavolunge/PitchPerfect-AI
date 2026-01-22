
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
    <div className={cn("flex-1 overflow-y-auto p-3 sm:p-4", className)}>
      <div className="space-y-3 sm:space-y-4 max-w-full">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex w-full",
              message.sender === 'user' ? "justify-end" : "justify-start",
              "animate-fade-in"
            )}
          >
            <div
              className={cn(
                "max-w-[85%] sm:max-w-[80%] rounded-lg p-3 sm:p-4 relative break-words",
                message.sender === 'user'
                  ? "bg-[#3A66DB] text-white rounded-tr-none"
                  : "bg-gray-100 text-gray-800 rounded-tl-none",
                isAISpeaking && message.id === messages[messages.length - 1].id && message.sender === 'ai'
                  ? "border-2 border-brand-blue/50 animate-pulse"
                  : ""
              )}
            >
              {showConfidenceIndicator(message) && (
                <div className="absolute -top-2 -right-2 bg-amber-400 text-white text-xs rounded-full w-5 h-5 sm:w-4 sm:h-4 flex items-center justify-center touch-manipulation" title="AI confidence is lower for this response">
                  !
                </div>
              )}
              <div className="whitespace-pre-wrap break-words text-sm sm:text-base leading-relaxed">
                {message.text}
              </div>
              <div className={cn(
                "text-xs mt-2",
                message.sender === 'user' ? "text-white/70" : "text-gray-500"
              )}>
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full min-h-[200px]">
            <p className="text-gray-500 text-center px-4">No messages yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageList;
