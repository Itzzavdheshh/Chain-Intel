/**
 * Typology Rule Engine Thresholds & Configurations
 * Centralized, configurable, deterministic thresholds.
 * Disclaimers: These are heuristic thresholds for investigative context, not legal determinations.
 */

export const TYPOLOGY_CONFIG = {
  // Rapid movement threshold in seconds (default: 300s / 5 minutes)
  RAPID_MOVEMENT_MAX_SECONDS: 300,

  // Peel chain retention ratio (default: sends onward >= 75% of value received, retaining <= 25%)
  PEEL_CHAIN_MIN_ONWARD_RATIO: 0.75,

  // Peel chain minimum sequence hops
  PEEL_CHAIN_MIN_HOPS: 2,

  // Fund splitting minimum distinct outbound recipients from a single inflow
  SPLITTING_MIN_OUTPUTS: 3,

  // Fund consolidation minimum distinct inbound senders into a single node
  CONSOLIDATION_MIN_INPUTS: 3,

  // Structuring: minimum number of similar value transfers under a target threshold
  STRUCTURING_MIN_TX_COUNT: 3,
  // Structuring: max time window in seconds between structured transfers (e.g. 3600s / 1 hour)
  STRUCTURING_TIME_WINDOW_SECONDS: 3600,
};