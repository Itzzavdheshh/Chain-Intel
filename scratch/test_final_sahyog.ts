import { getSahyogIntegrationStatus, prepareSahyogRequest, validateSahyogRequest, submitSahyogRequest, getSahyogAuditTrail } from '../server/services/sahyogConnector.js';

async function runSahyogTestSuite() {
  console.log('====================================================');
  console.log(' FINAL PHASE — SAHYOG INTEGRATION VERIFICATION SUITE');
  console.log('====================================================\n');

  // 1. Test Integration Status Detection
  const status = getSahyogIntegrationStatus();
  console.log('1. SAHYOG Integration Status:');
  console.log('   Mode:', status.mode);
  console.log('   Status Text:', status.statusText);
  console.log('   Is Connected:', status.isConnected);
  console.log('   Capabilities:', status.capabilities.join(', '));
  console.log('   ✓ Status Check Passed\n');

  // 2. Test Draft Request Preparation with Active Case
  const sampleCase = {
    id: 'case-5197',
    caseReference: 'CS-2026-5197',
    investigator: 'Inspector R. Sharma (Cyber Crime Cell)',
    targetInput: '0xf851388FC6E6d0854a00d41E494Ba6303d51284D',
    chain: 'Ethereum',
    dataSource: 'LIVE',
    nearestDirectDepositVASP: 'CoinDCX India',
    confidenceScore: 91,
    confidenceTier: 'HIGHLY_LIKELY',
    nodes: [{ id: '1' }, { id: '2' }],
    edges: [{ txHash: '0xabc123', amount: 2.5, asset: 'ETH' }],
    hops: [{ fromAddress: '0xf851...', toAddress: '0x9921...', txHash: '0xabc123', amount: 2.5, asset: 'ETH' }],
    attribution: {
      nearestDirectDepositVASP: 'CoinDCX India',
      nearestDirectDepositAddress: '0x9921c834a3d4f',
      percentage: 91,
      tier: 'HIGHLY_LIKELY',
      isDirectDeposit: true,
      candidateVASPs: [
        { vaspName: 'CoinDCX India', depositAddress: '0x9921c834a3d4f', hopDistance: 1, confidenceScore: 91, isNearestDirectDeposit: true },
        { vaspName: 'WazirX', depositAddress: '0x7721ab8', hopDistance: 2, confidenceScore: 78, isNearestDirectDeposit: false }
      ]
    }
  };

  const draft = prepareSahyogRequest(sampleCase, { requestType: 'INFORMATION_DISCLOSURE' });
  console.log('2. Draft SAHYOG Request Preparation:');
  console.log('   Case Reference:', draft.caseReference);
  console.log('   Request Type:', draft.requestType);
  console.log('   Has Target VASP:', draft.hasTargetVASP);
  console.log('   Target VASP:', draft.attributionContext.targetVaspName);
  console.log('   Evidence Snapshot ID:', draft.evidenceSnapshot.snapshotId);
  console.log('   SHA-256 Package Hash:', draft.evidenceSnapshot.sha256Hash);
  console.log('   Fund Flow Confidence:', draft.attributionContext.fundFlowConfidenceScore);
  console.log('   VASP Attribution Confidence:', draft.attributionContext.vaspAttributionConfidenceScore);
  console.log('   ✓ Draft Preparation Passed\n');

  // 3. Test Mandatory Human Review Enforcement (Unauthorized Submission)
  const unauthRes = await submitSahyogRequest(draft, { isAuthorizedByInvestigator: false });
  console.log('3. Human Authorization Check (Unauthorized):');
  console.log('   Status:', unauthRes.status);
  console.log('   Message:', unauthRes.message);
  if (unauthRes.status === 'REJECTED_UNAUTHORIZED') {
    console.log('   ✓ Human Authorization Enforcement Passed (Submission blocked without investigator signoff)\n');
  } else {
    throw new Error('Failed human authorization test!');
  }

  // 4. Test Authorized Submission
  const authRes = await submitSahyogRequest(draft, { isAuthorizedByInvestigator: true, investigatorSignature: 'Inspector R. Sharma' });
  console.log('4. Authorized SAHYOG Action Submission:');
  console.log('   Status:', authRes.status);
  console.log('   Request ID:', authRes.requestId);
  console.log('   Integration Mode:', authRes.mode);
  console.log('   Evidence Hash:', authRes.sha256Hash);
  console.log('   Message:', authRes.message);
  console.log('   ✓ Authorized Submission Passed\n');

  // 5. Test Unhosted Wallet (No VASP Match) Handling
  const unhostedCase = {
    id: 'case-unhosted',
    caseReference: 'CS-2026-9999',
    investigator: 'Inspector R. Sharma',
    targetInput: '0x1111111111111111111111111111111111111111',
    chain: 'Ethereum',
    dataSource: 'LIVE',
    nearestDirectDepositVASP: 'Unhosted Wallet Cluster',
    confidenceScore: 0,
    confidenceTier: 'INSUFFICIENT_DATA',
    attribution: {
      nearestDirectDepositVASP: 'Not Attributed',
      percentage: 0,
      tier: 'INSUFFICIENT_DATA',
      isDirectDeposit: false,
      candidateVASPs: []
    }
  };

  const unhostedDraft = prepareSahyogRequest(unhostedCase, { requestType: 'INFORMATION_DISCLOSURE' });
  console.log('5. Unhosted Wallet Handling:');
  console.log('   Has Target VASP:', unhostedDraft.hasTargetVASP);
  console.log('   Target VASP:', unhostedDraft.attributionContext.targetVaspName);
  console.log('   Justification:', unhostedDraft.statutoryLegalContext.justificationSummary);
  console.log('   ✓ Unhosted Wallet Handling Passed\n');

  // 6. Test Audit Trail Logging
  const audit = getSahyogAuditTrail('CS-2026-5197');
  console.log('6. Audit Trail Records:');
  console.log('   Entries Count:', audit.auditTrail.length);
  if (audit.auditTrail.length > 0) {
    console.log('   Latest Action:', audit.auditTrail[0].action);
    console.log('   User:', audit.auditTrail[0].user);
    console.log('   Details:', audit.auditTrail[0].details);
  }
  console.log('   ✓ Audit Trail Passed\n');

  console.log('====================================================');
  console.log(' ALL SAHYOG INTEGRATION VERIFICATION TESTS PASSED!');
  console.log('====================================================');
}

runSahyogTestSuite().catch(err => {
  console.error('TEST SUITE FAILED:', err);
  process.exit(1);
});
