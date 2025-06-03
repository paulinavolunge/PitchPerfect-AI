
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { DemoRecorder } from './DemoRecorder';

export interface PracticeObjectionProps {
  scenario: string;
  onSubmit: (input: { type: 'voice' | 'text'; data: Blob | string }) => void;
}

export const PracticeObjection: React.FC<PracticeObjectionProps> = ({ 
  scenario, 
  onSubmit 
}) => {
  const [mode, setMode] = useState<'voice' | 'text'>('voice');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    await onSubmit({ type: 'text', data: text.trim() });
    setSubmitting(false);
    setText('');
  };

  const handleVoiceEnd = () => {
    // This would be implemented to capture the audio blob and pass it to onSubmit
    // For now, we'll pass a placeholder
    console.log('Voice recording ended');
    // onSubmit({ type: 'voice', data: audioBlobPlaceholder });
  };

  const handleTranscript = (transcript: string) => {
    console.log('Transcript received:', transcript);
  };

  return (
    <Card className="max-w-lg mx-auto mt-8 w-full sm:max-w-lg" aria-label="Practice Objection Handling">
      <CardContent className="p-6 flex flex-col gap-4">
        <h2 className="text-lg font-semibold mb-2">Scenario: {scenario}</h2>
        
        <div className="flex gap-2 mb-4" role="group" aria-label="Choose practice mode">
          <Button 
            variant={mode === 'voice' ? 'default' : 'outline'} 
            onClick={() => setMode('voice')} 
            aria-pressed={mode === 'voice'}
            className="flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Practice with Voice
          </Button>
          <Button 
            variant={mode === 'text' ? 'default' : 'outline'} 
            onClick={() => setMode('text')} 
            aria-pressed={mode === 'text'}
            className="flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Practice with Text
          </Button>
        </div>

        {mode === 'voice' ? (
          <DemoRecorder
            maxDuration={60}
            onEnd={handleVoiceEnd}
            onTranscript={handleTranscript}
            error={null}
            loadingTranscript={false}
            transcript={null}
          />
        ) : (
          <form onSubmit={handleTextSubmit} className="space-y-4">
            <Textarea
              className="w-full min-h-[80px] resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Type your pitch or objection handling response here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              aria-label="Text response input"
              disabled={submitting}
            />
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={submitting || !text.trim()}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Submit text response"
              >
                {submitting ? 'Submitting...' : 'Submit Text Response'}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default PracticeObjection;
