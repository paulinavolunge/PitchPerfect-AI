
import React, { useState, useEffect, useRef } from 'react';
import MessageList from './chat/MessageList';
import ChatInput from './chat/ChatInput';
import { useToast } from "@/hooks/use-toast";
import { getScenarioIntro, generateAIResponse } from './chat/ChatLogic';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ConversationInterfaceProps {
  mode: 'voice' | 'text' | 'hybrid';
  scenario: {
    difficulty: string;
    objection: string;
    industry: string;
    custom?: string;
  };
  voiceStyle: 'friendly' | 'assertive' | 'skeptical' | 'rushed';
  volume: number;
  userScript?: string | null;
}

const ConversationInterface: React.FC<ConversationInterfaceProps> = ({
  mode,
  scenario,
  voiceStyle,
  volume,
  userScript
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize with AI greeting
    const greeting = getScenarioIntro(scenario, getAIPersona);
    setMessages([
      {
        id: `ai-${Date.now()}`,
        text: greeting,
        sender: 'ai',
        timestamp: new Date(),
      },
    ]);
  }, [scenario]);

  const getAIPersona = () => {
    const styles = {
      friendly: 'Alex',
      assertive: 'Jordan',
      skeptical: 'Morgan',
      rushed: 'Taylor',
    };
    return styles[voiceStyle] || 'Customer';
  };

  const handleSendMessage = (text: string) => {
    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: text,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    
    // Simulate thinking delay
    setTimeout(() => {
      // Generate AI response
      const aiResponse = generateAIResponse(text, scenario, userScript || null, getAIPersona);
      
      setIsAISpeaking(true);
      
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, aiMessage]);
      
      if (volume > 0 && mode !== 'text') {
        // Mock AI speaking for now
        toast({
          title: "Voice feedback",
          description: "AI is responding with voice...",
          duration: 3000,
        });
        
        // Simulate AI finishing speaking after 3 seconds
        setTimeout(() => {
          setIsAISpeaking(false);
        }, 3000);
      } else {
        setIsAISpeaking(false);
      }
    }, 1000);
  };

  return (
    <div className="flex flex-col h-[500px] border rounded-lg overflow-hidden">
      <MessageList messages={messages} isAISpeaking={isAISpeaking} />
      <ChatInput mode={mode} onSendMessage={handleSendMessage} />
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ConversationInterface;
