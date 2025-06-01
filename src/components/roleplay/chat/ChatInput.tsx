
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import VoiceInput from '@/components/voice/VoiceInput';

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
  const [useVoice, setUseVoice] = useState(mode === 'voice');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update voice mode when prop changes
  useEffect(() => {
    if (mode === 'voice') {
      setUseVoice(true);
    } else if (mode === 'text') {
      setUseVoice(false);
    }
  }, [mode]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && !useVoice) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message, useVoice]);

  const handleVoiceTranscript = (text: string, isFinal: boolean) => {
    setVoiceTranscript(text);
    if (isFinal && text.trim()) {
      handleSend(text);
    }
  };

  const handleSend = (textToSend?: string) => {
    const finalMessage = textToSend || (useVoice ? voiceTranscript : message);
    
    if (!finalMessage.trim()) return;
    
    onSendMessage(finalMessage.trim());
    setMessage('');
    setVoiceTranscript('');
    
    // Focus textarea after sending (for text mode)
    if (!useVoice && textareaRef.current) {
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
  
  const showVoiceToggle = mode === 'hybrid';
  const currentMessage = useVoice ? voiceTranscript : message;

  return (
    <div className="border-t p-3 bg-white space-y-3">
      {showVoiceToggle && (
        <div className="flex items-center space-x-2">
          <Switch
            id="voice-toggle"
            checked={useVoice}
            onCheckedChange={setUseVoice}
            disabled={disabled}
          />
          <Label htmlFor="voice-toggle" className="text-sm">
            Voice input
          </Label>
        </div>
      )}

      <div className="flex items-end gap-2">
        {useVoice ? (
          <div className="flex-grow">
            <VoiceInput
              onTranscript={handleVoiceTranscript}
              disabled={disabled}
              placeholder="Click the microphone to speak your response..."
              showSpeechOutput={false}
            />
          </div>
        ) : (
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
        
        <Button
          type="button"
          size="icon"
          onClick={() => handleSend()}
          disabled={!currentMessage.trim() || disabled}
          className="h-10 w-10 bg-[#3A66DB] hover:bg-[#3A66DB]/90 text-white"
          aria-label="Send message"
        >
          <Send size={18} />
        </Button>
      </div>
      
      {currentMessage && (
        <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
          Preview: "{currentMessage}"
        </div>
      )}
    </div>
  );
};

export default ChatInput;
