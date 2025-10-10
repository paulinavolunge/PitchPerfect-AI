
export interface ApiResponse<T = unknown> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  subscription_tier: 'free' | 'premium' | 'team';
  created_at: string;
  updated_at: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  language: string;
  timezone: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  marketing: boolean;
}

export interface PrivacySettings {
  analytics: boolean;
  dataCollection: boolean;
  thirdPartySharing: boolean;
}

export interface SubscriptionInfo {
  tier: 'free' | 'premium' | 'team';
  status: 'active' | 'inactive' | 'cancelled' | 'past_due';
  current_period_end: string;
  cancel_at_period_end: boolean;
  features: string[];
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
}

export interface FileUploadResponse {
  id: string;
  url: string;
  filename: string;
  size: number;
  type: string;
  uploaded_at: string;
}
