import { fetchEthereumTransfers } from '../server/adapters/ethereumAdapter.js';
import { fetchPolygonTransfers } from '../server/adapters/polygonAdapter.js';
import { fetchBnbTransfers } from '../server/adapters/bnbAdapter.js';
import { resolveAddressNetworks } from '../server/services/chainResolver.js';

async function testAddress() {
  const addr = '0xf851388FC6E6d0854a00d41E494Ba6303d51284D';
  console.log('--- TESTING ETHEREUM ---');
  const eth = await fetchEthereumTransfers(addr);
  console.log('Eth Status:', eth.status, 'Tx count:', eth.transactions?.length);

  console.log('--- TESTING POLYGON ---');
  const poly = await fetchPolygonTransfers(addr);
  console.log('Poly Status:', poly.status, 'Tx count:', poly.transactions?.length);

  console.log('--- TESTING BNB ---');
  const bnb = await fetchBnbTransfers(addr);
  console.log('Bnb Status:', bnb.status, 'Tx count:', bnb.transactions?.length);

  console.log('--- TESTING RESOLVER ---');
  const res = await resolveAddressNetworks(addr);
  console.log('Resolver Status:', res.status, 'Matches:', res.matches);
}

testAddress();
