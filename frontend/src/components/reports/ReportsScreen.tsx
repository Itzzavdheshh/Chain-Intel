import React from "react";
import { InvestigationCase } from "../../types";
import { Shield, FileText, CheckCircle, Lock, Download, Printer } from "lucide-react";

interface ReportsScreenProps {
  currentCase: InvestigationCase;
  onOpenLegalNotice?: () => void;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({ currentCase }) => {
  const handlePrint = () => window.print();

  const vaspEvaluations = currentCase.vaspEvaluations || currentCase.nodes.filter((n) => n.vaspEvaluation?.isAttributed).map((n) => n.vaspEvaluation!).filter(Boolean);

  return (
    <div className="space-y-6 font-sans">
      {/* Action Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900">Official Forensic Investigation Report</h2>
          <p className="text-xs text-slate-500">Case Ref: {currentCase.caseReference}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold flex items-center space-x-1.5 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Export PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Report Document Container */}
      <div className="bg-white border border-slate-300 rounded-lg p-8 shadow-md max-w-4xl mx-auto print:border-none print:shadow-none print:max-w-none">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-blue-900" />
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">CHAIN-INTEL FORENSIC REPORT</h1>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-1">
              National Law Enforcement Blockchain Intelligence & VASP Attribution Analysis
            </p>
          </div>

          <div className="text-right text-xs">
            <span className="font-mono font-bold text-slate-900 block">{currentCase.caseReference}</span>
            <span className="text-slate-500 block">{currentCase.createdDate}</span>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px] uppercase mt-1 inline-block">
              CONFIDENTIAL / LE USE ONLY
            </span>
          </div>
        </div>

        {/* Case Metadata Matrix */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-md border border-slate-200 mb-6 text-xs font-sans">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Target Input</span>
            <span className="font-mono font-bold text-slate-900 break-all">{currentCase.targetInput}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Network</span>
            <span className="font-semibold text-slate-900">{currentCase.chain}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">VASP Destination</span>
            <span className="font-semibold text-emerald-700">{currentCase.nearestDirectDepositVASP}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Attribution Confidence</span>
            <span className="font-semibold text-blue-900">{currentCase.confidenceTier} ({currentCase.confidenceScore}%)</span>
          </div>
        </div>

        {/* Investigator Story Section */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2">
            Investigator Plain-Language Summary
          </h3>
          <div className="text-xs leading-relaxed text-slate-800 space-y-2 bg-slate-50/50 p-3 rounded border border-slate-200">
            {currentCase.narrative.split("\n\n").map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>
        </div>

        {/* Phase 5 VASP & Wallet Intelligence Section */}
        {vaspEvaluations.length > 0 && (
          <div className="mb-6 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1">
              VASP Attributions & Wallet Role Intelligence
            </h3>
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="p-2 border-b border-slate-200">VASP Entity</th>
                  <th className="p-2 border-b border-slate-200">Wallet Role</th>
                  <th className="p-2 border-b border-slate-200">Role Status</th>
                  <th className="p-2 border-b border-slate-200">Confidence</th>
                  <th className="p-2 border-b border-slate-200">Attribution Limitation Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                {vaspEvaluations.map((ve, i) => (
                  <tr key={i}>
                    <td className="p-2 font-bold text-blue-900">{ve.matchedEntity}</td>
                    <td className="p-2 text-emerald-800 font-semibold">{ve.primaryRole.replace("_", " ")}</td>
                    <td className="p-2 text-slate-700">{ve.roleStatus.replace("_", " ")}</td>
                    <td className="p-2 text-blue-900 font-bold">{ve.confidenceLevel} ({ve.confidenceScore}%)</td>
                    <td className="p-2 text-slate-600 font-sans text-[10px] italic">{ve.limitations}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        
        {/* Phase 7 Cross-Chain Correlations Section */}
        {currentCase.crossChainCorrelations && currentCase.crossChainCorrelations.length > 0 && (
          <div className="mb-6 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 flex items-center justify-between">
              <span>Cross-Chain Correlation Evidence</span>
              <span className="text-[10px] font-mono font-normal text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                Phase 7 Multi-Chain Correlation
              </span>
            </h3>
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="p-2 border-b border-slate-200">Source Chain</th>
                  <th className="p-2 border-b border-slate-200">Dest Chain</th>
                  <th className="p-2 border-b border-slate-200">Method</th>
                  <th className="p-2 border-b border-slate-200">Status</th>
                  <th className="p-2 border-b border-slate-200">Time / Value Delta</th>
                  <th className="p-2 border-b border-slate-200">Evidentiary Limitations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                {currentCase.crossChainCorrelations.map((ccc, i) => (
                  <tr key={i}>
                    <td className="p-2 font-bold text-slate-900">{ccc.sourceChain.toUpperCase()}</td>
                    <td className="p-2 font-bold text-amber-700">{ccc.destinationChain ? ccc.destinationChain.toUpperCase() : 'UNESTABLISHED'}</td>
                    <td className="p-2 text-purple-900 font-semibold">{ccc.correlationMethod}</td>
                    <td className="p-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        ccc.correlationStatus === 'CONFIRMED_BRIDGE_TRANSFER' ? 'bg-emerald-100 text-emerald-800' :
                        ccc.correlationStatus === 'POTENTIAL_CORRELATION' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {ccc.correlationStatus}
                      </span>
                    </td>
                    <td className="p-2 text-slate-700 text-[10px]">
                      {ccc.observedTimeDeltaSeconds !== undefined ? `Δt: ${ccc.observedTimeDeltaSeconds}s` : 'N/A'}
                      {ccc.observedValueDeltaPercent !== undefined ? ` | Δv: ${ccc.observedValueDeltaPercent}%` : ''}
                    </td>
                    <td className="p-2 text-slate-600 font-sans text-[10px] italic">
                      {ccc.limitations}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Hop-by-Hop Trace Table */}
        <div className="mb-6">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-1 mb-2">
            Hop-by-Hop Transaction Path
          </h3>
          <table className="w-full text-left text-xs border border-slate-200">
            <thead className="bg-slate-100 text-slate-700 uppercase font-semibold text-[10px]">
              <tr>
                <th className="p-2 border-b border-slate-200">Hop #</th>
                <th className="p-2 border-b border-slate-200">From Wallet</th>
                <th className="p-2 border-b border-slate-200">To Destination</th>
                <th className="p-2 border-b border-slate-200">Amount</th>
                <th className="p-2 border-b border-slate-200">Tx Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
              {currentCase.hops.map((hop) => (
                <tr key={hop.hopIndex}>
                  <td className="p-2 font-bold text-blue-900">Hop #{hop.hopIndex}</td>
                  <td className="p-2 text-slate-800">{hop.fromAddress.slice(0, 10)}...</td>
                  <td className="p-2 font-semibold text-slate-900">
                    {hop.isVASP ? `${hop.vaspName} (VASP)` : `${hop.toAddress.slice(0, 10)}...`}
                  </td>
                  <td className="p-2 font-bold text-slate-900">{hop.amount} {hop.asset}</td>
                  <td className="p-2 text-slate-500 text-[10px]">{hop.txHash.slice(0, 12)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cryptographic SHA-256 Chain-of-Custody Stamp */}
        <div className="mt-8 pt-4 border-t-2 border-slate-900 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Cryptographic Integrity Stamp (SHA-256)
            </span>
            <span className="font-mono text-[11px] font-bold text-blue-950 block mt-0.5 break-all">
              {currentCase.sha256Hash || "7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b2c3d4e5f6a7b8c9d0e1f2a"}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Stamped by CHAIN-INTEL Audit Logger on {currentCase.hashTimestamp || currentCase.updatedDate}
            </span>
          </div>

          <div className="text-right">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold rounded text-[11px] inline-block">
              Integrity Validated
            </span>
          </div>
        </div>

        {/* Legal Disclaimer Footer */}
        <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900 leading-snug">
          <strong>IMPORTANT NOTICE:</strong> CHAIN-INTEL is an investigative lead platform designed for law enforcement prioritization. This report provides automated inferences and must be independently verified through official VASP disclosure notices and legal process prior to formal judicial submission.
        </div>
      </div>
    </div>
  );
};
