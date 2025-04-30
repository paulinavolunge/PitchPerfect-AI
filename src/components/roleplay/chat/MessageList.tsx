
import React, { useEffect, useRef } from 'react';
import Message from './Message';
import { motion } from 'framer-motion';

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
    <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50/50">
      {messages.map((message, index) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Message
            text={message.text}
            sender={message.sender}
            timestamp={message.timestamp}
            isLatestAIMessage={index === messages.length - 1 && message.sender === 'ai'}
            isAISpeaking={isAISpeaking}
          />
        </motion.div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
