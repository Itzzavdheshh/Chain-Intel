import { TypologyFinding, BlockchainType } from "../../types";
import { NormalizedTransaction } from "../adapters/types";
import { TYPOLOGY_CONFIG } from "./typologyConfig";

export function evaluateTypologies(transactions: NormalizedTransaction[], chain: BlockchainType = "Ethereum"): TypologyFinding[] {
  if (!transactions || transactions.length === 0) return [];
  const findings: TypologyFinding[] = [];
  const sortedTxs = [...transactions].sort((a, b) => (new Date(a.timestamp).getTime() || 0) - (new Date(b.timestamp).getTime() || 0));
  findings.push(...detectRapidMovement(sortedTxs, chain));
  findings.push(...detectSplitting(sortedTxs, chain));
  findings.push(...detectConsolidation(sortedTxs, chain));
  findings.push(...detectPeelChain(sortedTxs, chain));
  findings.push(...detectStructuring(sortedTxs, chain));
  return findings;
}

function detectRapidMovement(txs: NormalizedTransaction[], chain: BlockchainType): TypologyFinding[] {
  const findings: TypologyFinding[] = [];
  const addressInflows: Record<string, NormalizedTransaction[]> = {};
  txs.forEach((tx) => {
    const to = (tx.to || "").toLowerCase();
    if (to) { if (!addressInflows[to]) addressInflows[to] = []; addressInflows[to].push(tx); }
  });
  txs.forEach((outTx) => {
    const from = (outTx.from || "").toLowerCase();
    if (!from || !addressInflows[from]) return;
    const tOut = new Date(outTx.timestamp).getTime();
    if (isNaN(tOut)) return;
    addressInflows[from].forEach((inTx) => {
      if (inTx.txHash === outTx.txHash) return;
      const tIn = new Date(inTx.timestamp).getTime();
      if (isNaN(tIn)) return;
      const elapsedSeconds = Math.round((tOut - tIn) / 1000);
      if (elapsedSeconds >= 0 && elapsedSeconds <= TYPOLOGY_CONFIG.RAPID_MOVEMENT_MAX_SECONDS) {
        findings.push({
          id: "typology-rapid-" + outTx.txHash.slice(0, 10) + "-" + inTx.txHash.slice(0, 10),
          ruleId: "RULE_RAPID_MOVEMENT_01",
          code: "RAPID_MOVEMENT",
          title: "Rapid Onward Transfer Indicator",
          severity: elapsedSeconds < 60 ? "HIGH" : "MODERATE",
          explanation: "Funds received in tx " + inTx.txHash.slice(0, 10) + "... at " + inTx.timestamp + " were transferred onward " + elapsedSeconds + " seconds later in tx " + outTx.txHash.slice(0, 10) + "... at " + outTx.timestamp + ".",
          observedValue: "Elapsed time: " + elapsedSeconds + "s (Inflow: " + inTx.value + " " + (inTx.asset || "ETH") + ", Outflow: " + outTx.value + " " + (outTx.asset || "ETH") + ")",
          thresholdUsed: "Configured threshold: <= " + TYPOLOGY_CONFIG.RAPID_MOVEMENT_MAX_SECONDS + " seconds",
          provenanceSource: "DERIVED_BEHAVIORAL_RULE",
          affectedNodes: [from, (inTx.from || "").toLowerCase(), (outTx.to || "").toLowerCase()].filter(Boolean),
          affectedTxHashes: [inTx.txHash, outTx.txHash],
          timestamp: outTx.timestamp,
          chain,
          hop: outTx.hop,
        });
      }
    });
  });
  return findings;
}

function detectSplitting(txs: NormalizedTransaction[], chain: BlockchainType): TypologyFinding[] {
  const findings: TypologyFinding[] = [];
  const senderOutflows: Record<string, NormalizedTransaction[]> = {};
  txs.forEach((tx) => {
    const from = (tx.from || "").toLowerCase();
    if (from) { if (!senderOutflows[from]) senderOutflows[from] = []; senderOutflows[from].push(tx); }
  });
  Object.entries(senderOutflows).forEach(([sender, outflows]) => {
    const distinctTargets = new Set(outflows.map((t) => (t.to || "").toLowerCase()).filter(Boolean));
    if (distinctTargets.size >= TYPOLOGY_CONFIG.SPLITTING_MIN_OUTPUTS) {
      const txHashes = outflows.map((t) => t.txHash);
      const totalDispersed = outflows.reduce((acc, curr) => acc + (parseFloat(curr.value || "0") || 0), 0);
      const asset = outflows[0]?.asset || "ETH";
      findings.push({
        id: "typology-splitting-" + sender.slice(0, 10),
        ruleId: "RULE_SPLITTING_01",
        code: "SPLITTING",
        title: "Fund Splitting / Disbursement Pattern",
        severity: distinctTargets.size >= 5 ? "HIGH" : "MODERATE",
        explanation: "Address " + sender + " dispersed funds across " + distinctTargets.size + " distinct outbound destination addresses. Total value dispersed: " + totalDispersed.toFixed(4) + " " + asset + ".",
        observedValue: "Outputs count: " + distinctTargets.size + " distinct recipients across " + outflows.length + " transactions.",
        thresholdUsed: "Configured threshold: >= " + TYPOLOGY_CONFIG.SPLITTING_MIN_OUTPUTS + " distinct destination addresses",
        provenanceSource: "DERIVED_BEHAVIORAL_RULE",
        affectedNodes: [sender, ...Array.from(distinctTargets)],
        affectedTxHashes: txHashes.slice(0, 10),
        timestamp: outflows[0]?.timestamp,
        chain,
      });
    }
  });
  return findings;
}

function detectConsolidation(txs: NormalizedTransaction[], chain: BlockchainType): TypologyFinding[] {
  const findings: TypologyFinding[] = [];
  const receiverInflows: Record<string, NormalizedTransaction[]> = {};
  txs.forEach((tx) => {
    const to = (tx.to || "").toLowerCase();
    if (to) { if (!receiverInflows[to]) receiverInflows[to] = []; receiverInflows[to].push(tx); }
  });
  Object.entries(receiverInflows).forEach(([receiver, inflows]) => {
    const distinctSenders = new Set(inflows.map((t) => (t.from || "").toLowerCase()).filter(Boolean));
    if (distinctSenders.size >= TYPOLOGY_CONFIG.CONSOLIDATION_MIN_INPUTS) {
      const txHashes = inflows.map((t) => t.txHash);
      const totalConsolidated = inflows.reduce((acc, curr) => acc + (parseFloat(curr.value || "0") || 0), 0);
      const asset = inflows[0]?.asset || "ETH";
      findings.push({
        id: "typology-consolidation-" + receiver.slice(0, 10),
        ruleId: "RULE_CONSOLIDATION_01",
        code: "CONSOLIDATION",
        title: "Fund Consolidation Pattern",
        severity: distinctSenders.size >= 5 ? "HIGH" : "MODERATE",
        explanation: "Destination address " + receiver + " collected inbound transfers from " + distinctSenders.size + " distinct source addresses. Total value consolidated: " + totalConsolidated.toFixed(4) + " " + asset + ".",
        observedValue: "Inbound sources count: " + distinctSenders.size + " distinct senders across " + inflows.length + " transactions.",
        thresholdUsed: "Configured threshold: >= " + TYPOLOGY_CONFIG.CONSOLIDATION_MIN_INPUTS + " distinct inbound sources",
        provenanceSource: "DERIVED_BEHAVIORAL_RULE",
        affectedNodes: [receiver, ...Array.from(distinctSenders)],
        affectedTxHashes: txHashes.slice(0, 10),
        timestamp: inflows[0]?.timestamp,
        chain,
      });
    }
  });
  return findings;
}

function detectPeelChain(txs: NormalizedTransaction[], chain: BlockchainType): TypologyFinding[] {
  const findings: TypologyFinding[] = [];
  const hopTxs: Record<number, NormalizedTransaction[]> = {};
  txs.forEach((tx) => {
    const hop = tx.hop || 0;
    if (!hopTxs[hop]) hopTxs[hop] = [];
    hopTxs[hop].push(tx);
  });
  const availableHops = Object.keys(hopTxs).map(Number).sort((a, b) => a - b);
  if (availableHops.length >= TYPOLOGY_CONFIG.PEEL_CHAIN_MIN_HOPS) {
    let continuousSequenceCount = 0;
    const sequenceTxHashes: string[] = [];
    const sequenceNodes: Set<string> = new Set();
    for (let i = 0; i < availableHops.length - 1; i++) {
      const hCurr = availableHops[i];
      const hNext = availableHops[i + 1];
      const currTx = hopTxs[hCurr][0];
      const nextTx = hopTxs[hNext][0];
      if (currTx && nextTx) {
        const vCurr = parseFloat(currTx.value || "0");
        const vNext = parseFloat(nextTx.value || "0");
        if (vCurr > 0 && vNext > 0) {
          const ratio = vNext / vCurr;
          if (ratio >= TYPOLOGY_CONFIG.PEEL_CHAIN_MIN_ONWARD_RATIO && ratio < 1.0) {
            continuousSequenceCount++;
            sequenceTxHashes.push(currTx.txHash, nextTx.txHash);
            sequenceNodes.add((currTx.from || "").toLowerCase());
            sequenceNodes.add((currTx.to || "").toLowerCase());
            sequenceNodes.add((nextTx.to || "").toLowerCase());
          }
        }
      }
    }
    if (continuousSequenceCount >= TYPOLOGY_CONFIG.PEEL_CHAIN_MIN_HOPS - 1) {
      findings.push({
        id: "typology-peelchain-" + chain,
        ruleId: "RULE_PEEL_CHAIN_01",
        code: "PEEL_CHAIN",
        title: "Peel-Chain-Like Movement Pattern",
        severity: "HIGH",
        explanation: "Observed a peel-chain pattern across " + (continuousSequenceCount + 1) + " consecutive hops, where >= " + Math.round(TYPOLOGY_CONFIG.PEEL_CHAIN_MIN_ONWARD_RATIO * 100) + "% of funds were forwarded onward per hop, leaving minor retained amounts.",
        observedValue: "Peel sequence length: " + (continuousSequenceCount + 1) + " hops with forward ratios >= " + Math.round(TYPOLOGY_CONFIG.PEEL_CHAIN_MIN_ONWARD_RATIO * 100) + "%",
        thresholdUsed: "Configured threshold: >= " + TYPOLOGY_CONFIG.PEEL_CHAIN_MIN_HOPS + " hops with onward forward ratio >= " + TYPOLOGY_CONFIG.PEEL_CHAIN_MIN_ONWARD_RATIO,
        provenanceSource: "DERIVED_BEHAVIORAL_RULE",
        affectedNodes: Array.from(sequenceNodes).filter(Boolean),
        affectedTxHashes: Array.from(new Set(sequenceTxHashes)),
        chain,
      });
    }
  }
  return findings;
}

function detectStructuring(txs: NormalizedTransaction[], chain: BlockchainType): TypologyFinding[] {
  const findings: TypologyFinding[] = [];
  const pairTxs: Record<string, NormalizedTransaction[]> = {};
  txs.forEach((tx) => {
    const key = (tx.from || "").toLowerCase() + "->" + (tx.to || "").toLowerCase();
    if (!pairTxs[key]) pairTxs[key] = [];
    pairTxs[key].push(tx);
  });
  Object.entries(pairTxs).forEach(([pairKey, txList]) => {
    if (txList.length >= TYPOLOGY_CONFIG.STRUCTURING_MIN_TX_COUNT) {
      const sorted = [...txList].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const tFirst = new Date(sorted[0].timestamp).getTime();
      const tLast = new Date(sorted[sorted.length - 1].timestamp).getTime();
      const timeSpanSec = Math.round((tLast - tFirst) / 1000);
      if (timeSpanSec <= TYPOLOGY_CONFIG.STRUCTURING_TIME_WINDOW_SECONDS) {
        const [from, to] = pairKey.split("->");
        const values = sorted.map((t) => t.value);
        findings.push({
          id: "typology-structuring-" + from.slice(0, 8) + "-" + to.slice(0, 8),
          ruleId: "RULE_STRUCTURING_01",
          code: "STRUCTURING",
          title: "Structuring / Transaction Fragmentation Indicator",
          severity: "MODERATE",
          explanation: "Observed " + txList.length + " transfers of similar structured values between " + from + " and " + to + " within " + timeSpanSec + " seconds.",
          observedValue: txList.length + " transactions executed over " + timeSpanSec + "s window (Values: " + values.slice(0, 3).join(", ") + " " + (txList[0].asset || "ETH") + ")",
          thresholdUsed: "Configured threshold: >= " + TYPOLOGY_CONFIG.STRUCTURING_MIN_TX_COUNT + " transfers within " + TYPOLOGY_CONFIG.STRUCTURING_TIME_WINDOW_SECONDS + "s",
          provenanceSource: "DERIVED_BEHAVIORAL_RULE",
          affectedNodes: [from, to],
          affectedTxHashes: sorted.map((t) => t.txHash),
          timestamp: sorted[0].timestamp,
          chain,
        });
      }
    }
  });
  return findings;
}
