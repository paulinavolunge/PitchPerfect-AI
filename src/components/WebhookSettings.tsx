
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { ValidatedInput } from '@/components/ui/validated-input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CRMProvider, getStoredWebhookUrl, saveWebhookUrl } from '@/utils/webhookUtils';
import { validateUrl } from '@/utils/formValidation';
import { CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

interface WebhookSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const crmOptions: { value: CRMProvider; label: string; helpUrl?: string }[] = [
  { value: "zapier", label: "Zapier", helpUrl: "https://zapier.com/help/create/webhooks" },
  { value: "hubspot", label: "HubSpot", helpUrl: "https://developers.hubspot.com/docs/api/webhooks" },
  { value: "salesforce", label: "Salesforce", helpUrl: "https://help.salesforce.com/s/articleView?id=sf.workflow_outbound_messaging.htm" },
  { value: "freshsales", label: "Freshsales", helpUrl: "https://developers.freshworks.com/freshsales/api/#webhooks" },
  { value: "custom", label: "Custom Webhook" },
];

const WebhookSettings: React.FC<WebhookSettingsProps> = ({ open, onOpenChange }) => {
  const [selectedProvider, setSelectedProvider] = useState<CRMProvider>("zapier");
  const [webhookUrl, setWebhookUrl] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string>("");
  const { toast } = useToast();
  
  useEffect(() => {
    const storedUrl = getStoredWebhookUrl(selectedProvider);
    setWebhookUrl(storedUrl || "");
    setValidationError("");
  }, [selectedProvider]);
  
  const validateWebhookUrl = (url: string): string | undefined => {
    if (!url.trim()) {
      return "Webhook URL is required";
    }
    
    if (!validateUrl(url)) {
      return "Please enter a valid URL (e.g., https://example.com/webhook)";
    }
    
    if (!url.startsWith('https://')) {
      return "Webhook URL must use HTTPS for security";
    }
    
    return undefined;
  };

  const handleSave = async () => {
    const error = validateWebhookUrl(webhookUrl);
    if (error) {
      setValidationError(error);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Simulate API validation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      saveWebhookUrl(selectedProvider, webhookUrl);
      
      toast({
        title: "Settings saved successfully!",
        description: `${crmOptions.find(opt => opt.value === selectedProvider)?.label} webhook URL has been saved`,
        action: (
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        ),
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Failed to save settings",
        description: "Please check your connection and try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const selectedOption = crmOptions.find(opt => opt.value === selectedProvider);
  const isFormValid = webhookUrl.trim() && !validateWebhookUrl(webhookUrl);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>CRM Integration Settings</DialogTitle>
          <DialogDescription>
            Configure your CRM webhook URLs to automatically push data from PitchPerfect AI.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label htmlFor="crm-provider" className="text-sm font-medium">
              CRM Provider
            </Label>
            <Select
              value={selectedProvider}
              onValueChange={(value) => setSelectedProvider(value as CRMProvider)}
            >
              <SelectTrigger id="crm-provider" className="w-full">
                <SelectValue placeholder="Select CRM provider" />
              </SelectTrigger>
              <SelectContent>
                {crmOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedOption?.helpUrl && (
              <div className="flex items-center gap-2">
                <a 
                  href={selectedOption.helpUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  View {selectedOption.label} webhook documentation
                </a>
              </div>
            )}
          </div>
          
          <ValidatedInput
            id="webhook-url"
            label="Webhook URL"
            placeholder="https://your-crm.com/webhook/endpoint"
            value={webhookUrl}
            onChange={setWebhookUrl}
            validateOnChange={validateWebhookUrl}
            error={validationError}
            success={isFormValid}
            hint="This URL will receive data when pitch analysis is completed"
            required
            className="w-full"
          />
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-900 mb-1">What data will be sent?</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Contact information and email</li>
              <li>• Pitch analysis results and scores</li>
              <li>• Improvement recommendations</li>
              <li>• Session metadata and timestamps</li>
            </ul>
          </div>
        </div>
        
        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!isFormValid || isSubmitting}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WebhookSettings;
