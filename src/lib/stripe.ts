import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with publishable key
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.warn('[Stripe] Publishable key not found. Payment functionality will be disabled.');
}

export const stripePromise = stripePublishableKey 
  ? loadStripe(stripePublishableKey)
  : null;

// Helper function to get Stripe instance
export const getStripe = async () => {
  if (!stripePromise) {
    throw new Error('Stripe is not configured. Please add VITE_STRIPE_PUBLISHABLE_KEY to your environment variables.');
  }
  return stripePromise;
};