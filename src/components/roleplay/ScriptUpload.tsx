
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload, CheckCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface ScriptUploadProps {
  onScriptSubmit: (script: string) => void;
}

const ScriptUpload: React.FC<ScriptUploadProps> = ({ onScriptSubmit }) => {
  const [script, setScript] = useState('');
  const [isScriptUploaded, setIsScriptUploaded] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          setScript(text);
          setIsScriptUploaded(true);
          toast({
            title: "Script Uploaded",
            description: "Your sales script has been loaded successfully.",
          });
        } catch (error) {
          console.error("Error reading file:", error);
          toast({
            title: "Error",
            description: "Failed to read the uploaded script.",
            variant: "destructive",
          });
        }
      };
      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to read the uploaded script.",
          variant: "destructive",
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
      setIsScriptUploaded(false);
    } else {
      toast({
        title: "Error",
        description: "Please enter or upload a script first.",
        variant: "destructive",
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
        {isScriptUploaded && (
          <div className="flex items-center text-green-600 font-medium">
            <CheckCircle size={20} className="mr-2" />
            Script uploaded successfully!
          </div>
        )}
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
