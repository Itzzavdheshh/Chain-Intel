import { 
  BlockchainType, 
  CrossChainCorrelation, 
  CorrelationMethod, 
  CorrelationSignal, 
  CorrelationStatus,
  AttributionConfidenceLevel,
  ProvenanceSource
} from "../../types/index";
import { CROSS_CHAIN_CONFIG } from "./correlationConfig";
import { classifyAddressService } from "../service/serviceIntelligence";

export interface SourceTxContext {
  txHash: string;
  chain: BlockchainType;
  address: string;
  toAddress: string;
  amount: number;
  asset: string;
  timestamp: string;
}

export interface TargetTxCandidate {
  txHash: string;
  chain: BlockchainType;
  address: string;
  toAddress: string;
  amount: number;
  asset: string;
  timestamp: string;
  bridgeMetadataRef?: string;
}

export function correlateCrossChainEvent(
  sourceTx: SourceTxContext,
  candidates: TargetTxCandidate[] = []
): CrossChainCorrelation[] {
  const correlations: CrossChainCorrelation[] = [];
  const sourceService = classifyAddressService(sourceTx.toAddress, sourceTx.chain);

  const isKnownBridge = sourceService.isMatch && sourceService.serviceType === "BRIDGE";
  const bridgeName = isKnownBridge ? sourceService.serviceName : "Cross-Chain Bridge / Router";
  const bridgeKey = isKnownBridge ? sourceService.serviceKey : "unknown_bridge";

  if (candidates.length === 0) {
    if (isKnownBridge) {
      correlations.push({
        id: "corr-method-d-" + sourceTx.txHash.slice(0, 10),
        sourceChain: sourceTx.chain,
        sourceTxHash: sourceTx.txHash,
        sourceAddress: sourceTx.address,
        sourceAsset: sourceTx.asset,
        sourceAmount: sourceTx.amount,
        sourceTimestamp: sourceTx.timestamp,
        bridgeServiceKey: bridgeKey,
        bridgeServiceName: bridgeName,
        correlationMethod: "SERVICE_ONLY_CORRELATION",
        correlationSignals: ["KNOWN_BRIDGE_MATCH"],
        correlationStatus: "SERVICE_INTERACTION_ONLY",
        confidenceLevel: "POSSIBLE",
        confidenceScore: 40,
        provenanceSource: "KNOWN_SERVICE_DATABASE",
        reasons: [
          "Source transaction " + sourceTx.txHash.slice(0, 10) + "... interacted with known bridge protocol " + bridgeName + " on " + sourceTx.chain + ".",
          "Destination-side continuation is not established from available RPC provider telemetry."
        ],
        limitations: "Bridge interaction detected; destination-side continuation not established. No fake destination addresses injected.",
        disclaimer: "Service interaction only; destination wallet unestablished."
      });
    }
    return correlations;
  }

  for (const cand of candidates) {
    const timeDeltaSec = Math.abs((new Date(cand.timestamp).getTime() - new Date(sourceTx.timestamp).getTime()) / 1000);
    const valueRatio = sourceTx.amount > 0 ? (cand.amount / sourceTx.amount) : 1.0;
    const valueDeltaPercent = Math.abs(1.0 - valueRatio) * 100;

    const signals: CorrelationSignal[] = [];

    if (isKnownBridge) signals.push("KNOWN_BRIDGE_MATCH");
    if (cand.bridgeMetadataRef) {
      signals.push("BRIDGE_EVENT_CORRELATION");
      signals.push("DESTINATION_REFERENCE");
    }
    if (timeDeltaSec <= CROSS_CHAIN_CONFIG.MAX_TIME_DELTA_SECONDS) {
      signals.push("TEMPORAL_PROXIMITY");
    }
    if (valueDeltaPercent <= CROSS_CHAIN_CONFIG.MAX_VALUE_DELTA_PERCENT) {
      signals.push("VALUE_PROXIMITY");
    }
    if (cand.asset === sourceTx.asset || cand.asset.includes(sourceTx.asset) || sourceTx.asset.includes(cand.asset)) {
      signals.push("ASSET_RELATIONSHIP");
    }

    let method: CorrelationMethod = "TEMPORAL_VALUE_CORRELATION";
    let status: CorrelationStatus = "POTENTIAL_CORRELATION";
    let confLevel: AttributionConfidenceLevel = "POSSIBLE";
    let score = 55;
    let prov: ProvenanceSource = "DERIVED_BEHAVIORAL_RULE";

    if (cand.bridgeMetadataRef && isKnownBridge) {
      method = "EXPLICIT_SERVICE_CORRELATION";
      status = "CONFIRMED_BRIDGE_TRANSFER";
      confLevel = "HIGH_CONFIDENCE";
      score = 90;
      prov = "CURATED_INTELLIGENCE";
    } else if (signals.includes("TEMPORAL_PROXIMITY") && signals.includes("VALUE_PROXIMITY") && isKnownBridge) {
      method = "TEMPORAL_VALUE_CORRELATION";
      status = "POTENTIAL_CORRELATION";
      confLevel = "PROBABLE";
      score = 75;
      prov = "DERIVED_BEHAVIORAL_RULE";
    }

    const reasons: string[] = [
      "Source " + sourceTx.chain + " transaction (" + sourceTx.amount + " " + sourceTx.asset + ") correlated to " + cand.chain + " destination transaction (" + cand.amount + " " + cand.asset + ").",
      "Observed time delta: " + Math.round(timeDeltaSec) + "s (threshold <= " + CROSS_CHAIN_CONFIG.MAX_TIME_DELTA_SECONDS + "s).",
      "Observed value variance: " + valueDeltaPercent.toFixed(2) + "% (threshold <= " + CROSS_CHAIN_CONFIG.MAX_VALUE_DELTA_PERCENT + "%)."
    ];

    correlations.push({
      id: "corr-" + sourceTx.txHash.slice(0, 8) + "-" + cand.txHash.slice(0, 8),
      sourceChain: sourceTx.chain,
      sourceTxHash: sourceTx.txHash,
      sourceAddress: sourceTx.address,
      sourceAsset: sourceTx.asset,
      sourceAmount: sourceTx.amount,
      sourceTimestamp: sourceTx.timestamp,
      destinationChain: cand.chain,
      destinationTxHash: cand.txHash,
      destinationAddress: cand.toAddress || cand.address,
      destinationAsset: cand.asset,
      destinationAmount: cand.amount,
      destinationTimestamp: cand.timestamp,
      bridgeServiceKey: bridgeKey,
      bridgeServiceName: bridgeName,
      correlationMethod: method,
      correlationSignals: signals,
      correlationStatus: status,
      observedTimeDeltaSeconds: Math.round(timeDeltaSec),
      observedValueDeltaPercent: parseFloat(valueDeltaPercent.toFixed(2)),
      confidenceLevel: confLevel,
      confidenceScore: score,
      provenanceSource: prov,
      reasons,
      limitations: "Cross-chain correlation connects observed blockchain events across networks using telemetry and heuristics. It does NOT independently establish real-world legal identity of the destination wallet holder.",
      disclaimer: "Correlation established via telemetry and temporal/value matching rules."
    });
  }

  return correlations;
}
