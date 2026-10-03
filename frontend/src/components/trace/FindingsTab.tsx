import React, { useState } from "react";
import { InvestigationCase, ServiceMatchResult, TypologyFinding } from "../../types";
import {
  ShieldAlert,
  Flame,
  Shuffle,
  ArrowRightLeft,
  Activity,
  Info,
  ExternalLink,
  Filter,
  FileCheck,
} from "lucide-react";

interface FindingsTabProps {
  currentCase: InvestigationCase;
  onSelectNode?: (nodeId: string) => void;
}

export const FindingsTab: React.FC<FindingsTabProps> = ({ currentCase, onSelectNode }) => {
  const [filterType, setFilterType] = useState<string>("ALL");

  const typologyFindings: TypologyFinding[] = currentCase.typologyFindings || [];
  const classifiedNodes = currentCase.nodes.filter(
    (n) => n.serviceType && n.serviceType !== "UNKNOWN"
  );

  const mixerFindings = classifiedNodes.filter((n) => n.serviceType === "MIXER" || n.type === "MIXER_TUMBLER");
  const bridgeFindings = classifiedNodes.filter((n) => n.serviceType === "BRIDGE" || n.type === "DEFI_BRIDGE");
  const swapFindings = classifiedNodes.filter((n) => n.serviceType === "SWAP_SERVICE" || n.type === "SWAP_SERVICE");

  const totalFindings = classifiedNodes.length + typologyFindings.length;

  return (
    <div className="h-full overflow-y-auto bg-slate-900/40 p-4 text-slate-100 space-y-6">
      {/* Header Summary Card */}
      <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-5 shadow-lg backdrop-blur-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-700/60 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white tracking-wide">
                Investigator Findings & Service Intelligence
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Evidence-backed service classifications, exposure tracking, and deterministic behavioral typology indicators.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1 rounded-full bg-slate-700/60 text-slate-300 font-mono border border-slate-600/50">
              Total Indicators: <strong className="text-amber-400 font-semibold">{totalFindings}</strong>
            </span>
            <span className="text-xs px-3 py-1 rounded-full bg-cyan-950/60 text-cyan-300 font-mono border border-cyan-800/50">
              Data Source: {currentCase.dataSource || "LIVE"}
            </span>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2 mt-4 pt-1 text-xs">
          <span className="text-slate-400 flex items-center gap-1 font-medium">
            <Filter className="w-3.5 h-3.5" /> Filter View:
          </span>
          {["ALL", "MIXER", "BRIDGE", "SWAP", "TYPOLOGY"].map((f) => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`px-3 py-1 rounded-md transition-colors font-mono ${
                filterType === f
                  ? "bg-cyan-600 text-white font-medium shadow-sm"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* 1. MIXER & TUMBLER EXPOSURE SECTION */}
      {(filterType === "ALL" || filterType === "MIXER") && (
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-rose-900/40 pb-2">
            <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
              <Flame className="w-4 h-4 text-rose-400" />
              <span>Mixer / Tumbler Exposure Findings</span>
              <span className="text-xs font-mono bg-rose-950 text-rose-300 px-2 py-0.5 rounded-full border border-rose-800/50">
                {mixerFindings.length}
              </span>
            </div>
            <span className="text-xs text-slate-500 italic">
              Direct vs. Indirect Exposure Differentiated
            </span>
          </div>

          {mixerFindings.length === 0 ? (
            <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-4 text-center text-xs text-slate-400">
              No known privacy mixer or tumbler exposure identified in this trace.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {mixerFindings.map((node) => {
                const isDirect = node.exposureMode === "DIRECT";
                return (
                  <div
                    key={node.id}
                    className="bg-slate-800/90 border border-rose-800/60 rounded-xl p-4 space-y-3 hover:border-rose-500/80 transition-all shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded font-mono font-bold text-xs ${
                            isDirect
                              ? "bg-rose-600 text-white animate-pulse"
                              : "bg-amber-600/30 text-amber-300 border border-amber-500/40"
                          }`}
                        >
                          {isDirect ? "DIRECT INTERACTION" : "INDIRECT / DOWNSTREAM EXPOSURE"}
                        </span>
                        <span className="text-sm font-semibold text-rose-200">
                          {node.serviceName || node.label || "Known Mixer Protocol"}
                        </span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-700 font-mono">
                        Hop #{node.hop || 1}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs bg-slate-900/60 p-3 rounded-lg border border-slate-800 font-mono">
                      <div>
                        <span className="text-slate-500">Node Address:</span>{" "}
                        <button
                          onClick={() => onSelectNode && onSelectNode(node.id)}
                          className="text-cyan-400 hover:underline inline-flex items-center gap-1 font-mono"
                        >
                          {node.address || node.id} <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                      <div>
                        <span className="text-slate-500">Service Category:</span>{" "}
                        <span className="text-slate-200">{node.serviceDetails?.category || "CoinJoin / Privacy Protocol"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Provenance Source:</span>{" "}
                        <span className="text-amber-400">{node.provenanceSource || "CURATED_INTELLIGENCE"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Sanction Status:</span>{" "}
                        <span className={node.serviceDetails?.isSanctioned ? "text-rose-400 font-bold" : "text-emerald-400"}>
                          {node.serviceDetails?.isSanctioned ? "SANCTIONED ENTITY" : "NON-SANCTIONED PROTOCOL"}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 bg-slate-900/40 p-2.5 rounded border border-slate-800/80 leading-relaxed">
                      <strong className="text-slate-400">Observed Blockchain Finding:</strong>{" "}
                      {node.serviceDetails?.explanation ||
                        "Address matches known non-custodial privacy mixer infrastructure pattern in intelligence database."}
                    </p>

                    {node.serviceDetails?.disclaimer && (
                      <div className="text-[11px] text-amber-400/90 bg-amber-950/30 border border-amber-800/40 p-2 rounded flex items-start gap-1.5">
                        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{node.serviceDetails.disclaimer}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* 2. BRIDGE INTERACTION FINDINGS */}
      {(filterType === "ALL" || filterType === "BRIDGE") && (
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-cyan-900/40 pb-2">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
              <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
              <span>Cross-Chain Bridge Interactions</span>
              <span className="text-xs font-mono bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-800/50">
                {bridgeFindings.length}
              </span>
            </div>
            <span className="text-xs text-slate-500 italic">
              Unestablished destination correlation flagged appropriately
            </span>
          </div>

          {bridgeFindings.length === 0 ? (
            <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-4 text-center text-xs text-slate-400">
              No cross-chain bridge interactions detected in this trace path.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {bridgeFindings.map((node) => (
                <div
                  key={node.id}
                  className="bg-slate-800/90 border border-cyan-800/60 rounded-xl p-4 space-y-3 hover:border-cyan-500/80 transition-all shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded bg-cyan-600/30 text-cyan-200 border border-cyan-500/40 font-mono font-bold text-xs">
                        BRIDGE CONTRACT INTERACTION
                      </span>
                      <span className="text-sm font-semibold text-cyan-200">
                        {node.serviceName || node.label || "Known Bridge Protocol"}
                      </span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-700 font-mono">
                      Chain: {node.chain}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs bg-slate-900/60 p-3 rounded-lg border border-slate-800 font-mono">
                    <div>
                      <span className="text-slate-500">Bridge Address/Contract:</span>{" "}
                      <button
                        onClick={() => onSelectNode && onSelectNode(node.id)}
                        className="text-cyan-400 hover:underline inline-flex items-center gap-1 font-mono"
                      >
                        {node.address || node.id} <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                    <div>
                      <span className="text-slate-500">Source Network:</span>{" "}
                      <span className="text-slate-200">{node.chain}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Provenance Source:</span>{" "}
                      <span className="text-cyan-400">{node.provenanceSource || "CURATED_INTELLIGENCE"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Cross-Chain Correlation:</span>{" "}
                      <span className="text-amber-400 font-semibold">Unestablished</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-amber-300/90 bg-amber-950/30 border border-amber-800/40 p-2.5 rounded flex items-start gap-1.5">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                    <span>
                      {node.serviceDetails?.disclaimer ||
                        "Bridge interaction detected; destination-side cross-chain continuation is unestablished unless corroborated by multi-chain tracing."}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 3. SWAP-SERVICE FINDINGS */}
      {(filterType === "ALL" || filterType === "SWAP") && (
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-purple-900/40 pb-2">
            <div className="flex items-center gap-2 text-purple-400 font-semibold text-sm">
              <Shuffle className="w-4 h-4 text-purple-400" />
              <span>Swap Service / DEX Router Interactions</span>
              <span className="text-xs font-mono bg-purple-950 text-purple-300 px-2 py-0.5 rounded-full border border-purple-800/50">
                {swapFindings.length}
              </span>
            </div>
            <span className="text-xs text-slate-500 italic">
              Normal liquidity swap vs. Non-KYC instant swap distinction
            </span>
          </div>

          {swapFindings.length === 0 ? (
            <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-4 text-center text-xs text-slate-400">
              No swap service interactions identified in trace.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {swapFindings.map((node) => (
                <div
                  key={node.id}
                  className="bg-slate-800/90 border border-purple-800/60 rounded-xl p-4 space-y-3 hover:border-purple-500/80 transition-all shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded bg-purple-600/30 text-purple-200 border border-purple-500/40 font-mono font-bold text-xs">
                        SWAP SERVICE
                      </span>
                      <span className="text-sm font-semibold text-purple-200">
                        {node.serviceName || node.label || "Known Swap Service"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs bg-slate-900/60 p-3 rounded-lg border border-slate-800 font-mono">
                    <div>
                      <span className="text-slate-500">Contract / Address:</span>{" "}
                      <span className="text-cyan-400">{node.address || node.id}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Category:</span>{" "}
                      <span className="text-slate-200">{node.serviceDetails?.category || "Automated Swap Router"}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-900/40 p-2.5 rounded border border-slate-800 leading-relaxed">
                    {node.serviceDetails?.explanation || "Instant swap transaction router interaction identified."}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 4. DETERMINISTIC BEHAVIORAL TYPOLOGY INDICATORS */}
      {(filterType === "ALL" || filterType === "TYPOLOGY") && (
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-indigo-900/40 pb-2">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span>Behavioral Typology Indicators</span>
              <span className="text-xs font-mono bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-800/50">
                {typologyFindings.length}
              </span>
            </div>
            <span className="text-xs text-slate-500 italic">
              Deterministic rule evaluation — Not an automated criminality score
            </span>
          </div>

          {typologyFindings.length === 0 ? (
            <div className="bg-slate-800/40 border border-slate-800 rounded-lg p-4 text-center text-xs text-slate-400">
              No specific behavioral indicators triggered for this set of trace transactions.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {typologyFindings.map((tf) => {
                const isHigh = tf.severity === "HIGH" || tf.severity === "CRITICAL";
                return (
                  <div
                    key={tf.id}
                    className="bg-slate-800/90 border border-indigo-800/60 rounded-xl p-4 space-y-3 hover:border-indigo-500/80 transition-all shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded font-mono font-bold text-xs ${
                              isHigh
                                ? "bg-rose-950 text-rose-300 border border-rose-800/60"
                                : "bg-amber-950 text-amber-300 border border-amber-800/60"
                            }`}
                          >
                            [{tf.ruleId}] {tf.code}
                          </span>
                          <h4 className="text-sm font-semibold text-white">{tf.title}</h4>
                        </div>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded bg-slate-900 text-slate-400 border border-slate-700 font-mono">
                        Source: {tf.provenanceSource}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                      <strong className="text-indigo-300 font-medium">Observed Behavior:</strong>{" "}
                      {tf.explanation}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs bg-slate-900/40 p-2.5 rounded border border-slate-800 font-mono text-slate-400">
                      <div>
                        <span className="text-slate-500">Observed Value:</span>{" "}
                        <span className="text-slate-200">{tf.observedValue}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Threshold Used:</span>{" "}
                        <span className="text-slate-200">{tf.thresholdUsed}</span>
                      </div>
                    </div>

                    {tf.affectedNodes && tf.affectedNodes.length > 0 && (
                      <div className="text-xs text-slate-400">
                        <span className="text-slate-500">Affected Addresses:</span>{" "}
                        <span className="font-mono text-cyan-400">
                          {tf.affectedNodes.slice(0, 4).join(", ")}
                          {tf.affectedNodes.length > 4 && ` (+ ${tf.affectedNodes.length - 4} more)`}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Disclaimers & Integrity Banner */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-slate-300 font-semibold">
          <FileCheck className="w-4 h-4 text-emerald-400" />
          <span>Investigator Compliance & Evidence Provenance Disclaimer</span>
        </div>
        <p className="leading-relaxed">
          Chain Intel service classifications are matched against verified, curated intelligence repositories or direct blockchain smart contract bytecodes. Behavioral typology indicators identify observable transaction structures (e.g. rapid forward movements, splitting, consolidation) and do not constitute legal proof of illegal activity. All inferences require independent law enforcement verification prior to operational action.
        </p>
      </div>
    </div>
  );
};
