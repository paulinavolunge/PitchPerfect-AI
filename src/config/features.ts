// Feature flags for controlling app functionality

export const FEATURE_FLAGS = {
  PAYMENTS_ENABLED: true,
  PRICING_ENABLED: true,
  SUBSCRIPTION_ENABLED: true,
  PREMIUM_FEATURES_ENABLED: true,
} as const;

export const isPaymentsEnabled = () => FEATURE_FLAGS.PAYMENTS_ENABLED;
export const isPricingEnabled = () => FEATURE_FLAGS.PRICING_ENABLED;
export const isSubscriptionEnabled = () => FEATURE_FLAGS.SUBSCRIPTION_ENABLED;
export const isPremiumFeaturesEnabled = () => FEATURE_FLAGS.PREMIUM_FEATURES_ENABLED;
