export type BlockchainType = 
  | 'Ethereum' 
  | 'Bitcoin' 
  | 'Tron' 
  | 'BNB' 
  | 'Solana' 
  | 'Polygon';

export type AttributionTier = 
  | 'CONFIRMED' 
  | 'HIGHLY_LIKELY' 
  | 'PROBABLE' 
  | 'POSSIBLE' 
  | 'INSUFFICIENT_DATA';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ServiceType = 
  | 'MIXER' 
  | 'TUMBLER' 
  | 'BRIDGE' 
  | 'SWAP_SERVICE' 
  | 'EXCHANGE' 
  | 'CUSTODIAL_SERVICE' 
  | 'DEFI_PROTOCOL' 
  | 'UNKNOWN';

export type ExposureMode = 'DIRECT' | 'INDIRECT';

export type ProvenanceSource = 
  | 'LIVE_BLOCKCHAIN_DATA' 
  | 'CURATED_INTELLIGENCE' 
  | 'KNOWN_SERVICE_DATABASE' 
  | 'DERIVED_BEHAVIORAL_RULE' 
  | 'DEMO_FIXTURE';

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
  status: 'RESOLVED' | 'MULTIPLE_NETWORKS' | 'NO_ACTIVITY' | 'LIVE_DATA_UNAVAILABLE' | 'INVALID_ADDRESS';
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
