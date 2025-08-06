
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload, CheckCircle, FileText, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface ScriptUploadProps {
  onScriptUpload: (script: string) => void;
}

const ScriptUpload: React.FC<ScriptUploadProps> = ({ onScriptUpload }) => {
  const [script, setScript] = useState('');
  const [isScriptUploaded, setIsScriptUploaded] = useState(false);
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's a PDF file
    if (file.type === 'application/pdf') {
      setIsProcessingPdf(true);
      try {
        // Import pdf-parse dynamically to avoid build issues
        const pdfParse = (await import('pdf-parse')).default;
        
        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Parse PDF
        const data = await pdfParse(buffer);
        const extractedText = data.text;
        
        if (extractedText.trim()) {
          setScript(extractedText);
          setIsScriptUploaded(true);
          toast({
            title: "PDF Processed Successfully",
            description: `Extracted ${extractedText.length} characters from your PDF.`,
          });
        } else {
          toast({
            title: "No Text Found",
            description: "The PDF appears to be empty or contains only images.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error parsing PDF:", error);
        toast({
          title: "PDF Processing Failed",
          description: "Could not extract text from the PDF file. Please try a different file or paste text manually.",
          variant: "destructive",
        });
      } finally {
        setIsProcessingPdf(false);
      }
    } else if (file.type === 'text/plain') {
      // Handle text files as before
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          setScript(text);
          setIsScriptUploaded(true);
          toast({
            title: "Text File Uploaded",
            description: "Your text file has been loaded successfully.",
          });
        } catch (error) {
          console.error("Error reading file:", error);
          toast({
            title: "Error",
            description: "Failed to read the uploaded file.",
            variant: "destructive",
          });
        }
      };
      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to read the uploaded file.",
          variant: "destructive",
        });
      };
      reader.readAsText(file);
    } else {
      toast({
        title: "Unsupported File Type",
        description: "Please upload a PDF (.pdf) or text (.txt) file.",
        variant: "destructive",
      });
    }

    // Clear the input so the same file can be uploaded again
    event.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (script.trim()) {
      onScriptUpload(script);
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
          accept=".txt,.pdf"
          onChange={handleFileUpload}
          className="hidden"
          id="script-upload"
          disabled={isProcessingPdf}
        />
        <label
          htmlFor="script-upload"
          className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 hover:text-gray-800"
        >
          <Button variant="outline" className="gap-2" disabled={isProcessingPdf}>
            {isProcessingPdf ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processing PDF...
              </>
            ) : (
              <>
                <Upload size={18} />
                Upload Script (PDF/TXT)
              </>
            )}
          </Button>
        </label>
        
        {isScriptUploaded && (
          <div className="flex items-center text-green-600 font-medium">
            <CheckCircle size={20} className="mr-2" />
            Script uploaded successfully!
          </div>
        )}
        
        {isProcessingPdf && (
          <div className="flex items-center text-blue-600 font-medium">
            <FileText size={20} className="mr-2" />
            Extracting text from PDF...
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder="Paste or type your sales script here, or upload a PDF/TXT file above..."
          className="min-h-[200px]"
          disabled={isProcessingPdf}
        />
        <Button 
          type="submit" 
          disabled={!script.trim() || isProcessingPdf}
          className="w-full"
        >
          Save Script
        </Button>
      </form>
    </div>
  );
};

export default ScriptUpload;
