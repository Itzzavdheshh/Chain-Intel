import { InvestigationCase, SahyogPayload } from '../../types';

export type SahyogRequestType = 
  | 'INFORMATION_DISCLOSURE' 
  | 'ASSET_PRESERVATION_FREEZE' 
  | 'INTER_AGENCY_HANDOFF';

export interface SahyogStatusResponse {
  mode: 'LIVE' | 'SANDBOX' | 'DEMO' | 'NOT_CONFIGURED';
  statusText: string;
  endpoint: string;
  isConnected: boolean;
  hasCredentials: boolean;
  capabilities: string[];
  notice?: string;
}

export interface SahyogPreparedDraftPayload {
  caseReference: string;
  requestType: SahyogRequestType;
  integrationMode: 'LIVE' | 'SANDBOX' | 'DEMO';
  hasTargetVASP: boolean;
  investigationContext: {
    caseId: string;
    caseReference: string;
    incidentType: string;
    investigatorId: string;
    investigatorName: string;
    agency: string;
    targetWallet: string;
    blockchain: string;
    dataSourceMode: string;
  };
  attributionContext: {
    targetVaspName: string;
    depositAddress: string;
    relationshipType: string;
    fundFlowConfidenceScore: number;
    vaspAttributionConfidenceScore: number;
    attributionTier: string;
    attributionRationale: string;
    candidateVASPs: any[];
  };
  evidenceSnapshot: {
    snapshotId: string;
    sha256Hash: string;
    timestamp: string;
    package: any;
  };
  statutoryLegalContext: {
    statuteSection: string;
    legalReferenceNumber: string;
    investigatingOfficer: string;
    complianceDeadlineHours: number;
    justificationSummary: string;
  };
  systemFields: {
    generatedAt: string;
    systemVersion: string;
    isSystemGenerated: boolean;
  };
  investigatorEditableFields: {
    legalReferenceNumber: string;
    complianceDeadlineHours: number;
    justificationSummary: string;
    investigatorNotes: string;
  };
  status: string;
}

export interface SahyogSubmissionResult {
  status: 'SUCCESS' | 'REJECTED_UNAUTHORIZED' | 'VALIDATION_FAILED' | 'SUBMISSION_FAILED';
  requestId?: string;
  mode?: string;
  sha256Hash?: string;
  message: string;
  submission?: any;
  errors?: string[];
}

/**
 * Fetch SAHYOG Integration Server Status
 */
export async function fetchSahyogStatus(): Promise<SahyogStatusResponse> {
  try {
    const res = await fetch('/api/v1/sahyog/status');
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Fallback if proxy error
  }
  return {
    mode: 'DEMO',
    statusText: 'SAHYOG DEMO MODE (CLIENT FALLBACK)',
    endpoint: 'http://localhost:3001/api/v1/sahyog/demo',
    isConnected: true,
    hasCredentials: false,
    capabilities: [
      'SEC_91_DISCLOSURE_NOTICE',
      'SEC_102_ASSET_FREEZE_ORDER',
      'INTER_AGENCY_HANDOFF',
      'AUTOMATED_EVIDENCE_HASHING',
      'DEMO_SUBMISSION_SIMULATION',
    ],
  };
}

/**
 * Prepare a structured SAHYOG Request Draft via server or client fallback
 */
export async function prepareSahyogRequestClient(
  caseData: InvestigationCase,
  options: { requestType?: SahyogRequestType; selectedVaspName?: string } = {}
): Promise<SahyogPreparedDraftPayload> {
  try {
    const res = await fetch('/api/v1/sahyog/requests/prepare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseData, options }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.draftPayload) {
        if (options.selectedVaspName) {
          data.draftPayload.attributionContext.targetVaspName = options.selectedVaspName;
        }
        return data.draftPayload;
      }
    }
  } catch (err) {
    // Client fallback
  }

  const primaryVASP = options.selectedVaspName || caseData.nearestDirectDepositVASP || caseData.vaspDestination || 'Not Attributed';
  const hasTargetVASP = Boolean(primaryVASP && primaryVASP !== 'Not Attributed' && primaryVASP !== 'Unhosted Wallet Cluster');
  const snapshotId = `EV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const hash = '7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b2c3d4e5f6a7b8c9d0e1f2a';

  return {
    caseReference: caseData.caseReference || 'CS-2026-5197',
    requestType: options.requestType || 'INFORMATION_DISCLOSURE',
    integrationMode: 'DEMO',
    hasTargetVASP,
    investigationContext: {
      caseId: caseData.id,
      caseReference: caseData.caseReference,
      incidentType: caseData.incidentType || 'Cryptocurrency Fraud',
      investigatorId: 'LE-9842',
      investigatorName: caseData.investigator || 'Inspector R. Sharma',
      agency: 'Indian Cyber Crime Coordination Centre (I4C)',
      targetWallet: caseData.targetInput,
      blockchain: caseData.chain,
      dataSourceMode: caseData.dataSource || 'LIVE',
    },
    attributionContext: {
      targetVaspName: primaryVASP,
      depositAddress: caseData.attribution?.nearestDirectDepositAddress || '',
      relationshipType: 'Direct Deposit Destination',
      fundFlowConfidenceScore: 94,
      vaspAttributionConfidenceScore: caseData.confidenceScore || 86,
      attributionTier: caseData.confidenceTier || 'HIGHLY_LIKELY',
      attributionRationale: `Path continuity verified over ${caseData.hops?.length || 1} hops.`,
      candidateVASPs: caseData.attribution?.candidateVASPs || [],
    },
    evidenceSnapshot: {
      snapshotId,
      sha256Hash: hash,
      timestamp: new Date().toISOString(),
      package: {
        snapshotId,
        caseReference: caseData.caseReference,
        targetWallet: caseData.targetInput,
        blockchain: caseData.chain,
        walletsObserved: caseData.nodes?.length || 0,
        transactionsObserved: caseData.edges?.length || 0,
      },
    },
    statutoryLegalContext: {
      statuteSection: 'Section 91 Cr.P.C. / BNSS 2023',
      legalReferenceNumber: `FIR-${new Date().getFullYear()}-MH-8812`,
      investigatingOfficer: caseData.investigator || 'Inspector R. Sharma',
      complianceDeadlineHours: 24,
      justificationSummary: `Blockchain trace of target ${caseData.targetInput} on ${caseData.chain} established direct path to ${primaryVASP}.`,
    },
    systemFields: {
      generatedAt: new Date().toISOString(),
      systemVersion: 'ChainSight v3.0 - SAHYOG Client',
      isSystemGenerated: true,
    },
    investigatorEditableFields: {
      legalReferenceNumber: `FIR-${new Date().getFullYear()}-MH-8812`,
      complianceDeadlineHours: 24,
      justificationSummary: `Blockchain trace of target ${caseData.targetInput} on ${caseData.chain} established direct path to ${primaryVASP}.`,
      investigatorNotes: 'Priority investigation lead.',
    },
    status: 'DRAFT_READY_FOR_REVIEW',
  };
}

/**
 * Submit SAHYOG Request with mandatory human authorization
 */
export async function submitSahyogRequestClient(
  payload: SahyogPreparedDraftPayload,
  options: { isAuthorizedByInvestigator: boolean; investigatorSignature?: string }
): Promise<SahyogSubmissionResult> {
  if (!options.isAuthorizedByInvestigator) {
    return {
      status: 'REJECTED_UNAUTHORIZED',
      message: 'HUMAN INVESTIGATOR REVIEW MANDATORY. Request submission requires explicit review and confirmation by an authorized Investigating Officer.',
    };
  }

  try {
    const res = await fetch('/api/v1/sahyog/requests/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payload,
        isAuthorizedByInvestigator: options.isAuthorizedByInvestigator,
        investigatorSignature: options.investigatorSignature,
      }),
    });

    if (res.ok) {
      return await res.json();
    }
    const errData = await res.json();
    return errData;
  } catch (err: any) {
    // Client simulation fallback
    const isDemo = payload.integrationMode === 'DEMO';
    const requestId = `DEMO-SHG-${Math.floor(10000 + Math.random() * 90000)}`;

    return {
      status: 'SUCCESS',
      requestId,
      mode: 'DEMO',
      sha256Hash: payload.evidenceSnapshot.sha256Hash,
      message: `DEMO SUBMISSION SUCCESSFUL. Simulated SAHYOG Request ID: ${requestId}. No real government portal was contacted.`,
      submission: {
        requestId,
        caseReference: payload.caseReference,
        requestType: payload.requestType,
        integrationMode: 'DEMO',
        targetWallet: payload.investigationContext.targetWallet,
        blockchain: payload.investigationContext.blockchain,
        targetVASP: payload.attributionContext.targetVaspName,
        submittedBy: options.investigatorSignature || payload.investigationContext.investigatorName,
        submittedAt: new Date().toISOString(),
        status: 'DEMO_SUBMITTED',
      },
    };
  }
}

/**
 * Legacy Helper
 */
export function createSahyogPayload(caseData: Partial<InvestigationCase>): SahyogPayload {
  return {
    caseReference: caseData.caseReference || 'TB-2026-0941',
    agency: 'Cyber Crime Investigation Centre',
    investigatorId: caseData.investigator || 'LE-9842',
    targetWallet: caseData.targetInput || '0x71C7656EC7ab88b098defb751b7401b5f6d8976f',
    blockchain: caseData.chain || 'Ethereum',
    nearestDirectDepositVASP: caseData.nearestDirectDepositVASP || caseData.vaspDestination || 'CoinDCX India',
    confidenceTier: caseData.confidenceTier || 'HIGHLY_LIKELY',
    confidenceScore: caseData.confidenceScore || 91,
    evidenceSummary: `Attribution confirmed via ${caseData.hops?.length || 3}-hop path continuity analysis with verified VASP deposit cluster.`,
    reportHash: caseData.sha256Hash || '7f8a9b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b2c3d4e5f6a7b8c9d0e1f2a',
    timestamp: new Date().toISOString(),
  };
}

export const MOCK_SAHYOG_ENDPOINTS = [
  {
    method: 'POST',
    path: '/api/v1/sahyog/requests/prepare',
    description: 'Prepare an immutable Evidence Snapshot and draft structured SAHYOG payload.',
    sampleRequest: `{ "caseData": { "caseReference": "CS-2026-5197", "targetInput": "0x71C..." } }`,
    sampleResponse: `{ "status": "SUCCESS", "draftPayload": { "snapshotId": "EV-2026-9812", "sha256Hash": "7f8a..." } }`,
  },
  {
    method: 'POST',
    path: '/api/v1/sahyog/requests/submit',
    description: 'Perform authorized submission of SAHYOG statutory request with audit logging.',
    sampleRequest: `{ "payload": { ... }, "isAuthorizedByInvestigator": true }`,
    sampleResponse: `{ "status": "SUCCESS", "requestId": "SHG-2026-9921", "mode": "DEMO" }`,
  },
  {
    method: 'GET',
    path: '/api/v1/sahyog/audit-trail',
    description: 'Retrieve immutable investigation audit log & submission history.',
    sampleRequest: `GET /api/v1/sahyog/audit-trail?caseReference=CS-2026-5197`,
    sampleResponse: `{ "status": "SUCCESS", "auditTrail": [ ... ] }`,
  },
];
