export const CROSS_CHAIN_CONFIG = {
  MAX_TIME_DELTA_SECONDS: 600, // 10 minutes window for temporal correlation
  MAX_VALUE_DELTA_PERCENT: 5.0, // 5% tolerance for bridge fees & slippage
  HIGH_CONFIDENCE_THRESHOLD: 85,
  MEDIUM_CONFIDENCE_THRESHOLD: 60,
  LOW_CONFIDENCE_THRESHOLD: 40,
};
