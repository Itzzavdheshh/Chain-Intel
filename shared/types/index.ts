export type BlockchainType = 
  | "Ethereum" 
  | "Bitcoin" 
  | "Tron" 
  | "BNB" 
  | "Solana" 
  | "Polygon";

export type AttributionTier = 
  | "CONFIRMED" 
  | "HIGHLY_LIKELY" 
  | "PROBABLE" 
  | "POSSIBLE" 
  | "INSUFFICIENT_DATA";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type ServiceType = 
  | "MIXER" 
  | "TUMBLER" 
  | "BRIDGE" 
  | "SWAP_SERVICE" 
  | "EXCHANGE" 
  | "CUSTODIAL_SERVICE" 
  | "DEFI_PROTOCOL" 
  | "UNKNOWN";

export type ExposureMode = "DIRECT" | "INDIRECT";

export type ProvenanceSource = 
  | "LIVE_BLOCKCHAIN_DATA" 
  | "CURATED_INTELLIGENCE" 
  | "KNOWN_SERVICE_DATABASE" 
  | "DERIVED_BEHAVIORAL_RULE" 
  | "DEMO_FIXTURE";

export type WalletRole = 
  | "DEPOSIT_WALLET" 
  | "HOT_WALLET" 
  | "COLD_WALLET" 
  | "TREASURY" 
  | "OPERATIONAL" 
  | "UNKNOWN";

export type WalletRoleStatus = 
  | "KNOWN_INTELLIGENCE_MATCH" 
  | "HOT_WALLET_INDICATOR" 
  | "COLD_WALLET_INDICATOR" 
  | "BEHAVIORAL_HEURISTIC" 
  | "UNATTRIBUTED";

export type AttributionConfidenceLevel = 
  | "VERIFIED" 
  | "HIGH_CONFIDENCE" 
  | "PROBABLE" 
  | "POSSIBLE" 
  | "INSUFFICIENT_DATA";

export type CorrelationSignal = 
  | "KNOWN_BRIDGE_MATCH"
  | "SERVICE_IDENTITY_MATCH"
  | "TEMPORAL_PROXIMITY"
  | "VALUE_PROXIMITY"
  | "ASSET_RELATIONSHIP"
  | "DESTINATION_REFERENCE"
  | "BRIDGE_EVENT_CORRELATION"
  | "TOKEN_MINT_BURN_RELATIONSHIP"
  | "PROVIDER_METADATA"
  | "CURATED_INTELLIGENCE";

export type CorrelationMethod = 
  | "EXPLICIT_SERVICE_CORRELATION"
  | "BRIDGE_EVENT_CORRELATION"
  | "TEMPORAL_VALUE_CORRELATION"
  | "SERVICE_ONLY_CORRELATION";

export type CorrelationStatus = 
  | "CONFIRMED_BRIDGE_TRANSFER" 
  | "POTENTIAL_CORRELATION" 
  | "SERVICE_INTERACTION_ONLY" 
  | "UNESTABLISHED";

export interface CrossChainCorrelation {
  id: string;
  sourceChain: BlockchainType;
  sourceTxHash: string;
  sourceAddress: string;
  sourceAsset: string;
  sourceAmount: number;
  sourceTimestamp: string;

  destinationChain?: BlockchainType;
  destinationTxHash?: string;
  destinationAddress?: string;
  destinationAsset?: string;
  destinationAmount?: number;
  destinationTimestamp?: string;

  bridgeServiceKey?: string;
  bridgeServiceName?: string;
  correlationMethod: CorrelationMethod;
  correlationSignals: CorrelationSignal[];
  correlationStatus: CorrelationStatus;
  observedTimeDeltaSeconds?: number;
  observedValueDeltaPercent?: number;
  confidenceLevel: AttributionConfidenceLevel;
  confidenceScore: number;
  provenanceSource: ProvenanceSource;
  reasons: string[];
  limitations: string;
  disclaimer: string;
}

export interface VASPClusterInfo {
  clusterId: string;
  clusterName: string;
  entityName: string;
  primaryRole: WalletRole;
  memberCount?: number;
  description: string;
}

export interface AttributionCandidate {
  vaspKey: string;
  vaspName: string;
  entityType: "VASP" | "EXCHANGE" | "CUSTODIAL_SERVICE" | "OTHER_SERVICE";
  walletRole: WalletRole;
  confidenceScore: number;
  confidenceLevel: AttributionConfidenceLevel;
  evidence: string[];
  provenanceSource: ProvenanceSource;
  reasons: string[];
  limitations: string;
}

export interface VASPEvaluationResult {
  isAttributed: boolean;
  matchedEntity?: string;
  vaspKey?: string;
  entityType: "VASP" | "EXCHANGE" | "CUSTODIAL_SERVICE" | "OTHER_SERVICE" | "UNKNOWN";
  primaryRole: WalletRole;
  additionalRoles?: WalletRole[];
  roleStatus: WalletRoleStatus;
  confidenceLevel: AttributionConfidenceLevel;
  confidenceScore: number;
  clusterInfo?: VASPClusterInfo;
  jurisdiction?: string;
  complianceContact?: string;
  isDomestic?: boolean;
  provenanceSource: ProvenanceSource;
  reasons: string[];
  limitations: string;
  candidates: AttributionCandidate[];
  disclaimer: string;
}

export interface NetworkMatch {
  chain: string;
  chainId: number;
  name: string;
  hasActivity: boolean;
  evidence?: {
    transactionCount: number;
    latestBlock?: string;
    latestActivity?: string;
  };
}

export interface ChainResolutionResult {
  address: string;
  isValidAddress: boolean;
  status: "RESOLVED" | "MULTIPLE_NETWORKS" | "NO_ACTIVITY" | "LIVE_DATA_UNAVAILABLE" | "INVALID_ADDRESS";
  matches: NetworkMatch[];
  message?: string;
}

export interface ServiceMatchResult {
  isMatch: boolean;
  serviceKey?: string;
  serviceName?: string;
  serviceType: ServiceType;
  category: string;
  provenanceSource: ProvenanceSource;
  confidenceScore: number;
  explanation: string;
  jurisdiction?: string;
  complianceContact?: string;
  isSanctioned?: boolean;
  disclaimer?: string;
  exposureMode?: ExposureMode;
  matchedAddress?: string;
}

export interface SahyogPayload {
  caseReference: string;
  agency: string;
  investigatorId: string;
  targetWallet: string;
  blockchain: BlockchainType;
  nearestDirectDepositVASP: string;
  confidenceTier: AttributionTier;
  confidenceScore: number;
  evidenceSummary: string;
  reportHash: string;
  timestamp: string;
}
