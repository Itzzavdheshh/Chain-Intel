import React, { useState, useEffect } from 'react';
import { InvestigationCase } from '../../types';
import {
  prepareSahyogRequestClient,
  submitSahyogRequestClient,
  SahyogPreparedDraftPayload,
  SahyogRequestType,
  SahyogSubmissionResult,
} from '../../engine/sahyog/sahyogService';
import {
  X,
  Send,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Lock,
  Download,
  Printer,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Info,
  Hash,
  Scale,
  UserCheck,
} from 'lucide-react';

interface SahyogActionModalProps {
  currentCase: InvestigationCase;
  isOpen: boolean;
  onClose: () => void;
  defaultRequestType?: SahyogRequestType;
}

export const SahyogActionModal: React.FC<SahyogActionModalProps> = ({
  currentCase,
  isOpen,
  onClose,
  defaultRequestType = 'INFORMATION_DISCLOSURE',
}) => {
  const [step, setStep] = useState<number>(1);
  const [requestType, setRequestType] = useState<SahyogRequestType>(defaultRequestType);
  const [selectedVaspName, setSelectedVaspName] = useState<string>('');
  const [draftPayload, setDraftPayload] = useState<SahyogPreparedDraftPayload | null>(null);

  // Investigator-editable inputs
  const [legalReference, setLegalReference] = useState<string>('');
  const [complianceHours, setComplianceHours] = useState<number>(24);
  const [justification, setJustification] = useState<string>('');
  const [investigatorNotes, setInvestigatorNotes] = useState<string>('');
  const [investigatorSignature, setInvestigatorSignature] = useState<string>('');
  const [isConfirmedByInvestigator, setIsConfirmedByInvestigator] = useState<boolean>(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<SahyogSubmissionResult | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSubmissionResult(null);
      setIsConfirmedByInvestigator(false);
      setInvestigatorSignature(currentCase.investigator || 'Inspector R. Sharma');

      const initialVasp = currentCase.nearestDirectDepositVASP || currentCase.vaspDestination || '';
      setSelectedVaspName(initialVasp);

      prepareSahyogRequestClient(currentCase, {
        requestType,
        selectedVaspName: initialVasp,
      }).then((draft) => {
        setDraftPayload(draft);
        setLegalReference(draft.investigatorEditableFields.legalReferenceNumber);
        setComplianceHours(draft.investigatorEditableFields.complianceDeadlineHours);
        setJustification(draft.investigatorEditableFields.justificationSummary);
        setInvestigatorNotes(draft.investigatorEditableFields.investigatorNotes);
      });
    }
  }, [isOpen, currentCase, requestType]);

  const handleVaspChange = (vaspName: string) => {
    setSelectedVaspName(vaspName);
    if (currentCase) {
      prepareSahyogRequestClient(currentCase, {
        requestType,
        selectedVaspName: vaspName,
      }).then((draft) => setDraftPayload(draft));
    }
  };

  const handleRequestTypeChange = (type: SahyogRequestType) => {
    setRequestType(type);
    if (currentCase) {
      prepareSahyogRequestClient(currentCase, {
        requestType: type,
        selectedVaspName,
      }).then((draft) => {
        setDraftPayload(draft);
        setComplianceHours(type === 'ASSET_PRESERVATION_FREEZE' ? 4 : 24);
      });
    }
  };

  const handleSubmitRequest = async () => {
    if (!draftPayload) return;

    if (!isConfirmedByInvestigator) {
      alert('HUMAN AUTHORIZATION REQUIRED: You must review and check the confirmation box before submitting.');
      return;
    }

    // Merge investigator updates into draft payload
    const finalPayload: SahyogPreparedDraftPayload = {
      ...draftPayload,
      statutoryLegalContext: {
        ...draftPayload.statutoryLegalContext,
        legalReferenceNumber: legalReference,
        complianceDeadlineHours: complianceHours,
        justificationSummary: justification,
      },
      investigatorEditableFields: {
        legalReferenceNumber: legalReference,
        complianceDeadlineHours: complianceHours,
        justificationSummary: justification,
        investigatorNotes,
      },
    };

    setIsSubmitting(true);
    const result = await submitSahyogRequestClient(finalPayload, {
      isAuthorizedByInvestigator: true,
      investigatorSignature,
    });
    setIsSubmitting(false);
    setSubmissionResult(result);
    setStep(5);
  };

  const handleDownloadEvidencePackage = () => {
    if (!draftPayload) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(draftPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `EVIDENCE_PACKAGE_${draftPayload.evidenceSnapshot.snapshotId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (!isOpen) return null;

  const isDemoMode = draftPayload?.integrationMode === 'DEMO' || true;
  const hasTargetVASP = draftPayload?.hasTargetVASP ?? true;

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white border border-slate-300 rounded-xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header Banner */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600/30 border border-blue-400/40 rounded-lg text-blue-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  SAHYOG Action Workflow Builder
                </h2>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    isDemoMode
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {isDemoMode ? '● DEMO MODE (SIMULATED)' : '● SAHYOG CONNECTED'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Case #{currentCase.caseReference} | Target: {currentCase.targetInput} ({currentCase.chain})
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Wizard Indicator Header */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-600">
          <div className="flex items-center space-x-4">
            <span className={`flex items-center space-x-1.5 ${step === 1 ? 'text-blue-700 font-bold' : step > 1 ? 'text-emerald-700' : 'text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 1 ? 'bg-blue-600 text-white' : step > 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>1</span>
              <span>1. VASP Review</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />

            <span className={`flex items-center space-x-1.5 ${step === 2 ? 'text-blue-700 font-bold' : step > 2 ? 'text-emerald-700' : 'text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 2 ? 'bg-blue-600 text-white' : step > 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>2</span>
              <span>2. Request Type</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />

            <span className={`flex items-center space-x-1.5 ${step === 3 ? 'text-blue-700 font-bold' : step > 3 ? 'text-emerald-700' : 'text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? 'bg-blue-600 text-white' : step > 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>3</span>
              <span>3. Evidence Package</span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />

            <span className={`flex items-center space-x-1.5 ${step === 4 ? 'text-blue-700 font-bold' : step > 4 ? 'text-emerald-700' : 'text-slate-400'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 4 ? 'bg-blue-600 text-white' : step > 4 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>4</span>
              <span>4. Confirmation</span>
            </span>
          </div>

          {draftPayload && (
            <div className="font-mono text-[11px] text-slate-500 bg-white px-2.5 py-1 rounded border border-slate-200 flex items-center space-x-1">
              <Hash className="w-3 h-3 text-blue-600" />
              <span>Snapshot: {draftPayload.evidenceSnapshot.snapshotId}</span>
            </div>
          )}
        </div>

        {/* Modal Wizard Body Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* STEP 1: TARGET & CANDIDATE VASP REVIEW */}
          {step === 1 && draftPayload && (
            <div className="space-y-5">
              <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-4 text-xs text-blue-900 flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-blue-950 text-sm">Step 1: Target Identification & VASP Candidate Selection</h4>
                  <p className="text-blue-800 mt-1 leading-relaxed">
                    CHAIN-INTEL automatically populates the investigated target wallet, network, and candidate exchange destinations from live on-chain fund flows. Review the target attribution below.
                  </p>
                </div>
              </div>

              {/* Unhosted Wallet Warning Banner if no VASP match */}
              {!hasTargetVASP && (
                <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 text-xs text-amber-900 space-y-2">
                  <div className="flex items-center space-x-2 font-bold text-amber-950">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>NO ATTRIBUTABLE VASP MATCH FOUND</span>
                  </div>
                  <p className="leading-relaxed">
                    The investigated address <strong className="font-mono">{currentCase.targetInput}</strong> transferred funds exclusively across unhosted / self-custody wallets without reaching a known VASP deposit cluster.
                  </p>
                  <div className="p-2.5 bg-amber-100/60 rounded border border-amber-300/60 font-semibold">
                    VASP-directed statutory notices (Sec 91/102) are restricted until an exchange deposit destination is identified. You may still export the evidence package or generate an investigation report.
                  </div>
                </div>
              )}

              {/* Two Confidence Metrics Cards (Fund Flow vs VASP Entity) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Fund-Flow Path Continuity Confidence
                  </span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-black text-slate-900 font-mono">
                      {draftPayload.attributionContext.fundFlowConfidenceScore}
                    </span>
                    <span className="text-xs text-slate-500 font-bold">/ 100</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded ml-auto">
                      VERIFIED PATH
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">
                    Calculated from hop continuity, block timestamps, and transaction telemetry across {draftPayload.evidenceSnapshot.package.hopsCount || 1} hops.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    VASP Entity Attribution Confidence
                  </span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-black text-slate-900 font-mono">
                      {draftPayload.attributionContext.vaspAttributionConfidenceScore}
                    </span>
                    <span className="text-xs text-slate-500 font-bold">/ 100</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded ml-auto">
                      {draftPayload.attributionContext.attributionTier}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-snug">
                    Evidence-backed match mapping address to target VASP deposit cluster node.
                  </p>
                </div>
              </div>

              {/* Candidate VASP Selection Table */}
              <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Target VASP Candidate Selection
                </h4>
                <div className="space-y-2">
                  {draftPayload.attributionContext.candidateVASPs && draftPayload.attributionContext.candidateVASPs.length > 0 ? (
                    draftPayload.attributionContext.candidateVASPs.map((vasp: any, idx: number) => (
                      <label
                        key={idx}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition ${
                          selectedVaspName === vasp.vaspName
                            ? 'bg-blue-50/80 border-blue-400 text-blue-950'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="candidateVasp"
                            checked={selectedVaspName === vasp.vaspName}
                            onChange={() => handleVaspChange(vasp.vaspName)}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-xs">{vasp.vaspName}</span>
                              {vasp.isNearestDirectDeposit && (
                                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-[9px] font-bold uppercase">
                                  Nearest Direct Deposit
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-mono text-slate-500 block mt-0.5">
                              Deposit Addr: {vasp.depositAddress || 'VASP Cluster Node'} | Hop Distance: {vasp.hopDistance || 1}
                            </span>
                          </div>
                        </div>

                        <div className="text-right font-mono">
                          <span className="text-xs font-bold text-slate-900 block">{vasp.confidenceScore || 85}%</span>
                          <span className="text-[10px] text-slate-400">Confidence</span>
                        </div>
                      </label>
                    ))
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600">
                      Primary Attributed VASP: <strong className="text-slate-900 font-semibold">{draftPayload.attributionContext.targetVaspName}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: REQUEST TYPE & STATUTORY LEGAL DETAILS */}
          {step === 2 && draftPayload && (
            <div className="space-y-5">
              <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-4 text-xs text-blue-900">
                <h4 className="font-bold text-blue-950 text-sm">Step 2: Request Category & Legal Authorization</h4>
                <p className="text-blue-800 mt-1">
                  Select the appropriate statutory request type under BNSS / Cr.P.C. System-derived blockchain fields are locked as <span className="font-bold text-slate-700">SYSTEM-GENERATED</span>, while legal references remain investigator-editable.
                </p>
              </div>

              {/* Request Type Selector */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleRequestTypeChange('INFORMATION_DISCLOSURE')}
                  className={`p-4 rounded-lg border text-left transition ${
                    requestType === 'INFORMATION_DISCLOSURE'
                      ? 'bg-blue-50 border-blue-500 text-blue-950 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-xs">Section 91 Cr.P.C. / BNSS</span>
                  </div>
                  <h5 className="font-bold text-xs text-slate-900">Information Disclosure</h5>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    Statutory notice to VASP for KYC files, IP logs, bank withdrawal ledgers.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleRequestTypeChange('ASSET_PRESERVATION_FREEZE')}
                  className={`p-4 rounded-lg border text-left transition ${
                    requestType === 'ASSET_PRESERVATION_FREEZE'
                      ? 'bg-rose-50 border-rose-500 text-rose-950 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Lock className="w-4 h-4 text-rose-600" />
                    <span className="font-bold text-xs">Section 102 Cr.P.C. / BNSS</span>
                  </div>
                  <h5 className="font-bold text-xs text-slate-900">Asset Restraint / Freeze Order</h5>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    Statutory order to immediately freeze target VASP account & prevent withdrawal.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleRequestTypeChange('INTER_AGENCY_HANDOFF')}
                  className={`p-4 rounded-lg border text-left transition ${
                    requestType === 'INTER_AGENCY_HANDOFF'
                      ? 'bg-purple-50 border-purple-500 text-purple-950 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Send className="w-4 h-4 text-purple-600" />
                    <span className="font-bold text-xs">Inter-Agency Escalation</span>
                  </div>
                  <h5 className="font-bold text-xs text-slate-900">SAHYOG Central Handoff</h5>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    Cross-agency case transfer & coordination via central I4C portal.
                  </p>
                </button>
              </div>

              {/* Form Input Fields (Investigator Editable vs System Generated) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
                <div>
                  <label className="font-bold text-slate-700 flex items-center justify-between mb-1">
                    <span>Legal / Statutory Reference Number</span>
                    <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold uppercase">INVESTIGATOR-EDITABLE</span>
                  </label>
                  <input
                    type="text"
                    value={legalReference}
                    onChange={(e) => setLegalReference(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. FIR-2026-MH-9812"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 flex items-center justify-between mb-1">
                    <span>Compliance Response Deadline (Hours)</span>
                    <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold uppercase">INVESTIGATOR-EDITABLE</span>
                  </label>
                  <select
                    value={complianceHours}
                    onChange={(e) => setComplianceHours(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-300 rounded font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value={4}>4 Hours (Emergency Freeze / Restraint)</option>
                    <option value={12}>12 Hours (Urgent Disclosure)</option>
                    <option value={24}>24 Hours (Standard Statutory Timeline)</option>
                    <option value={48}>48 Hours (Detailed Account Audit)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="font-bold text-slate-700 flex items-center justify-between mb-1">
                    <span>Investigator Case Justification Summary</span>
                    <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold uppercase">INVESTIGATOR-EDITABLE</span>
                  </label>
                  <textarea
                    rows={3}
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded font-sans text-xs focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: EVIDENCE SNAPSHOT & PACKAGE PREVIEW */}
          {step === 3 && draftPayload && (
            <div className="space-y-5">
              <div className="bg-slate-900 text-white p-4 rounded-lg flex items-center justify-between shadow-md">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Cryptographic Evidence Snapshot
                  </span>
                  <span className="font-mono text-base font-bold text-emerald-400">
                    {draftPayload.evidenceSnapshot.snapshotId}
                  </span>
                </div>

                <div className="text-right font-mono text-xs">
                  <span className="text-slate-400 block text-[10px]">SHA-256 Package Checksum</span>
                  <span className="text-blue-300 truncate max-w-[280px] block">
                    {draftPayload.evidenceSnapshot.sha256Hash}
                  </span>
                </div>
              </div>

              {/* JSON Payload Inspection Box */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden shadow-inner">
                <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Structured SAHYOG Payload</span>
                  <button
                    onClick={handleDownloadEvidencePackage}
                    className="text-blue-400 hover:text-blue-300 flex items-center space-x-1 font-sans font-semibold text-[11px]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download JSON Package</span>
                  </button>
                </div>
                <pre className="p-4 font-mono text-xs text-emerald-400 overflow-x-auto max-h-[260px] leading-relaxed">
                  {JSON.stringify(draftPayload, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* STEP 4: MANDATORY INVESTIGATOR CONFIRMATION & REVIEW */}
          {step === 4 && draftPayload && (
            <div className="space-y-5">
              <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 text-xs text-amber-900 flex items-start space-x-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-950 text-sm">Step 4: Authorized Officer Review & Legal Confirmation</h4>
                  <p className="text-amber-900 mt-1 leading-relaxed">
                    Automated intelligence provides evidence-backed attribution recommendations. The authorized Investigating Officer must review and confirm the action payload prior to SAHYOG submission.
                  </p>
                </div>
              </div>

              {/* Summary Confirmation Card */}
              <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 text-xs font-sans">
                <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Case Reference</span>
                    <span className="font-bold text-slate-900 font-mono">{draftPayload.caseReference}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Request Category</span>
                    <span className="font-bold text-slate-900">{draftPayload.statutoryLegalContext.statuteSection}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Target VASP</span>
                    <span className="font-bold text-blue-900">{draftPayload.attributionContext.targetVaspName}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Target Address</span>
                    <span className="font-bold text-slate-900 font-mono truncate block">{draftPayload.investigationContext.targetWallet}</span>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Authorized Officer Signature / Designation</label>
                  <input
                    type="text"
                    value={investigatorSignature}
                    onChange={(e) => setInvestigatorSignature(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded font-semibold text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Inspector R. Sharma (Cyber Crime Cell)"
                  />
                </div>

                {/* Mandatory Checkbox */}
                <label className="flex items-start space-x-3 p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isConfirmedByInvestigator}
                    onChange={(e) => setIsConfirmedByInvestigator(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 mt-0.5"
                  />
                  <span className="text-xs text-blue-950 leading-relaxed font-medium">
                    I confirm that I am an authorized Investigating Officer, have reviewed the underlying on-chain transaction evidence snapshot <strong className="font-mono text-blue-900">{draftPayload.evidenceSnapshot.snapshotId}</strong>, and authorize submission of this statutory request to SAHYOG.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 5: SUBMISSION RESULT & RECEIPT */}
          {step === 5 && submissionResult && (
            <div className="space-y-5 text-xs">
              <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-5 flex items-start space-x-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-emerald-950">SAHYOG Action Submission Complete</h3>
                    <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded text-[10px] font-bold uppercase font-mono">
                      {submissionResult.mode === 'DEMO' ? 'DEMO SUBMITTED' : 'SUBMITTED'}
                    </span>
                  </div>
                  <p className="text-emerald-900 leading-relaxed">{submissionResult.message}</p>
                </div>
              </div>

              {/* Receipt Summary Card */}
              <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-lg p-5 space-y-4 font-mono">
                <div className="grid grid-cols-2 gap-4 border-b border-slate-800 pb-4 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block font-sans font-bold">SAHYOG Request Reference ID</span>
                    <span className="text-base font-bold text-emerald-400">{submissionResult.requestId}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block font-sans font-bold">Submission Timestamp</span>
                    <span className="text-slate-200">{new Date().toISOString()}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block font-sans font-bold">Evidence Checksum (SHA-256)</span>
                    <span className="text-blue-300 text-[11px] truncate block">{submissionResult.sha256Hash}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] uppercase block font-sans font-bold">Integration Mode</span>
                    <span className="text-amber-400 font-bold">{submissionResult.mode || 'DEMO'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={handleDownloadEvidencePackage}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold font-sans rounded-md shadow transition flex items-center space-x-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Evidence Package (JSON)</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold font-sans rounded-md border border-slate-700 transition flex items-center space-x-1.5"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Audit Receipt</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          {step > 1 && step < 5 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 font-semibold rounded-md border border-slate-300 transition flex items-center space-x-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center space-x-3">
            {step < 4 && (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-2xs transition flex items-center space-x-1.5"
              >
                <span>Next Step</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {step === 4 && (
              <button
                type="button"
                disabled={!isConfirmedByInvestigator || isSubmitting}
                onClick={handleSubmitRequest}
                className={`px-6 py-2 text-white font-semibold rounded-md shadow transition flex items-center space-x-2 ${
                  isConfirmedByInvestigator && !isSubmitting
                    ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                    : 'bg-slate-400 cursor-not-allowed opacity-60'
                }`}
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'Transmitting to SAHYOG...' : 'Authorize & Submit Request'}</span>
              </button>
            )}

            {step === 5 && (
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-md transition"
              >
                Close Workflow
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
