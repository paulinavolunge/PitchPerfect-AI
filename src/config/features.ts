// Feature flags for controlling app functionality
export const FEATURE_FLAGS = {
  PAYMENTS_ENABLED: false, // Set to false to hide all payment features
  PRICING_ENABLED: false,  // Set to false to hide pricing page and related components
  SUBSCRIPTION_ENABLED: false, // Set to false to hide subscription management
  PREMIUM_FEATURES_ENABLED: false, // Set to false to hide premium feature promotions
} as const;

export const isPaymentsEnabled = () => FEATURE_FLAGS.PAYMENTS_ENABLED;
export const isPricingEnabled = () => FEATURE_FLAGS.PRICING_ENABLED;
export const isSubscriptionEnabled = () => FEATURE_FLAGS.SUBSCRIPTION_ENABLED;
export const isPremiumFeaturesEnabled = () => FEATURE_FLAGS.PREMIUM_FEATURES_ENABLED;