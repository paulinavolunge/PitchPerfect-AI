
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface ChatInputProps {
  mode: 'voice' | 'text' | 'hybrid';
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  mode,
  onSendMessage,
  disabled = false,
  placeholder = "Type your response..."
}) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [recognitionActive, setRecognitionActive] = useState(false);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsVoiceSupported(true);
      
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
          
        setMessage(transcript);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event);
        setIsRecording(false);
        setRecognitionActive(false);
      };
      
      recognition.onend = () => {
        setRecognitionActive(false);
        if (isRecording) {
          // If recording is still active, restart recognition
          // (triggered by auto-timeout rather than user clicking stop)
          recognition.start();
          setRecognitionActive(true);
        }
      };
      
      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current && recognitionActive) {
        recognitionRef.current.stop();
      }
    };
  }, []);
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const toggleRecording = () => {
    if (!isVoiceSupported || !recognitionRef.current) return;
    
    if (isRecording) {
      recognitionRef.current.stop();
      setRecognitionActive(false);
    } else {
      setMessage(''); // Clear any existing message
      try {
        recognitionRef.current.start();
        setRecognitionActive(true);
      } catch (err) {
        console.error('Could not start recording', err);
      }
    }
    
    setIsRecording(!isRecording);
  };

  const handleSend = () => {
    if (!message.trim()) return;
    
    onSendMessage(message.trim());
    setMessage('');
    
    // Stop recording if active
    if (isRecording) {
      toggleRecording();
    }
    
    // Focus textarea after sending
    if (textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 10);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const showVoiceButton = mode === 'voice' || mode === 'hybrid';
  const showTextInput = mode === 'text' || mode === 'hybrid';

  return (
    <div className="border-t p-3 bg-white">
      <div className="flex items-end gap-2">
        {showTextInput && (
          <div className="flex-grow relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className="resize-none min-h-[44px] pr-10 py-2"
              rows={1}
              aria-label="Your message"
            />
          </div>
        )}
        
        <div className="flex items-center gap-2">
          {showVoiceButton && (
            <Button
              type="button"
              size="icon"
              variant={isRecording ? "destructive" : "outline"}
              onClick={toggleRecording}
              disabled={!isVoiceSupported || disabled}
              className="h-10 w-10 rounded-full"
              aria-label={isRecording ? "Stop recording" : "Start recording"}
            >
              {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
            </Button>
          )}
          
          <Button
            type="button"
            size="icon"
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            className="h-10 w-10 bg-[#3A66DB] hover:bg-[#3A66DB]/90 text-white"
            aria-label="Send message"
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
      
      {isRecording && (
        <div className="text-xs text-red-500 mt-1 animate-pulse">
          Recording... Speak clearly into your microphone
        </div>
      )}
    </div>
  );
};

export default ChatInput;
