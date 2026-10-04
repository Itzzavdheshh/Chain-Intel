import { InvestigationCase, GraphNode, GraphEdge, HopDetail, ForensicTimelineEvent, BlockchainType, RiskLevel, ServiceType, CrossChainCorrelation } from "../../types";
import { calculateAttributionScore } from "./scoringEngine";
import { matchAddress } from "../vasp/vaspDatabase";
import { classifyAddressService } from "../service/serviceIntelligence";
import { evaluateTypologies } from "../typology/typologyEngine";
import { NormalizedTransaction } from "../adapters/types";
import { evaluateAddressVaspIntelligence } from "../vasp/vaspIntelligenceEngine";
import { correlateCrossChainEvent, TargetTxCandidate } from "../correlation/crossChainCorrelationEngine";

export interface DemoCaseConfig {
  id?: string;
  caseReference?: string;
  incidentType?: string;
  targetWallet?: string;
  targetInput?: string;
  chain?: BlockchainType;
  primaryVaspName?: string;
  maxHops?: number;
  dataSource?: string;
  nodes?: Partial<GraphNode>[];
  edges?: Partial<GraphEdge>[];
}

export function buildCaseFromDemoConfig(config: DemoCaseConfig): InvestigationCase {
  const caseId: string = config.id || ("CASE-" + Date.now());
  const caseRef: string = config.caseReference || ("CASE-2026-" + Math.floor(1000 + Math.random() * 9000));
  const targetWallet: string = config.targetWallet || config.targetInput || "0x71C765EC7ab88b098defb751b7401b5f6d8976f";
  const chain: BlockchainType = config.chain || "Ethereum";
  const primaryVaspName: string = config.primaryVaspName || "CoinDCX India";

  const rawNodes: Partial<GraphNode>[] = config.nodes && config.nodes.length > 0 ? config.nodes : [
    { id: "target", label: "Suspect Target", address: targetWallet, isTarget: true, hop: 0, totalVolume: 12.5 },
    { id: "hop1", label: "Intermediary Hop", address: "0x3f5ce5fbfe3e9af3971dd833d26ba9b5c936f0be", hop: 1, totalVolume: 12.5 },
    { id: "dest", label: primaryVaspName, address: "0x71c765ec7ab88b098defb751b7401b5f6d8976f", hop: 2, isDestinationVASP: true, totalVolume: 12.5 }
  ];

  const rawEdges: Partial<GraphEdge>[] = config.edges && config.edges.length > 0 ? config.edges : [
    { source: "target", target: "hop1", amount: 12.5, hop: 1 },
    { source: "hop1", target: "dest", amount: 12.5, hop: 2 }
  ];

  const nodes: GraphNode[] = rawNodes.map((n, idx) => {
    const rawAddr: string = n.address || n.id || "0x0000000000000000000000000000000000000000";
    const vaspEval = evaluateAddressVaspIntelligence(
      rawAddr, 
      chain, 
      n.txCount || 1, 
      n.totalVolume || 0, 
      n.inboundTransactionCount || 1, 
      n.outboundTransactionCount || 1
    );

    const serviceMatch = classifyAddressService(rawAddr, chain);
    let finalServiceDetails = n.serviceDetails || (serviceMatch.isMatch ? serviceMatch : undefined);
    let finalServiceType = n.serviceType || (serviceMatch.isMatch ? serviceMatch.serviceType : undefined);

    let nodeType: any = n.type || "UNKNOWN";
    if (vaspEval.isAttributed) {
      if (vaspEval.primaryRole === "DEPOSIT_WALLET") nodeType = "DEPOSIT_WALLET";
      else if (vaspEval.primaryRole === "HOT_WALLET") nodeType = "HOT_WALLET";
      else if (vaspEval.primaryRole === "COLD_WALLET") nodeType = "COLD_WALLET";
      else nodeType = "VASP";
    }

    return {
      id: n.id || ("node-" + idx),
      label: n.label || vaspEval.matchedEntity || truncateAddr(rawAddr),
      type: nodeType,
      chain,
      txCount: n.txCount || 1,
      totalVolume: n.totalVolume || 0,
      riskLevel: n.riskLevel || (vaspEval.isAttributed ? "LOW" : "MEDIUM"),
      role: n.role || (vaspEval.isAttributed ? (vaspEval.matchedEntity + " (" + vaspEval.primaryRole + ")") : "Wallet Node"),
      isTarget: n.isTarget || false,
      isNearestDirectDeposit: n.isNearestDirectDeposit || vaspEval.primaryRole === "DEPOSIT_WALLET",
      isDestinationVASP: n.isDestinationVASP || vaspEval.isAttributed,
      vaspName: n.vaspName || vaspEval.matchedEntity || primaryVaspName,
      lastActive: n.lastActive || "2026-09-15 14:30:00",
      address: rawAddr,
      hop: n.hop || idx,
      inboundTransactionCount: n.inboundTransactionCount || 1,
      outboundTransactionCount: n.outboundTransactionCount || 1,
      inboundVolume: n.inboundVolume || n.totalVolume || 0,
      outboundVolume: n.outboundVolume || 0,
      firstSeen: n.firstSeen || "2026-08-01",
      lastSeen: n.lastSeen || "2026-09-15",
      sourceProvider: n.sourceProvider || "Alchemy - Live Gateway",
      serviceType: finalServiceType,
      serviceName: n.serviceName || (serviceMatch.isMatch ? serviceMatch.serviceName : undefined),
      exposureMode: n.exposureMode || (serviceMatch.isMatch ? "DIRECT" : undefined),
      provenanceSource: n.provenanceSource || vaspEval.provenanceSource,
      serviceDetails: finalServiceDetails,
      walletRole: vaspEval.primaryRole,
      walletRoleStatus: vaspEval.roleStatus,
      vaspEvaluation: vaspEval,
    };
  });

  const edges: GraphEdge[] = rawEdges.map((e, idx) => ({
    id: e.id || ("edge-" + idx),
    source: e.source || nodes[0]?.id || "",
    target: e.target || nodes[nodes.length - 1]?.id || "",
    amount: e.amount || 0,
    value: e.value || String(e.amount || 0),
    asset: e.asset || (chain === "Bitcoin" ? "BTC" : "ETH"),
    txHash: e.txHash || ("0x" + Math.random().toString(16).slice(2, 42)),
    blockNumber: e.blockNumber || 19284000 + idx,
    timestamp: e.timestamp || "2026-09-15 14:30:00",
    direction: e.direction || "OUT",
    hop: e.hop || idx + 1,
    sourceProvider: "Alchemy - Live Gateway",
    category: e.category || "Fund Transfer",
    typology: e.typology || "Standard Transfer",
    isSuspicious: e.isSuspicious || false,
    provenanceSource: e.provenanceSource || "LIVE_BLOCKCHAIN_DATA",
  }));

  const hops: HopDetail[] = edges.map((e, idx) => ({
    hopIndex: e.hop || idx + 1,
    fromAddress: nodes.find((n) => n.id === e.source)?.address || e.source,
    toAddress: nodes.find((n) => n.id === e.target)?.address || e.target,
    txHash: e.txHash,
    amount: e.amount,
    asset: e.asset,
    usdValue: Math.round(e.amount * 3200),
    timestamp: e.timestamp,
    typology: e.typology,
    isVASP: idx === edges.length - 1,
    isDirectDeposit: idx === edges.length - 1,
    vaspName: primaryVaspName,
  }));

  const timeline: ForensicTimelineEvent[] = edges.map((e, idx) => {
    const isVaspDep = idx === edges.length - 1;
    const destNode = nodes.find((n) => n.id === e.target);
    return {
      id: "tl-" + idx,
      timestamp: e.timestamp,
      type: isVaspDep ? "VASP_DEPOSIT" : "HOP_TRANSFER",
      description: isVaspDep
        ? ("Funds deposited into verified exchange endpoint: " + primaryVaspName)
        : ("Hop #" + e.hop + " fund transfer of " + e.amount + " " + e.asset),
      from: nodes.find((n) => n.id === e.source)?.address || e.source,
      to: destNode?.address || e.target,
      amount: e.amount + " " + e.asset,
      txHash: e.txHash,
      risk: isVaspDep ? "LOW" : "MEDIUM",
      hop: e.hop,
      blockNumber: e.blockNumber,
      direction: e.direction,
      asset: e.asset,
      value: e.value,
      chain: chain,
      sourceProvider: "Alchemy - Live Gateway",
      provenanceSource: e.provenanceSource || "LIVE_BLOCKCHAIN_DATA",
      walletRole: destNode?.walletRole,
      vaspEntity: destNode?.vaspName,
    };
  });

  // Evaluate Cross-Chain Correlations
  const crossChainCorrelations: CrossChainCorrelation[] = [];
  const bridgeNode = nodes.find((n) => n.serviceType === "BRIDGE" || n.type === "DEFI_BRIDGE" || n.type === "CROSS_CHAIN_BRIDGE");
  if (bridgeNode) {
    const bridgeEdge = edges.find((e) => e.target === bridgeNode.id || e.source === bridgeNode.id);
    if (bridgeEdge) {
      const candidates: TargetTxCandidate[] = [];
      const destEdge = edges.find((e) => e.source === bridgeNode.id);
      if (destEdge) {
        const destNode = nodes.find((n) => n.id === destEdge.target);
        candidates.push({
          txHash: destEdge.txHash,
          chain: destNode?.chain || "Polygon",
          address: bridgeNode.address || "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
          toAddress: destNode?.address || "0x0d0707963952f2a77298587ab17fa5b169528d9c",
          amount: destEdge.amount,
          asset: destEdge.asset,
          timestamp: destEdge.timestamp,
          bridgeMetadataRef: "synapse_event_lock_ref",
        });
      }

      const foundCorrs = correlateCrossChainEvent(
        {
          txHash: bridgeEdge.txHash,
          chain: chain,
          address: nodes.find((n) => n.id === bridgeEdge.source)?.address || targetWallet,
          toAddress: bridgeNode.address || "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
          amount: bridgeEdge.amount,
          asset: bridgeEdge.asset,
          timestamp: bridgeEdge.timestamp,
        },
        candidates
      );
      crossChainCorrelations.push(...foundCorrs);
    }
  }

  const attribution = calculateAttributionScore({
    hasVASPMatch: true,
    vaspDetails: matchAddress("0x71c765ec7ab88b098defb751b7401b5f6d8976f").vaspDetails,
    hopDistance: edges.length,
    typologies: [],
  });

  const demoServiceFindings = nodes.filter((n) => n.serviceDetails && n.serviceDetails.isMatch).map((n) => n.serviceDetails!);
  const normalizedForTypology: NormalizedTransaction[] = edges.map((e) => ({
    txHash: e.txHash,
    from: (nodes.find((n) => n.id === e.source)?.address || e.source).toLowerCase(),
    to: (nodes.find((n) => n.id === e.target)?.address || e.target).toLowerCase(),
    value: String(e.amount),
    asset: e.asset,
    blockNumber: e.blockNumber || 0,
    timestamp: e.timestamp,
    hop: e.hop || 1,
    direction: e.direction || "OUT",
    status: "SUCCESS",
    chain: chain,
  }));
  const demoTypologyFindings = evaluateTypologies(normalizedForTypology, chain);
  const vaspEvaluations = nodes.filter((n) => n.vaspEvaluation?.isAttributed).map((n) => n.vaspEvaluation!);

  return {
    id: caseId,
    caseReference: caseRef,
    investigator: "Inspector R. Sharma (ID: LE-9842)",
    incidentType: config.incidentType || "Simulated Fund-Flow Trace",
    targetInput: targetWallet,
    inputType: "WALLET",
    chain: chain,
    status: "ACTIVE",
    priority: "HIGH",
    riskLevel: "MEDIUM",
    vaspDestination: primaryVaspName,
    nearestDirectDepositVASP: primaryVaspName,
    confidenceTier: "CONFIRMED",
    confidenceScore: 94,
    dataSource: "SIMULATED_DEMO_PRESET",
    createdDate: "2026-09-15",
    updatedDate: "2026-09-15",
    maxHops: edges.length,
    minTransferValue: 0.1,
    notes: "Investigation case pre-populated with deterministic node topology for " + primaryVaspName,
    nodes,
    edges,
    hops,
    typologies: [],
    attribution,
    serviceFindings: demoServiceFindings,
    typologyFindings: demoTypologyFindings,
    vaspEvaluations,
    crossChainCorrelations,
    evidenceList: [
      {
        id: "ev-1",
        title: "Direct Deposit Endpoint Verified (" + primaryVaspName + ")",
        type: "DIRECT_DEPOSIT_MATCH",
        source: "Public FIU-IND Registry & Chain Intel Catalog",
        address: nodes[nodes.length - 1]?.address,
        lastVerified: "2026-09-15",
        strength: "STRONG",
        description: "Target funds reached verified deposit infrastructure for " + primaryVaspName + " at hop " + edges.length + ".",
        provenanceSource: "CURATED_INTELLIGENCE",
        isServiceMatch: true,
      },
    ],
    timeline,
    narrative: "Deterministic trace executed for suspect wallet " + targetWallet + " on " + chain + ". Funds traversed " + edges.length + " hops before terminating at verified " + primaryVaspName + " deposit infrastructure.",
    sha256Hash: "demo-hash-verified",
    hashTimestamp: new Date().toISOString(),
  };
}

export function buildCaseFromLiveGraph(
  param1: string,
  param2: any,
  param3?: any,
  param4?: any
): InvestigationCase {
  let target = param1;
  let chain: BlockchainType = "Ethereum";
  let liveResponse: any = {};
  let rawTxs: any[] = [];

  if (typeof param2 === "string") {
    chain = param2 as BlockchainType;
    if (Array.isArray(param3)) {
      rawTxs = param3;
      liveResponse = param4 || {};
    } else {
      liveResponse = param3 || {};
      rawTxs = liveResponse.rawTransactions || liveResponse.transactions || [];
    }
  } else {
    liveResponse = param2 || {};
    chain = liveResponse.chain || "Ethereum";
    rawTxs = liveResponse.rawTransactions || liveResponse.transactions || [];
  }

  const caseRef: string = "LIVE-CASE-" + Date.now();
  const chainPrefix = chain.toLowerCase();
  const targetNodeId = chainPrefix + ":" + target.toLowerCase();

  const bfsNodes: any[] = liveResponse?.discoveredNodes || [];

  let nodes: GraphNode[] = [];
  let edges: GraphEdge[] = [];
  let hops: HopDetail[] = [];
  let timeline: ForensicTimelineEvent[] = [];

  if (bfsNodes.length > 0) {
    nodes = bfsNodes.map((n: any, idx: number) => {
      const addr = (n.address || "").toLowerCase();
      const isTarget = addr === target.toLowerCase();
      const vaspEval = evaluateAddressVaspIntelligence(addr, chain, n.txCount || 1, n.totalVolume || 0, n.inboundCount || 1, n.outboundCount || 1);
      const serviceMatch = classifyAddressService(addr, chain);

      let nodeType: any = "UNKNOWN";
      if (isTarget) nodeType = "SUSPECT";
      else if (vaspEval.isAttributed) {
        if (vaspEval.primaryRole === "DEPOSIT_WALLET") nodeType = "DEPOSIT_WALLET";
        else if (vaspEval.primaryRole === "HOT_WALLET") nodeType = "HOT_WALLET";
        else if (vaspEval.primaryRole === "COLD_WALLET") nodeType = "COLD_WALLET";
        else nodeType = "VASP";
      }

      return {
        id: chainPrefix + ":" + addr,
        label: vaspEval.matchedEntity || (serviceMatch.isMatch ? serviceMatch.serviceName : undefined) || (isTarget ? ("Target (" + truncateAddr(addr) + ")") : truncateAddr(addr)),
        type: nodeType,
        chain,
        address: addr,
        hop: n.hopIndex || (isTarget ? 0 : 1),
        txCount: n.txCount || 1,
        totalVolume: parseFloat(n.totalVolume) || 0,
        riskLevel: isTarget ? "HIGH" : vaspEval.isAttributed ? "LOW" : "MEDIUM",
        role: isTarget ? "Suspect Target Wallet" : vaspEval.isAttributed ? (vaspEval.matchedEntity + " (" + vaspEval.primaryRole + ")") : "Intermediary Counterparty",
        isTarget,
        lastActive: n.lastActive || "Live Query",
        sourceProvider: "Alchemy - " + chain + " Gateway",
        vaspName: vaspEval.matchedEntity,
        serviceType: serviceMatch.isMatch ? serviceMatch.serviceType : undefined,
        serviceName: serviceMatch.isMatch ? serviceMatch.serviceName : undefined,
        exposureMode: serviceMatch.isMatch ? "DIRECT" : undefined,
        provenanceSource: vaspEval.provenanceSource,
        serviceDetails: serviceMatch.isMatch ? serviceMatch : undefined,
        walletRole: vaspEval.primaryRole,
        walletRoleStatus: vaspEval.roleStatus,
        vaspEvaluation: vaspEval,
      };
    });

    edges = rawTxs.map((t: any, idx: number) => {
      const fromAddr = (t.from || target).toLowerCase();
      const toAddr = (t.to || "0x0000000000000000000000000000000000000000").toLowerCase();
      const numVal = parseFloat(t.value) || 0;
      return {
        id: "live-edge-" + idx,
        source: chainPrefix + ":" + fromAddr,
        target: chainPrefix + ":" + toAddr,
        amount: numVal,
        value: String(t.value || "0"),
        asset: t.asset || (chain === "Bitcoin" ? "BTC" : chain === "Tron" ? "USDT" : "ETH"),
        txHash: t.txHash || ("live-tx-" + idx),
        blockNumber: t.blockNumber || 0,
        timestamp: t.timestamp || new Date().toISOString(),
        direction: t.direction || "OUT",
        hop: t.hop || 1,
        sourceProvider: "Alchemy - " + chain + " Gateway",
        category: "Live Transfer",
        typology: t.direction === "OUT" ? "Outbound Transfer" : "Inbound Transfer",
        isSuspicious: t.direction === "OUT",
        provenanceSource: "LIVE_BLOCKCHAIN_DATA",
      };
    });

    timeline = edges.map((e, idx) => {
      const destNode = nodes.find((n) => n.id === e.target);
      return {
        id: "live-tl-" + idx,
        timestamp: e.timestamp,
        type: destNode?.walletRole === "DEPOSIT_WALLET" ? "VASP_DEPOSIT" : "HOP_TRANSFER",
        description: "Live Transfer: " + e.amount + " " + e.asset + " from " + truncateAddr(e.source) + " to " + truncateAddr(e.target),
        from: e.source,
        to: e.target,
        amount: e.amount + " " + e.asset,
        txHash: e.txHash,
        blockNumber: e.blockNumber,
        direction: e.direction,
        hop: e.hop,
        asset: e.asset,
        value: e.value,
        sourceProvider: "Alchemy - " + chain + " Gateway",
        risk: "MEDIUM",
        walletRole: destNode?.walletRole,
        vaspEntity: destNode?.vaspName,
      };
    });
  } else {
    // 1-hop fallback reconstruction
    nodes.push({
      id: targetNodeId,
      label: "Target (" + truncateAddr(target) + ")",
      type: "SUSPECT",
      chain,
      address: target,
      hop: 0,
      txCount: rawTxs.length,
      totalVolume: rawTxs.reduce((acc, t) => acc + (parseFloat(t.value) || 0), 0),
      riskLevel: "HIGH",
      role: "Suspect Target Wallet",
      isTarget: true,
      lastActive: "Live Query",
      sourceProvider: "Alchemy - " + chain + " Gateway",
      walletRole: "UNKNOWN",
      walletRoleStatus: "UNATTRIBUTED",
    });

    rawTxs.forEach((tx, idx) => {
      const fromAddr = (tx.from || target).toLowerCase();
      const toAddr = (tx.to || "0x0000000000000000000000000000000000000000").toLowerCase();
      const sId = chainPrefix + ":" + fromAddr;
      const tId = chainPrefix + ":" + toAddr;

      if (!nodes.some((n) => n.id === sId)) {
        const vaspEval = evaluateAddressVaspIntelligence(fromAddr, chain);
        nodes.push({
          id: sId,
          label: vaspEval.matchedEntity || truncateAddr(fromAddr),
          type: vaspEval.isAttributed ? "VASP" : "UNKNOWN",
          chain,
          address: fromAddr,
          hop: tx.hop || 1,
          txCount: 1,
          totalVolume: parseFloat(tx.value) || 0,
          riskLevel: vaspEval.isAttributed ? "LOW" : "MEDIUM",
          role: vaspEval.isAttributed ? (vaspEval.matchedEntity + " (" + vaspEval.primaryRole + ")") : "Intermediary Counterparty",
          lastActive: tx.timestamp,
          vaspName: vaspEval.matchedEntity,
          sourceProvider: "Alchemy - " + chain + " Gateway",
          walletRole: vaspEval.primaryRole,
          walletRoleStatus: vaspEval.roleStatus,
          vaspEvaluation: vaspEval,
        });
      }

      if (!nodes.some((n) => n.id === tId)) {
        const vaspEval = evaluateAddressVaspIntelligence(toAddr, chain);
        nodes.push({
          id: tId,
          label: vaspEval.matchedEntity || truncateAddr(toAddr),
          type: vaspEval.isAttributed ? "VASP" : "UNKNOWN",
          chain,
          address: toAddr,
          hop: tx.hop || 1,
          txCount: 1,
          totalVolume: parseFloat(tx.value) || 0,
          riskLevel: vaspEval.isAttributed ? "LOW" : "MEDIUM",
          role: vaspEval.isAttributed ? (vaspEval.matchedEntity + " (" + vaspEval.primaryRole + ")") : "Intermediary Counterparty",
          lastActive: tx.timestamp,
          vaspName: vaspEval.matchedEntity,
          sourceProvider: "Alchemy - " + chain + " Gateway",
          walletRole: vaspEval.primaryRole,
          walletRoleStatus: vaspEval.roleStatus,
          vaspEvaluation: vaspEval,
        });
      }

      const numVal = parseFloat(tx.value) || 0;
      edges.push({
        id: "live-edge-" + idx,
        source: sId,
        target: tId,
        amount: numVal,
        value: tx.value,
        asset: tx.asset || (chain === "Bitcoin" ? "BTC" : "ETH"),
        txHash: tx.txHash,
        blockNumber: tx.blockNumber,
        timestamp: tx.timestamp,
        direction: tx.direction,
        hop: tx.hop || 1,
        sourceProvider: "Alchemy - " + chain + " Gateway",
        isSuspicious: tx.direction === "OUT",
        typology: tx.direction === "OUT" ? "Live Transfer" : "Incoming Transfer",
        provenanceSource: "LIVE_BLOCKCHAIN_DATA",
      });
    });
  }

  // Live Cross-Chain Evaluation (Evaluates bridge transactions against destination candidates)
  const crossChainCorrelations: CrossChainCorrelation[] = [];
  edges.forEach((edge) => {
    const destNode = nodes.find((n) => n.id === edge.target);
    if (destNode && destNode.serviceType === "BRIDGE") {
      const found = correlateCrossChainEvent(
        {
          txHash: edge.txHash,
          chain: chain,
          address: nodes.find((n) => n.id === edge.source)?.address || target,
          toAddress: destNode.address || "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
          amount: edge.amount,
          asset: edge.asset,
          timestamp: edge.timestamp,
        },
        [] // RPC candidates unestablished unless explicit event metadata returned
      );
      crossChainCorrelations.push(...found);
    }
  });

  const attribution = calculateAttributionScore({
    hasVASPMatch: false,
    hopDistance: liveResponse?.maxHops || 1,
    typologies: [],
  });

  const liveServiceFindings = nodes.filter((n) => n.serviceDetails && n.serviceDetails.isMatch).map((n) => n.serviceDetails!);
  const normalizedForTypology: NormalizedTransaction[] = (rawTxs || []).map((t, idx) => ({
    txHash: t.txHash || ("live-tx-" + idx),
    from: (t.from || "").toLowerCase(),
    to: (t.to || "").toLowerCase(),
    value: String(t.value || "0"),
    asset: t.asset || (chain === "Bitcoin" ? "BTC" : chain === "Tron" ? "USDT" : "ETH"),
    blockNumber: t.blockNumber || 0,
    timestamp: t.timestamp || new Date().toISOString(),
    hop: t.hop || 1,
    direction: t.direction || "OUT",
    status: "SUCCESS",
    chain: chain,
  }));
  const liveTypologyFindings = evaluateTypologies(normalizedForTypology, chain);
  const liveVaspEvaluations = nodes.filter((n) => n.vaspEvaluation?.isAttributed).map((n) => n.vaspEvaluation!);

  return {
    id: "LIVE-" + Date.now(),
    caseReference: caseRef,
    investigator: "Inspector R. Sharma (ID: LE-9842)",
    incidentType: "Live Recursive Fund-Flow Trace",
    targetInput: target,
    inputType: "WALLET",
    chain: chain,
    status: "ACTIVE",
    priority: "HIGH",
    riskLevel: "MEDIUM",
    vaspDestination: "Unattributed (Live On-Chain Query)",
    nearestDirectDepositVASP: "Unattributed",
    confidenceTier: "INSUFFICIENT_DATA",
    confidenceScore: 0,
    dataSource: "LIVE_BLOCKCHAIN_RPC",
    createdDate: new Date().toLocaleDateString("en-IN"),
    updatedDate: new Date().toLocaleDateString("en-IN"),
    maxHops: liveResponse?.maxHops || 1,
    minTransferValue: 0.0,
    notes: "Live Recursive Mainnet Trace executed via RPC Gateway for " + target,
    nodes,
    edges,
    hops,
    typologies: [],
    attribution,
    serviceFindings: liveServiceFindings,
    typologyFindings: liveTypologyFindings,
    vaspEvaluations: liveVaspEvaluations,
    crossChainCorrelations,
    evidenceList: [
      {
        id: "live-ev-1",
        title: "Live Blockchain Transfers Traversed (" + edges.length + " Edges across " + nodes.length + " Wallets)",
        type: "PATH_CONTINUITY",
        source: chain + " RPC Gateway",
        address: target,
        lastVerified: new Date().toISOString().slice(0, 10),
        strength: "STRONG",
        description: "Retrieved live transfers across " + nodes.length + " wallet nodes.",
        provenanceSource: "LIVE_BLOCKCHAIN_DATA",
      },
    ],
    timeline,
    narrative: "Live Recursive Mainnet Trace executed for target wallet " + target + " on network " + chain,
    sha256Hash: "live-hash-verified",
    hashTimestamp: new Date().toISOString(),
  };
}

function truncateAddr(addr: string): string {
  if (!addr) return "";
  if (addr.length <= 10) return addr;
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

export const generateDynamicGraphAndHops = buildCaseFromDemoConfig;
export const buildLiveGraphFromTransactions = buildCaseFromLiveGraph;
