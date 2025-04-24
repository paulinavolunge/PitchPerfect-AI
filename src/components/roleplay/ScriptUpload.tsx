
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface ScriptUploadProps {
  onScriptSubmit: (script: string) => void;
}

const ScriptUpload: React.FC<ScriptUploadProps> = ({ onScriptSubmit }) => {
  const [script, setScript] = useState('');
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setScript(text);
        toast({
          title: "Script Uploaded",
          description: "Your sales script has been loaded successfully.",
        });
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (script.trim()) {
      onScriptSubmit(script);
      toast({
        title: "Script Saved",
        description: "Your script is ready for practice.",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <input
          type="file"
          accept=".txt"
          onChange={handleFileUpload}
          className="hidden"
          id="script-upload"
        />
        <label
          htmlFor="script-upload"
          className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 hover:text-gray-800"
        >
          <Button variant="outline" className="gap-2">
            <Upload size={18} />
            Upload Script
          </Button>
        </label>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder="Paste or type your sales script here..."
          className="min-h-[200px]"
        />
        <Button 
          type="submit" 
          disabled={!script.trim()}
          className="w-full"
        >
          Save Script
        </Button>
      </form>
    </div>
  );
};

export default ScriptUpload;
