
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Bot, Info } from 'lucide-react';

interface AISettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AISettingsModal: React.FC<AISettingsModalProps> = ({ open, onOpenChange }) => {
  const [aiDisclosureLevel, setAiDisclosureLevel] = useState<'standard' | 'minimal' | 'detailed'>('standard');
  const [showBadges, setShowBadges] = useState(true);
  const [showDisclosures, setShowDisclosures] = useState(true);
  
  const handleSave = () => {
    // Save settings to localStorage or your backend
    localStorage.setItem('aiSettings', JSON.stringify({
      disclosureLevel: aiDisclosureLevel,
      showBadges,
      showDisclosures
    }));
    
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot size={18} className="text-purple-600" />
            AI Content Settings
          </DialogTitle>
          <DialogDescription>
            Customize how AI-generated content is labeled throughout the app
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <h3 className="font-medium text-sm">AI Disclosure Level</h3>
            <RadioGroup 
              value={aiDisclosureLevel} 
              onValueChange={(value) => setAiDisclosureLevel(value as 'standard' | 'minimal' | 'detailed')}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="minimal" id="minimal" />
                <Label htmlFor="minimal">Minimal - Basic AI indicators only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="standard" id="standard" />
                <Label htmlFor="standard">Standard - Clear AI labeling (Recommended)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="detailed" id="detailed" />
                <Label htmlFor="detailed">Detailed - Comprehensive AI explanations</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show-badges" className="font-medium">Show AI Badges</Label>
                <p className="text-sm text-muted-foreground">Display badges on AI-generated content</p>
              </div>
              <Switch id="show-badges" checked={showBadges} onCheckedChange={setShowBadges} />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show-disclosures" className="font-medium">Show AI Disclosures</Label>
                <p className="text-sm text-muted-foreground">Show disclosure notices on pages with AI content</p>
              </div>
              <Switch id="show-disclosures" checked={showDisclosures} onCheckedChange={setShowDisclosures} />
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-100 rounded-md p-3 text-sm">
            <div className="flex gap-2">
              <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-blue-800">
                <p className="font-medium mb-1">Google Play Guidelines Compliance</p>
                <p>These settings help ensure the app meets Google Play's guidelines for transparency in AI-generated content. We recommend keeping all labels enabled.</p>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} className="bg-purple-600 hover:bg-purple-700">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AISettingsModal;
