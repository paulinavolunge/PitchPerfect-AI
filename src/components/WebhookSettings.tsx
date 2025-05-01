
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
import { Input } from '@/components/ui/input';
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

interface WebhookSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const crmOptions: { value: CRMProvider; label: string }[] = [
  { value: "zapier", label: "Zapier" },
  { value: "hubspot", label: "HubSpot" },
  { value: "salesforce", label: "Salesforce" },
  { value: "freshsales", label: "Freshsales" },
  { value: "custom", label: "Custom Webhook" },
];

const WebhookSettings: React.FC<WebhookSettingsProps> = ({ open, onOpenChange }) => {
  const [selectedProvider, setSelectedProvider] = useState<CRMProvider>("zapier");
  const [webhookUrl, setWebhookUrl] = useState<string>("");
  const { toast } = useToast();
  
  useEffect(() => {
    // Load webhook URL when provider changes
    const storedUrl = getStoredWebhookUrl(selectedProvider);
    setWebhookUrl(storedUrl || "");
  }, [selectedProvider]);
  
  const handleSave = () => {
    if (!webhookUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a webhook URL",
        variant: "destructive",
      });
      return;
    }
    
    saveWebhookUrl(selectedProvider, webhookUrl);
    
    toast({
      title: "Settings saved",
      description: `${crmOptions.find(opt => opt.value === selectedProvider)?.label} webhook URL has been saved`,
    });
    
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>CRM Integration Settings</DialogTitle>
          <DialogDescription>
            Configure your CRM webhook URLs to automatically push data from PitchPerfect AI.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="crm-provider">CRM Provider</Label>
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
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="webhook-url">Webhook URL</Label>
            <Input
              id="webhook-url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="Enter your webhook URL"
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Paste the webhook URL from your CRM provider. This URL will receive data when actions are completed.
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WebhookSettings;
