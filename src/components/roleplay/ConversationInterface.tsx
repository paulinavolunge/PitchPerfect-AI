import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Send, AudioWaveform } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

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
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const scenarioIntro = getScenarioIntro();
    
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
  }, [scenario]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getScenarioIntro = () => {
    if (scenario.custom) {
      return `${getAIPersona()}: Hello! I'm ready to roleplay your custom scenario about ${scenario.custom}. How can I help you today?`;
    }
    
    const intros = {
      SaaS: "Hi there! I'm considering a new software solution for my team. I've heard about your product, but I'm not convinced it's worth the investment.",
      Retail: "Hello, I'm browsing today and noticed your product. I'm interested but have a few concerns before making a purchase.",
      'B2B Services': "Good day, I'm the procurement manager at Acme Corp. We're evaluating several service providers in your space.",
      Healthcare: "Hi, our medical practice is looking to upgrade our systems. I've been tasked with reviewing options.",
      Finance: "Hello, I'm looking to possibly switch financial services. What makes your offering different?",
      'Real Estate': "Hi there, I'm in the market for a new property, but I'm not in a rush to make a decision."
    };
    
    const objectionHints = {
      Price: "though I'm concerned about the cost",
      Urgency: "but I don't see why we need to decide quickly", 
      Trust: "though I'm not familiar with your company's track record",
      Timing: "but this isn't the right time for us",
      Competition: "and I'm also talking to your competitors",
      Need: "though I'm not convinced we need this solution"
    };
    
    let intro = intros[scenario.industry] || intros.SaaS;
    intro += ` I'm interested to learn more, ${objectionHints[scenario.objection]}.`;
    
    return `${getAIPersona()}: ${intro}`;
  };

  const getAIPersona = () => {
    const personas = {
      friendly: "Alex",
      assertive: "Jordan",
      skeptical: "Casey",
      rushed: "Morgan"
    };
    return personas[voiceStyle];
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputText);
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

  const generateAIResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();
    const persona = getAIPersona();
    
    if (userScript) {
      const scriptLines = userScript.split('\n').map(line => line.toLowerCase());
      const relevantLine = scriptLines.find(line => 
        line.includes(lowerInput.substring(0, 10))
      );

      if (relevantLine) {
        return `${persona}: I see you're following your script. Let me challenge that point: ${
          generateObjection(relevantLine)
        }`;
      }
    }

    if (lowerInput.includes('price') || lowerInput.includes('cost') || lowerInput.includes('expensive')) {
      if (scenario.objection === 'Price') {
        return `${persona}: I understand your concern about the price. Our solution costs more because we deliver 30% more value through our advanced features. Many customers find they recoup the investment within 6 months through increased efficiency. Would you like me to show you how the ROI calculation works for businesses like yours?`;
      }
      return `${persona}: The pricing is competitive for what we offer. We find most customers see significant value that outweighs the initial investment. What specific budget constraints are you working within?`;
    }
    
    if (lowerInput.includes('competitor') || lowerInput.includes('alternative')) {
      if (scenario.objection === 'Competition') {
        return `${persona}: I'm glad you're exploring options. We regularly win against our competitors because of our unique approach to customer success. In fact, 40% of our new customers switched from those exact alternatives. What specific competitor features are you most impressed by?`;
      }
      return `${persona}: We respect our competitors, but there are key differences in our approach. Our solution includes X and Y that others don't offer. Have you had a chance to evaluate those specific differences?`;
    }
    
    if (lowerInput.includes('time') || lowerInput.includes('urgent') || lowerInput.includes('wait')) {
      if (scenario.objection === 'Timing' || scenario.objection === 'Urgency') {
        return `${persona}: I appreciate you being upfront about timing. Many of our clients initially felt the same way, but found that delaying implementation actually cost them more in the long run. What would need to happen for this to become a priority now?`;
      }
      return `${persona}: Timing is definitely important. When would you anticipate being ready to move forward? We could use that timeframe to prepare a smooth implementation plan.`;
    }
    
    const defaultResponses = [
      `${persona}: That's an interesting perspective. Can you tell me more about how you're handling this challenge currently?`,
      `${persona}: I see where you're coming from. Many of our customers had similar concerns before they discovered how our solution addresses that exact issue.`,
      `${persona}: Let me clarify something important about that. Our approach is unique because we focus on the long-term results, not just the quick fix.`,
      `${persona}: That's a common question. The short answer is yes, but there's actually more value in how we implement it compared to others in the market.`
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const generateObjection = (scriptLine: string): string => {
    const objections = [
      "That sounds good in theory, but how does it work in practice?",
      "I've heard similar promises before. What makes your solution different?",
      "That's interesting, but I'm not sure it addresses our specific needs.",
      "Can you provide some concrete examples of how this has worked for others?",
      "I understand what you're saying, but the timing isn't right for us."
    ];
    
    return objections[Math.floor(Math.random() * objections.length)];
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      toast({
        title: "Voice recording stopped",
        description: "Please speak clearly when recording.",
      });
    } else {
      setIsListening(true);
      toast({
        title: "Listening...",
        description: "Speak now. Your voice will be processed into text.",
      });
      
      setTimeout(() => {
        const mockRecognizedText = "I understand your concerns about pricing, but I believe our solution offers exceptional value compared to alternatives.";
        setInputText(mockRecognizedText);
        setIsListening(false);
      }, 4000);
    }
  };

  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-4 ${
                message.sender === 'user'
                  ? 'bg-brand-green/10 text-brand-dark'
                  : 'bg-brand-blue/10 text-brand-dark'
              }`}
            >
              <p>{message.text}</p>
              <div className="text-xs text-gray-500 mt-1">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {message.sender === 'ai' && isAISpeaking && message.id === messages[messages.length - 1].id && (
                  <span className="ml-2 inline-flex items-center">
                    <AudioWaveform size={14} className="animate-pulse text-brand-green mr-1" />
                    Speaking...
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t p-4 bg-white">
        <div className="flex items-end gap-2">
          {(mode === 'voice' || mode === 'hybrid') && (
            <Button
              onClick={toggleListening}
              className={`rounded-full p-2 ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-brand-green hover:bg-brand-green/90 text-white'
              }`}
              size="icon"
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </Button>
          )}
          
          {(mode === 'text' || mode === 'hybrid') && (
            <Textarea
              placeholder="Type your message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-grow resize-none"
              rows={2}
            />
          )}
          
          {(mode === 'text' || mode === 'hybrid') && (
            <Button
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              className="bg-brand-green hover:bg-brand-green/90 text-white rounded-full p-2"
              size="icon"
            >
              <Send size={18} />
            </Button>
          )}
        </div>
        
        {isListening && (
          <div className="mt-2 text-center text-sm text-brand-green animate-pulse">
            Listening... Speak clearly
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationInterface;
