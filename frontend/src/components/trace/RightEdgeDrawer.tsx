import React, { useState } from 'react';
import { GraphEdge } from '../../types';
import { X, ExternalLink, Copy, Check, ShieldCheck, Link, GitCommit, AlertTriangle } from 'lucide-react';
import { getExplorerTxUrl, getChainExplorerName } from '../../utils/explorerLinks';

interface RightEdgeDrawerProps {
  edge: GraphEdge | null;
  onClose: () => void;
}

export const RightEdgeDrawer: React.FC<RightEdgeDrawerProps> = ({ edge, onClose }) => {
  const [copiedTxHash, setCopiedTxHash] = useState(false);
  const [copiedFrom, setCopiedFrom] = useState(false);
  const [copiedTo, setCopiedTo] = useState(false);

  if (!edge) return null;

  const rawFrom = edge.source ? edge.source.replace(/^[^:]+:/, '') : 'Not available';
  const rawTo = edge.target ? edge.target.replace(/^[^:]+:/, '') : 'Not available';
  const chainFromEdge = edge.source ? edge.source.split(':')[0] : undefined;
  const chainToEdge = edge.target ? edge.target.split(':')[0] : undefined;

  const copyToClipboard = (text: string, setCopiedFn: (val: boolean) => void) => {
    if (!text || text === 'Not available') return;
    navigator.clipboard.writeText(text);
    setCopiedFn(true);
    setTimeout(() => setCopiedFn(false), 2000);
  };

  const explorerTxUrl = getExplorerTxUrl(chainFromEdge, edge.txHash);
  const explorerName = getChainExplorerName(chainFromEdge);

  const cd = edge.crossChainDetails;

  return (
    <div className="w-84 bg-white border-l border-slate-200 h-full p-4 flex flex-col justify-between shadow-xl z-30 overflow-y-auto">
      <div>
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <div className="flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 rounded-full ${edge.isCrossChain ? 'bg-purple-600 animate-pulse' : 'bg-emerald-600'}`}></span>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {edge.isCrossChain ? 'Cross-Chain Transfer Evidence' : 'Transaction Evidence'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cross-Chain Correlation Card if edge is cross-chain */}
        {edge.isCrossChain && cd && (
          <div className="bg-purple-950 text-white rounded-md p-3 mb-4 border border-purple-800/60 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Link className="w-4 h-4 text-purple-400" />
                <span className="font-bold text-purple-300 uppercase text-[10px] tracking-wider">Cross-Chain Correlation</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-purple-900 text-purple-200 font-mono text-[10px] font-bold border border-purple-700">
                {cd.correlationStatus}
              </span>
            </div>

            <div className="flex justify-between items-center text-[11px]">
              <span className="text-purple-300">Method:</span>
              <span className="font-mono font-bold text-white bg-purple-900/80 px-1.5 py-0.5 rounded text-[10px]">
                {cd.correlationMethod}
              </span>
            </div>

            <div className="flex justify-between items-center text-[11px]">
              <span className="text-purple-300">Chains Connected:</span>
              <span className="font-mono font-bold text-amber-300">
                {cd.sourceChain.toUpperCase()} → {cd.destinationChain ? cd.destinationChain.toUpperCase() : 'UNESTABLISHED'}
              </span>
            </div>

            {cd.observedTimeDeltaSeconds !== undefined && (
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-purple-300">Time Delta:</span>
                <span className="font-mono text-white">{cd.observedTimeDeltaSeconds}s</span>
              </div>
            )}

            {cd.observedValueDeltaPercent !== undefined && (
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-purple-300 font-semibold">Value Delta:</span>
                <span className="font-mono text-emerald-300">{cd.observedValueDeltaPercent}%</span>
              </div>
            )}

            {/* Reasons */}
            {cd.reasons && cd.reasons.length > 0 && (
              <div className="pt-2 border-t border-purple-800/60 space-y-1">
                <span className="text-[10px] font-bold text-purple-300 uppercase block">Correlation Reasons:</span>
                {cd.reasons.map((r: string, i: number) => (
                  <div key={i} className="flex items-start space-x-1 text-[10px] text-purple-200">
                    <GitCommit className="w-3 h-3 text-purple-400 shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Limitations */}
            {cd.limitations && (
              <div className="bg-purple-900/60 p-2 rounded border border-purple-700/60 space-y-1">
                <div className="flex items-center space-x-1 text-amber-300 text-[10px] font-bold">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Evidentiary Note</span>
                </div>
                <p className="text-[10px] text-purple-200/90 leading-relaxed italic">
                  {cd.limitations}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Evidence Status Badge */}
        <div className="bg-slate-50 border border-slate-200 rounded-md p-3 mb-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">On-Chain Transfer Proof</span>
            <span className="flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <ShieldCheck className="w-3 h-3" />
              <span>Real Provider Record</span>
            </span>
          </div>
          <div className="text-sm font-mono font-bold text-slate-900 mt-1">
            {edge.value || edge.amount} {edge.asset || 'ETH'}
          </div>
        </div>

        {/* Detailed Properties Table */}
        <div className="space-y-3 text-xs">
          {/* Transaction Hash */}
          <div className="pb-2 border-b border-slate-100">
            <span className="text-slate-400 text-[10px] font-bold uppercase block mb-1">Transaction Hash</span>
            <div className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-200">
              <span className="font-mono text-[11px] font-bold text-slate-900 break-all">{edge.txHash}</span>
              {edge.txHash && edge.txHash !== 'Not available' && (
                <button
                  onClick={() => copyToClipboard(edge.txHash, setCopiedTxHash)}
                  className="ml-1.5 p-1 hover:bg-slate-200 rounded text-slate-600 shrink-0"
                  title="Copy Transaction Hash"
                >
                  {copiedTxHash ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

          {/* Network & Source */}
          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Chain Network:</span>
            <span className="font-semibold text-slate-900">
              {chainFromEdge ? chainFromEdge.toUpperCase() : 'Ethereum Mainnet'} {chainToEdge && chainToEdge !== chainFromEdge ? `→ ${chainToEdge.toUpperCase()}` : ''}
            </span>
          </div>

          {/* Block Number */}
          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Block Number:</span>
            <span className="font-mono font-semibold text-slate-900">
              {edge.blockNumber ? `#${edge.blockNumber.toLocaleString()}` : 'Not available'}
            </span>
          </div>

          {/* Timestamp */}
          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Timestamp (UTC):</span>
            <span className="font-mono text-[11px] text-slate-800 font-semibold">
              {edge.timestamp && edge.timestamp !== 'Not available'
                ? edge.timestamp
                : edge.blockNumber
                ? `Timestamp unavailable — Block ${edge.blockNumber}`
                : 'Not available'}
            </span>
          </div>

          {/* From Address */}
          <div className="pb-2 border-b border-slate-100">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 text-[10px] font-bold uppercase">From Address</span>
              <button
                onClick={() => copyToClipboard(rawFrom, setCopiedFrom)}
                className="text-[10px] text-blue-600 font-semibold hover:underline flex items-center space-x-1"
              >
                {copiedFrom ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>Copy</span>
              </button>
            </div>
            <span className="font-mono text-[11px] text-slate-900 break-all block bg-slate-50 p-2 rounded border border-slate-200">
              {rawFrom}
            </span>
          </div>

          {/* To Address */}
          <div className="pb-2 border-b border-slate-100">
            <div className="flex items-center justify-between mb-1">
              <span className="text-slate-400 text-[10px] font-bold uppercase">To Address</span>
              <button
                onClick={() => copyToClipboard(rawTo, setCopiedTo)}
                className="text-[10px] text-blue-600 font-semibold hover:underline flex items-center space-x-1"
              >
                {copiedTo ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>Copy</span>
              </button>
            </div>
            <span className="font-mono text-[11px] text-slate-900 break-all block bg-slate-50 p-2 rounded border border-slate-200">
              {rawTo}
            </span>
          </div>

          {/* Value & Asset */}
          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Transfer Value:</span>
            <span className="font-mono font-bold text-slate-900">{edge.value || edge.amount} {edge.asset}</span>
          </div>

          {/* Direction & Hop */}
          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Direction & Hop:</span>
            <span className="font-semibold text-slate-900">
              {edge.direction || 'OUT'} Transfer (Hop #{edge.hop || 1})
            </span>
          </div>

          {/* Data Source Provenance */}
          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Data Source:</span>
            <span className="font-semibold text-blue-900">{edge.sourceProvider || 'Alchemy / Multi-Chain Explorer'}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-3 border-t border-slate-100 mt-4">
        {explorerTxUrl ? (
          <a
            href={explorerTxUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded flex items-center justify-center space-x-1.5 transition shadow-2xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Verify on {explorerName}</span>
          </a>
        ) : (
          <button
            disabled
            className="w-full py-2 bg-slate-100 text-slate-400 text-xs font-semibold rounded cursor-not-allowed text-center"
          >
            Explorer Link Not Available
          </button>
        )}
      </div>
    </div>
  );
};
