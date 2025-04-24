
import React, { useEffect, useRef } from 'react';
import Message from './Message';

interface MessageListProps {
  messages: Array<{
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
  }>;
  isAISpeaking: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isAISpeaking }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-grow overflow-y-auto p-4 space-y-4">
      {messages.map((message, index) => (
        <Message
          key={message.id}
          text={message.text}
          sender={message.sender}
          timestamp={message.timestamp}
          isLatestAIMessage={index === messages.length - 1 && message.sender === 'ai'}
          isAISpeaking={isAISpeaking}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
