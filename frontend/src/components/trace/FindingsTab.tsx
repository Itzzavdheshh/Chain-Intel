import React from "react";
import { InvestigationCase, VASPEvaluationResult } from "../../types";
import { ShieldAlert, Building2, Wallet, ArrowRightLeft, Layers, AlertCircle, FileCheck, CheckCircle2 } from "lucide-react";

interface FindingsTabProps {
  caseData: InvestigationCase;
  onSelectNodeByAddress?: (address: string) => void;
}

export const FindingsTab: React.FC<FindingsTabProps> = ({ caseData, onSelectNodeByAddress }) => {
  const serviceFindings = caseData.serviceFindings || [];
  const typologyFindings = caseData.typologyFindings || [];
  const vaspEvaluations = (caseData.vaspEvaluations || caseData.nodes.filter((n) => n.vaspEvaluation?.isAttributed).map((n) => n.vaspEvaluation!)).filter(Boolean);

  const mixers = serviceFindings.filter((s) => s.serviceType === "MIXER" || s.serviceType === "TUMBLER");
  const bridges = serviceFindings.filter((s) => s.serviceType === "BRIDGE");
  const swaps = serviceFindings.filter((s) => s.serviceType === "SWAP_SERVICE");

  const depositWallets = vaspEvaluations.filter((v) => v.primaryRole === "DEPOSIT_WALLET");
  const hotWallets = vaspEvaluations.filter((v) => v.primaryRole === "HOT_WALLET" || v.roleStatus === "HOT_WALLET_INDICATOR");
  const coldWallets = vaspEvaluations.filter((v) => v.primaryRole === "COLD_WALLET" || v.roleStatus === "COLD_WALLET_INDICATOR");

  return (
    <div className="space-y-6 font-sans">
      {/* Header Bar */}
      <div className="bg-slate-900 text-white rounded-lg p-5 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600/20 border border-blue-500/40 rounded-md">
              <Building2 className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Investigator Findings & Intelligence Synthesis</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                VASP Attribution, Deposit Wallet Intelligence, Service Classification & Behavioral Typology Analysis
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono font-bold bg-slate-950 px-3 py-1.5 rounded border border-slate-800">
            <span className="text-emerald-400">{vaspEvaluations.length} VASP Matches</span>
            <span className="text-slate-600">|</span>
            <span className="text-amber-400">{serviceFindings.length} Services</span>
            <span className="text-slate-600">|</span>
            <span className="text-rose-400">{typologyFindings.length} Typology Flags</span>
          </div>
        </div>
      </div>

      {/* 1. VASP ATTRIBUTIONS CARD */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              1. VASP & Exchange Attributions ({vaspEvaluations.length})
            </h3>
          </div>
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
            Provenanced Intelligence
          </span>
        </div>

        {vaspEvaluations.length === 0 ? (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded text-xs text-slate-500 italic">
            No confirmed exchange or VASP attributions identified along the current fund-flow path.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {vaspEvaluations.map((v, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-md p-3.5 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">{v.matchedEntity}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {v.primaryRole.replace("_", " ")}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Confidence: {v.confidenceLevel} ({v.confidenceScore}%)
                  </span>
                </div>

                <div className="text-slate-700 text-xs space-y-1">
                  {v.reasons.map((r, ri) => (
                    <div key={ri} className="flex items-start space-x-1.5 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-amber-50/80 border border-amber-200 rounded p-2 text-[10px] text-amber-900 italic">
                  <strong>Limitation Note:</strong> {v.limitations}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. DEPOSIT WALLETS & HOT/COLD INTELLIGENCE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Deposit Wallets */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center space-x-2">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase">Deposit Wallets ({depositWallets.length})</h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
              Direct Deposit Endpoints
            </span>
          </div>
          {depositWallets.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-2 bg-slate-50 rounded">No deposit wallet endpoints matched.</p>
          ) : (
            <div className="space-y-2">
              {depositWallets.map((dw, i) => (
                <div key={i} className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs space-y-1">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{dw.matchedEntity}</span>
                    <span className="text-emerald-700 text-[10px]">{dw.jurisdiction}</span>
                  </div>
                  <p className="text-[11px] text-slate-600">{dw.reasons[0]}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hot & Cold Wallet Classifications */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase">Hot / Cold Wallet Classifications ({hotWallets.length + coldWallets.length})</h3>
            </div>
            <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-bold">
              Role Intelligence
            </span>
          </div>
          {hotWallets.length === 0 && coldWallets.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-2 bg-slate-50 rounded">No specialized hot or cold wallet infrastructure classified.</p>
          ) : (
            <div className="space-y-2">
              {hotWallets.map((hw, i) => (
                <div key={i} className="p-2.5 bg-blue-50/60 border border-blue-200 rounded text-xs space-y-1">
                  <div className="flex justify-between font-bold text-blue-900">
                    <span>{hw.matchedEntity || "Hot Wallet Indicator"}</span>
                    <span className="text-blue-800 text-[10px]">{hw.roleStatus}</span>
                  </div>
                  <p className="text-[11px] text-slate-700">{hw.reasons[0]}</p>
                </div>
              ))}
              {coldWallets.map((cw, i) => (
                <div key={i} className="p-2.5 bg-indigo-50/60 border border-indigo-200 rounded text-xs space-y-1">
                  <div className="flex justify-between font-bold text-indigo-900">
                    <span>{cw.matchedEntity || "Cold Storage Vault"}</span>
                    <span className="text-indigo-800 text-[10px]">{cw.roleStatus}</span>
                  </div>
                  <p className="text-[11px] text-slate-700">{cw.reasons[0]}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. PHASE 6 TYPOLOGIES & SERVICE FINDINGS */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              3. Behavioral Typology Flags ({typologyFindings.length})
            </h3>
          </div>
          <span className="text-xs font-semibold text-rose-800 bg-rose-50 px-2.5 py-1 rounded border border-rose-200">
            Deterministic Rule Engine
          </span>
        </div>

        {typologyFindings.length === 0 ? (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded text-xs text-slate-500 italic">
            No behavioral typology anomalies flagged for this trace.
          </div>
        ) : (
          <div className="space-y-3">
            {typologyFindings.map((tf) => (
              <div key={tf.id} className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs space-y-1.5">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>{tf.title}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-rose-100 text-rose-800 font-mono font-bold">
                    {tf.severity}
                  </span>
                </div>
                <p className="text-slate-700">{tf.explanation}</p>
                <div className="flex items-center space-x-3 text-[10px] text-slate-500 font-mono">
                  <span>Observed: {tf.observedValue}</span>
                  <span>Threshold: {tf.thresholdUsed}</span>
                  <span>Source: {tf.provenanceSource}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
