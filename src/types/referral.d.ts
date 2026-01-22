
declare interface ReferralInfo {
  code: string;
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  rewardsEarned: number; // Number of free months earned
}

declare interface TimeOfferProps {
  expiryDate: Date;
  discount: string;
  description: string;
  variant?: 'banner' | 'card';
  ctaText?: string;
  ctaLink?: string;
  onClose?: () => void;
}
