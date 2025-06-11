
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import VoiceRecognitionManager from '@/components/voice/VoiceRecognitionManager';
import { cn } from '@/lib/utils';
import { AIErrorHandler } from '@/utils/aiErrorHandler';
import { showAIErrorToast } from '@/components/ui/ai-error-toast';
import { useContentSafety } from '@/hooks/useContentSafety';

interface ChatInputProps {
  mode: 'voice' | 'text' | 'hybrid';
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  userId?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  mode,
  onSendMessage,
  disabled = false,
  placeholder = "Type your response...",
  userId = 'anonymous'
}) => {
  const [message, setMessage] = useState('');
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const showVoiceInput = mode === 'voice' || mode === 'hybrid';
  const { validateInput } = useContentSafety();

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

  const handleVoiceTranscript = async (text: string, isFinal: boolean) => {
    try {
      // Validate voice transcript for safety
      const safetyResult = await validateInput(text, 'VOICE_TRANSCRIPT');
      if (!safetyResult.isValid) {
        setVoiceError('Voice input contains inappropriate content');
        return;
      }

      const safeText = safetyResult.sanitized || text;
      setVoiceTranscript(safeText);
      setVoiceError(null);
      
      // In voice-only mode, we update the textarea with the transcript
      if (mode === 'voice') {
        setMessage(safeText);
      }
      
      // Auto-send final transcripts in voice-only mode if configured
      if (isFinal && safeText.trim() && mode === 'voice') {
        handleSendMessage(safeText);
      }
    } catch (error) {
      console.error('Error handling voice transcript:', error);
      AIErrorHandler.handleError({
        name: 'VoiceTranscriptError',
        message: 'Failed to process voice transcript',
        code: 'TRANSCRIPT_ERROR',
      }, 'chat-input');
    }
  };

  const handleVoiceError = (error: string) => {
    setVoiceError(error);
    
    // Provide fallback options when voice fails
    if (mode === 'voice') {
      showAIErrorToast({
        title: "Voice Input Failed",
        description: "Voice recognition encountered an error. You can still type your response below.",
        errorCode: "VOICE_ERROR",
        duration: 6000,
      });
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const finalMessage = textToSend || message;
    
    if (!finalMessage.trim() || disabled || isSubmitting) return;

    // Content safety validation
    const safetyResult = await validateInput(finalMessage, 'USER_MESSAGE');
    if (!safetyResult.isValid) {
      return; // Safety hook will show appropriate error message
    }

    // Use sanitized content if available
    const messageToSend = safetyResult.sanitized || finalMessage;

    // Check rate limiting
    if (!AIErrorHandler.checkRateLimit(userId, 'chat-message', 20)) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await AIErrorHandler.withRetry(
        async () => {
          if (!messageToSend.trim()) {
            throw new Error('Empty message');
          }
          
          onSendMessage(messageToSend.trim());
        },
        `send-message-${Date.now()}`,
        { maxRetries: 2 }
      );
      
      // Clear inputs on successful send
      setMessage('');
      setVoiceTranscript('');
      setVoiceError(null);
      
      // Focus textarea after sending
      if (textareaRef.current) {
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 10);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      AIErrorHandler.handleError({
        name: 'MessageSendError',
        message: 'Failed to send message',
        code: 'SEND_ERROR',
        retryable: true,
      }, 'chat-input');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isSubmitting) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const canSendMessage = message.trim() && !disabled && !isSubmitting;

  return (
    <div className="border-t p-3 sm:p-4 bg-white">
      <div className="flex items-end gap-2 sm:gap-3">
        <div className="relative flex-grow min-w-0">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={voiceError && mode === 'voice' 
              ? "Voice input failed. Please type your response..." 
              : placeholder
            }
            className={cn(
              "min-h-[44px] sm:min-h-[60px] resize-none py-2 sm:py-3 pr-11 sm:pr-12 text-base",
              disabled || isSubmitting ? "opacity-50 cursor-not-allowed" : "",
              voiceError && mode === 'voice' ? "border-amber-300 bg-amber-50" : ""
            )}
            disabled={disabled || isSubmitting}
            rows={1}
            maxLength={1500}
            aria-label="Message input"
          />
          
          <Button
            type="submit"
            size="icon"
            className={cn(
              "absolute right-1 sm:right-2 bottom-1 sm:bottom-2 h-8 w-8 sm:h-9 sm:w-9 touch-manipulation",
              isSubmitting ? "animate-pulse" : ""
            )}
            onClick={() => handleSendMessage()}
            disabled={!canSendMessage}
            aria-label="Send message"
          >
            <Send size={16} className="sm:hidden" />
            <Send size={18} className="hidden sm:block" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
        
        {showVoiceInput && (
          <div className="flex-shrink-0">
            <VoiceRecognitionManager
              onTranscript={handleVoiceTranscript}
              disabled={disabled || isSubmitting}
              onError={handleVoiceError}
            />
          </div>
        )}
      </div>
      
      {voiceTranscript && mode === 'hybrid' && (
        <div className="mt-2 text-sm text-muted-foreground italic break-words">
          Transcript: {voiceTranscript}
        </div>
      )}
      
      {voiceError && (
        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
          <p className="text-amber-700 font-medium">Voice Input Issue:</p>
          <p className="text-amber-600 break-words">{voiceError}</p>
          {mode === 'voice' && (
            <p className="text-amber-600 mt-1">You can continue using text input below.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatInput;
