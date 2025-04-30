
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Send } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/AuthContext';
import PremiumModal from '@/components/PremiumModal';

interface ChatInputProps {
  mode: 'voice' | 'text' | 'hybrid';
  onSendMessage: (text: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ mode, onSendMessage }) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const { toast } = useToast();
  const { isPremium } = useAuth();

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleListening = () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    
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
      
      // Mock voice recognition for now
      setTimeout(() => {
        const mockRecognizedText = "I understand your concerns about pricing, but I believe our solution offers exceptional value compared to alternatives.";
        setInputText(mockRecognizedText);
        setIsListening(false);
      }, 4000);
    }
  };

  return (
    <>
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
              aria-label={isListening ? "Stop recording" : "Start recording"}
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
              aria-label="Send message"
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

      {/* Premium Modal */}
      <PremiumModal 
        open={showPremiumModal} 
        onOpenChange={setShowPremiumModal}
        featureName="voice input"
      />
    </>
  );
};

export default ChatInput;
