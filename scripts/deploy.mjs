import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local manually
const envFile = path.join(__dirname, '../.env.local');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf-8').split('\n')) {
    const [k, ...vs] = line.split('=');
    if (k && !k.startsWith('#') && vs.length) {
      process.env[k.trim()] = vs.join('=').trim();
    }
  }
}

const NETWORKS = {
  'testnet': { url: 'https://evmrpc-testnet.0g.ai', chainId: 16602, name: '0G Galileo Testnet', scan: 'https://chainscan-galileo.0g.ai' },
  'mainnet': { url: 'https://evmrpc.0g.ai', chainId: 16661, name: '0G Mainnet', scan: 'https://chainscan.0g.ai' },
};

const network = process.argv[2] || 'testnet';
const cfg = NETWORKS[network];
if (!cfg) { console.error(`Unknown network: ${network}. Use: testnet | mainnet`); process.exit(1); }

const pk = process.env.PRIVATE_KEY;
if (!pk) { console.error('PRIVATE_KEY not set in .env.local'); process.exit(1); }

const provider = new ethers.JsonRpcProvider(cfg.url);
const wallet = new ethers.Wallet(pk, provider);
console.log(`\nDeploying to ${cfg.name}`);
console.log(`Deployer: ${wallet.address}`);

const balance = await provider.getBalance(wallet.address);
console.log(`Balance: ${ethers.formatEther(balance)} A0GI`);

if (balance === 0n) {
  console.error('\n❌ No balance. Get testnet tokens from the 0G faucet first.');
  process.exit(1);
}

const artifactPath = path.join(__dirname, '../artifacts/contracts/Gochi.sol/Gochi.json');
if (!fs.existsSync(artifactPath)) {
  console.error('Artifact not found — run: npm run contract:compile first');
  process.exit(1);
}
const { abi, bytecode } = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'));

const baseURI = process.env.BASE_URI || 'https://gochi.vercel.app/api/metadata/';
const factory = new ethers.ContractFactory(abi, bytecode, wallet);

console.log('\nDeploying...');
const contract = await factory.deploy(baseURI);
await contract.waitForDeployment();

const address = await contract.getAddress();
console.log(`\n✅ Gochi deployed!`);
console.log(`   Address:  ${address}`);
console.log(`   Network:  ${cfg.name} (Chain ID: ${cfg.chainId})`);
console.log(`   Explorer: ${cfg.scan}/address/${address}`);
console.log(`\n📋 Add to .env.local:`);
console.log(`   NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
