
import React, { useState, useEffect } from 'react';
import MessageList from './chat/MessageList';
import ChatInput from './chat/ChatInput';
import { getScenarioIntro, generateAIResponse } from './chat/ChatLogic';

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

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
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

  useEffect(() => {
    const scenarioIntro = getScenarioIntro(scenario, getAIPersona);
    
    setTimeout(() => {
      setMessages([
        {
          id: '1',
          text: scenarioIntro,
          sender: 'ai',
          timestamp: new Date()
        }
      ]);
      
      if (mode !== 'text') {
        setIsAISpeaking(true);
        setTimeout(() => setIsAISpeaking(false), 5000);
      }
    }, 800);
  }, [scenario, mode]);

  const getAIPersona = () => {
    const personas = {
      friendly: "Alex",
      assertive: "Jordan",
      skeptical: "Casey",
      rushed: "Morgan"
    };
    return personas[voiceStyle];
  };

  const handleSendMessage = (inputText: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputText, scenario, userScript, getAIPersona);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      if (mode !== 'text') {
        setIsAISpeaking(true);
        const wordCount = aiResponse.split(' ').length;
        const speechDuration = Math.min(Math.max(wordCount * 300, 1500), 8000);
        setTimeout(() => setIsAISpeaking(false), speechDuration);
      }
    }, 1200);
  };

  return (
    <div className="flex flex-col h-[600px]">
      <MessageList messages={messages} isAISpeaking={isAISpeaking} />
      <ChatInput mode={mode} onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ConversationInterface;
