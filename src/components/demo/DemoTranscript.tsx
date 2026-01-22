
import React from 'react';

interface DemoTranscriptProps {
  text: string;
  isRecording: boolean;
}

const DemoTranscript: React.FC<DemoTranscriptProps> = ({ text, isRecording }) => {
  return (
    <div className="border rounded-lg p-4 min-h-[150px] bg-white">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-brand-dark">Your Pitch</h3>
        {isRecording && (
          <div className="flex items-center">
            <span className="h-3 w-3 bg-red-500 rounded-full mr-2 animate-pulse"></span>
            <span className="text-sm text-brand-dark/70">Recording</span>
          </div>
        )}
      </div>
      
      {text ? (
        <p className="text-brand-dark/80">{text}</p>
      ) : (
        <p className="text-brand-dark/50 italic">
          {isRecording ? "Start speaking..." : "Transcript will appear here when you start the demo"}
        </p>
      )}
    </div>
  );
};

export default DemoTranscript;
