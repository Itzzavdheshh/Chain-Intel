import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { resolveAddressNetworks } from './services/chainResolver.js';
import { getAdapter } from './adapters/adapterRegistry.js';
import {
  getSahyogIntegrationStatus,
  prepareSahyogRequest,
  validateSahyogRequest,
  submitSahyogRequest,
  getSahyogRequestDetails,
  getSahyogAuditTrail,
} from './services/sahyogConnector.js';

dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback to default .env if present

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Chain Intel API Gateway',
    version: '3.5.0-phase5-sahyog',
    supportedChains: ['Ethereum', 'Polygon', 'BNB', 'Solana', 'Tron', 'Bitcoin'],
  });
});

// SAHYOG Integration Status Endpoint
app.get('/api/v1/sahyog/status', (req, res) => {
  const status = getSahyogIntegrationStatus();
  return res.json(status);
});

// SAHYOG Request Preparation Endpoint
app.post('/api/v1/sahyog/requests/prepare', (req, res) => {
  const { caseData, options } = req.body || {};
  if (!caseData || typeof caseData !== 'object') {
    return res.status(400).json({
      status: 'INVALID_INPUT',
      message: 'Active investigation caseData object is required to prepare a SAHYOG request.',
    });
  }

  const draft = prepareSahyogRequest(caseData, options || {});
  return res.json({
    status: 'SUCCESS',
    draftPayload: draft,
  });
});

// SAHYOG Request Validation Endpoint
app.post('/api/v1/sahyog/requests/validate', (req, res) => {
  const { payload } = req.body || {};
  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({
      status: 'INVALID_INPUT',
      message: 'Request payload is required for validation.',
    });
  }

  const result = validateSahyogRequest(payload);
  return res.json({
    status: result.isValid ? 'VALID' : 'INVALID',
    ...result,
  });
});

// SAHYOG Request Authorized Submission Endpoint
app.post('/api/v1/sahyog/requests/submit', async (req, res) => {
  const { payload, isAuthorizedByInvestigator, investigatorSignature } = req.body || {};
  if (!payload || typeof payload !== 'object') {
    return res.status(400).json({
      status: 'INVALID_INPUT',
      message: 'Request payload is required for submission.',
    });
  }

  try {
    const result = await submitSahyogRequest(payload, {
      isAuthorizedByInvestigator,
      investigatorSignature,
    });

    if (result.status === 'REJECTED_UNAUTHORIZED') {
      return res.status(403).json(result);
    }

    if (result.status === 'VALIDATION_FAILED') {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (err) {
    return res.status(500).json({
      status: 'SUBMISSION_FAILED',
      message: err.message || 'Internal server error during SAHYOG request submission.',
    });
  }
});

// SAHYOG Request Details Endpoint
app.get('/api/v1/sahyog/requests/:id', (req, res) => {
  const { id } = req.params;
  const result = getSahyogRequestDetails(id);
  if (result.status === 'NOT_FOUND') {
    return res.status(404).json(result);
  }
  return res.json(result);
});

// SAHYOG Audit Trail Endpoint
app.get('/api/v1/sahyog/audit-trail', (req, res) => {
  const { caseReference } = req.query || {};
  const result = getSahyogAuditTrail(caseReference);
  return res.json(result);
});

// Automatic Network Resolution Endpoint
app.post('/api/v1/resolve-network', async (req, res) => {
  const { address } = req.body || {};

  if (!address || typeof address !== 'string' || !address.trim()) {
    return res.status(400).json({
      address: '',
      isValidAddress: false,
      status: 'INVALID_ADDRESS',
      matches: [],
      message: 'Target wallet address is required for network resolution.',
    });
  }

  try {
    const result = await resolveAddressNetworks(address);
    if (result.status === 'INVALID_ADDRESS') {
      return res.status(400).json(result);
    }
    if (result.status === 'LIVE_DATA_UNAVAILABLE') {
      return res.status(503).json(result);
    }
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      address: address.trim(),
      isValidAddress: true,
      status: 'LIVE_DATA_UNAVAILABLE',
      matches: [],
      message: error.message || 'Error occurred during network resolution.',
    });
  }
});

// Multi-Chain Trace Endpoint
app.post('/api/v1/trace', async (req, res) => {
  const { targetInput, chain, maxHops, direction, maxCounterpartiesPerNode, minimumTransferValue, pageKey } = req.body || {};

  if (!targetInput || typeof targetInput !== 'string' || !targetInput.trim()) {
    return res.status(400).json({
      status: 'INVALID_INPUT',
      transactions: [],
      nodes: [],
      edges: [],
      message: 'Target input (wallet address or transaction hash) is required.',
    });
  }

  let targetChain = chain;

  // If chain is NOT provided, invoke Automatic Multi-Chain Resolution
  if (!targetChain || typeof targetChain !== 'string' || !targetChain.trim()) {
    const resolution = await resolveAddressNetworks(targetInput);

    if (resolution.status === 'INVALID_ADDRESS') {
      return res.status(400).json({
        status: 'INVALID_INPUT',
        transactions: [],
        nodes: [],
        edges: [],
        message: resolution.message || 'Invalid wallet address format for any supported network.',
      });
    }

    if (resolution.status === 'LIVE_DATA_UNAVAILABLE') {
      return res.status(503).json({
        status: 'LIVE_DATA_UNAVAILABLE',
        transactions: [],
        nodes: [],
        edges: [],
        message: resolution.message || 'Network resolution provider is currently unavailable.',
      });
    }

    if (resolution.status === 'NO_ACTIVITY') {
      return res.status(200).json({
        status: 'NO_SUPPORTED_ACTIVITY',
        transactions: [],
        nodes: [],
        edges: [],
        resolution,
        message: 'NO SUPPORTED CHAIN ACTIVITY FOUND. The supplied address could not be associated with observable activity on currently supported networks.',
      });
    }

    if (resolution.status === 'MULTIPLE_NETWORKS') {
      return res.status(200).json({
        status: 'MULTIPLE_NETWORKS_DETECTED',
        transactions: [],
        nodes: [],
        edges: [],
        resolution,
        matches: resolution.matches,
        message: 'Multiple networks with activity detected. Please select an investigation scope.',
      });
    }

    if (resolution.status === 'RESOLVED' && resolution.matches.length > 0) {
      targetChain = resolution.matches[0].chain;
    } else {
      return res.status(400).json({
        status: 'INVALID_INPUT',
        transactions: [],
        nodes: [],
        edges: [],
        message: 'Unable to resolve network automatically.',
      });
    }
  }

  const adapter = getAdapter(targetChain);

  if (!adapter) {
    return res.status(400).json({
      status: 'INVALID_INPUT',
      transactions: [],
      nodes: [],
      edges: [],
      message: `Network '${targetChain}' is not supported. Supported networks: Ethereum, Polygon, BNB, Solana, Tron, Bitcoin.`,
    });
  }

  // Dispatch to the matching Chain Adapter's recursive trace engine
  try {
    const result = await adapter.recursiveTrace(targetInput, {
      maxHops: maxHops || 2,
      direction: direction || 'BOTH',
      maxCounterpartiesPerNode: maxCounterpartiesPerNode || 10,
      minimumTransferValue,
      pageKey,
    });

    if (result.status === 'INVALID_INPUT') {
      return res.status(400).json(result);
    }

    if (result.status === 'LIVE_DATA_UNAVAILABLE') {
      return res.status(503).json(result);
    }

    return res.json({
      ...result,
      resolvedChain: adapter.chain,
    });
  } catch (error) {
    return res.status(500).json({
      status: 'LIVE_DATA_UNAVAILABLE',
      transactions: [],
      nodes: [],
      edges: [],
      message: error.message || `Internal server error while processing trace request for network ${targetChain}.`,
    });
  }
});

export default app;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[CHAIN INTEL API] Multi-Chain Server listening on http://localhost:${PORT}`);
  });
}


