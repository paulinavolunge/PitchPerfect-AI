
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import VoiceRecognitionManager from '@/components/voice/VoiceRecognitionManager';
import { cn } from '@/lib/utils';

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
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const showVoiceInput = mode === 'voice' || mode === 'hybrid';

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Update textarea with voice transcript
  useEffect(() => {
    if (voiceTranscript && mode === 'voice') {
      setMessage(voiceTranscript);
    }
  }, [voiceTranscript, mode]);

  const handleVoiceTranscript = (text: string, isFinal: boolean) => {
    setVoiceTranscript(text);
    
    // In voice-only mode, we update the textarea with the transcript
    if (mode === 'voice') {
      setMessage(text);
    }
    
    // Auto-send final transcripts in voice-only mode if configured
    if (isFinal && text.trim() && mode === 'voice') {
      handleSendMessage(text);
    }
  };

  const handleSendMessage = (textToSend?: string) => {
    const finalMessage = textToSend || message;
    
    if (!finalMessage.trim() || disabled) return;
    
    onSendMessage(finalMessage.trim());
    setMessage('');
    setVoiceTranscript('');
    
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
      handleSendMessage();
    }
  };

  return (
    <div className="border-t p-3 bg-white">
      <div className="flex items-end gap-2">
        <div className="relative flex-grow">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              "min-h-[60px] resize-none py-3 pr-12",
              disabled ? "opacity-50 cursor-not-allowed" : ""
            )}
            disabled={disabled}
            rows={1}
            aria-label="Message input"
          />
          
          <Button
            type="submit"
            size="icon"
            className="absolute right-2 bottom-2"
            onClick={() => handleSendMessage()}
            disabled={!message.trim() || disabled}
            aria-label="Send message"
          >
            <Send size={18} />
            <span className="sr-only">Send</span>
          </Button>
        </div>
        
        {showVoiceInput && (
          <VoiceRecognitionManager
            onTranscript={handleVoiceTranscript}
            disabled={disabled}
            onError={setVoiceError}
          />
        )}
      </div>
      
      {voiceTranscript && mode === 'hybrid' && (
        <div className="mt-2 text-sm text-muted-foreground italic">
          Transcript: {voiceTranscript}
        </div>
      )}
      
      {voiceError && (
        <p className="mt-2 text-sm text-destructive">{voiceError}</p>
      )}
    </div>
  );
};

export default ChatInput;
