
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Gift, Copy, Share2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface ReferralStats {
  totalReferrals: number;
  pendingReferrals: number;
  successfulReferrals: number;
  monthsEarned: number;
}

const ReferralProgram = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  // In a real implementation, this would come from the backend
  const referralStats: ReferralStats = {
    totalReferrals: 5,
    pendingReferrals: 2,
    successfulReferrals: 3,
    monthsEarned: 3
  };
  
  // Generate a unique referral code based on user ID
  const referralCode = user?.id ? `${user.id.substring(0, 8)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}` : '';
  
  const referralLink = `${window.location.origin}/signup?ref=${referralCode}`;
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({
      title: "Link copied!",
      description: "Referral link copied to clipboard",
    });
    
    // Reset copied state after 2 seconds
    setTimeout(() => setCopied(false), 2000);
  };
  
  const shareViaEmail = () => {
    const subject = "Try PitchPerfect AI - Get better at sales pitches";
    const body = `Hey,\n\nI've been using PitchPerfect AI to improve my sales pitches and thought you might find it useful too.\n\nUse my referral link to get started: ${referralLink}\n\nBest,\n${user?.user_metadata?.first_name || 'A friend'}`;
    
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-purple-100 to-blue-50 pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl text-brand-dark">Referral Program</CardTitle>
          <Gift className="h-6 w-6 text-purple-500" />
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <h3 className="text-lg font-medium text-purple-800 mb-2">Refer & Get Rewarded</h3>
            <p className="text-sm text-gray-700 mb-4">
              For every friend who signs up using your referral link and becomes a premium user, 
              you'll get <span className="font-semibold">1 month of free premium access</span>.
            </p>
            
            <div className="flex space-x-2">
              <Input 
                value={referralLink} 
                readOnly 
                className="bg-white text-sm"
              />
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-shrink-0 border-purple-300 hover:bg-purple-50 text-purple-700" 
                onClick={copyToClipboard}
              >
                {copied ? "Copied!" : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-500">Successful Referrals</p>
              <p className="text-2xl font-bold text-gray-900">{referralStats.successfulReferrals}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-500">Free Months Earned</p>
              <p className="text-2xl font-bold text-purple-600">{referralStats.monthsEarned}</p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 pb-6 flex flex-col space-y-2">
        <Button
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          onClick={shareViaEmail}
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share via Email
        </Button>
        <div className="text-xs text-center text-gray-500 mt-2">
          Pending invites: {referralStats.pendingReferrals}
        </div>
      </CardFooter>
    </Card>
  );
};

export default ReferralProgram;
