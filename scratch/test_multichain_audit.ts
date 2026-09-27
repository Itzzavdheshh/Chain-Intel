import { resolveAddressNetworks } from '../server/services/chainResolver.js';
import { chainAdapters } from '../server/adapters/adapterRegistry.js';

const TEST_ADDRESSES = {
  Ethereum: '0xf851388FC6E6d0854a00d41E494Ba6303d51284D',
  Polygon: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
  BNB: '0x8894e0a0c962cb723c1976a4421c95949be2d4e3',
  Solana: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  Tron: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
  Bitcoin: '34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo',
};

async function runMultiChainAudit() {
  console.log('====================================================');
  console.log(' PHASE 4 — MULTI-CHAIN LIVE DATA AUDIT & VALIDATION');
  console.log('====================================================\n');

  const results = [];

  for (const [chainName, address] of Object.entries(TEST_ADDRESSES)) {
    console.log(`--- Testing ${chainName.toUpperCase()} ---`);
    console.log(`Target Address: ${address}`);

    const adapter = chainAdapters[chainName];
    if (!adapter) {
      console.error(`❌ Adapter for ${chainName} not found!`);
      results.push({ chain: chainName, address, validation: 'FAIL', resolution: 'FAIL', txCount: 0, status: 'FAIL' });
      continue;
    }

    // 1. Validation
    const isValid = adapter.validateAddress(address);
    console.log(`1. Address Syntax Validation: ${isValid ? 'VALID' : 'INVALID'}`);

    // 2. Resolution Probe
    let resolutionStatus = 'UNKNOWN';
    try {
      const resolution = await resolveAddressNetworks(address);
      resolutionStatus = resolution.status;
      console.log(`2. Network Resolution Status: ${resolutionStatus}`);
    } catch (err: any) {
      console.log(`2. Network Resolution Error: ${err.message}`);
    }

    // 3. Recursive Live Trace
    const traceRes = await adapter.recursiveTrace(address, { maxHops: 2 });
    console.log(`3. Trace Status: ${traceRes.status}`);
    const txCount = traceRes.transactions ? traceRes.transactions.length : 0;
    const nodeCount = traceRes.nodes ? traceRes.nodes.length : 0;
    const edgeCount = traceRes.edges ? traceRes.edges.length : 0;
    console.log(`   Transactions: ${txCount}`);
    console.log(`   Nodes: ${nodeCount}`);
    console.log(`   Edges: ${edgeCount}`);

    if (txCount > 0) {
      const sampleTx = traceRes.transactions[0];
      console.log(`   Sample TxHash: ${sampleTx.txHash}`);
      console.log(`   Provider Source: ${sampleTx.source}`);
      console.log(`   Timestamp: ${sampleTx.timestamp}`);
      console.log(`   Value/Asset: ${sampleTx.value} ${sampleTx.asset}`);
    }

    const isPass = txCount > 0;
    console.log(`✓ Result for ${chainName}: ${isPass ? 'PASS' : 'FAIL'}\n`);

    results.push({
      chain: chainName,
      address,
      validation: isValid ? 'PASS' : 'FAIL',
      resolution: resolutionStatus,
      txCount,
      nodeCount,
      edgeCount,
      provider: traceRes.transactions?.[0]?.source || 'Provider Exception',
      status: isPass ? 'PASS' : 'FAIL',
    });
  }

  console.log('====================================================');
  console.log(' FINAL MULTI-CHAIN AUDIT MATRIX SUMMARY');
  console.log('====================================================');
  console.table(results);
}

runMultiChainAudit().catch((err) => {
  console.error('AUDIT RUN EXCEPTION:', err);
  process.exit(1);
});
