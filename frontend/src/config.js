// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3
};

// Feature Flags
export const FEATURES = {
  VOICE_INPUT: true,
  IMAGE_UPLOAD: false, // Coming soon
  BATCH_ANALYSIS: false, // Coming soon
  EXPORT_RESULTS: true
};

// UI Configuration
export const UI_CONFIG = {
  ANIMATION_DURATION: 200,
  LOADING_TIMEOUT: 5000,
  MAX_REVIEW_LENGTH: 5000,
  MIN_REVIEW_LENGTH: 5
}; 