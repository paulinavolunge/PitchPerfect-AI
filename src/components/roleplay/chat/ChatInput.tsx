
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, MicOff, Send } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/AuthContext';
import PremiumModal from '@/components/PremiumModal';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Initialize speech recognition
    if (typeof window !== 'undefined' && 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
          
        setInputText(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        toast({
          title: "Voice recognition error",
          description: `Error: ${event.error}. Please try again or use text input.`,
          variant: "destructive",
        });
      };
    }

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        if (isListening) {
          recognitionRef.current.stop();
        }
      }
    };
  }, [toast]);

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
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      toast({
        title: "Voice recording stopped",
        description: "Your voice has been processed into text.",
        variant: "default",
      });
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
          toast({
            title: "Listening...",
            description: "Speak now. Your voice will be processed into text.",
            variant: "default",
          });
        } catch (error) {
          console.error('Speech recognition error:', error);
          toast({
            title: "Voice recognition error",
            description: "Could not start voice recognition. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Voice recognition not supported",
          description: "Your browser does not support voice recognition. Please use text input.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <>
      <div className="border-t p-4 bg-white shadow-sm transition-all animate-fade-in">
        <div className="flex items-end gap-2">
          {(mode === 'voice' || mode === 'hybrid') && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={toggleListening}
                  className={`rounded-full p-2 transition-all ${
                    isListening
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-brand-blue hover:bg-brand-blue/90 text-white'
                  }`}
                  size="icon"
                  aria-label={isListening ? "Stop recording" : "Start recording"}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isListening ? "Stop recording" : "Start voice input"}</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          {(mode === 'text' || mode === 'hybrid') && (
            <Textarea
              placeholder="Type your message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-grow resize-none border-brand-blue/20 focus:border-brand-blue/50 transition-all"
              rows={2}
            />
          )}
          
          {(mode === 'text' || mode === 'hybrid') && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim()}
                  className="bg-brand-blue hover:bg-brand-blue/90 text-white rounded-full p-2 transition-all"
                  size="icon"
                  aria-label="Send message"
                >
                  <Send size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Send message</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        
        {isListening && (
          <div className="mt-2 text-center text-sm text-brand-blue animate-pulse">
            Listening... Speak clearly
          </div>
        )}
      </div>

      <PremiumModal 
        open={showPremiumModal} 
        onOpenChange={setShowPremiumModal}
        featureName="voice input"
      />
    </>
  );
};

export default ChatInput;
