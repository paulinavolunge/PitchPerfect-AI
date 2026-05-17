export const STRIPE = {
  starter: 'https://buy.stripe.com/cNifZjcsR2YadjI68W5sA00',
  power:   'https://buy.stripe.com/14AfZjboN9myenM2WK5sA01',
  solo:    'https://buy.stripe.com/14A14pakJ7eq4NceFs5sA02',
} as const;

export interface BillingOption {
  amount:     string;   // "$23"
  period:     string;   // "/mo"
  subtext:    string;   // "billed $276/yr · save $72"
  saveBadge?: string;   // "Save $72/yr"
  ctaLabel:   string;
}

export const SOLO: Record<'monthly' | 'annual', BillingOption> = {
  monthly: {
    amount:   '$29',
    period:   '/mo',
    subtext:  'unlimited rounds · cancel anytime',
    ctaLabel: 'Go Unlimited — $29/mo',
  },
  annual: {
    amount:    '$23',
    period:    '/mo',
    subtext:   'billed $276/yr · save $72',
    saveBadge: 'Save $72/yr',
    ctaLabel:  'Go Unlimited — $23/mo',
  },
};

export const TEAM: Record<'monthly' | 'annual', BillingOption> = {
  monthly: {
    amount:   '$49',
    period:   '/seat/mo',
    subtext:  '3-seat minimum',
    ctaLabel: 'Contact for Team Access',
  },
  annual: {
    amount:    '$39',
    period:    '/seat/mo',
    subtext:   'billed $468/seat/yr · save $120',
    saveBadge: 'Save $120/seat/yr',
    ctaLabel:  'Contact for Team Access',
  },
};
