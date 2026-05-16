import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const NETWORKS: Record<string, { url: string; chainId: number }> = {
  "0g-galileo-testnet": { url: "https://evmrpc-testnet.0g.ai", chainId: 16602 },
  "0g-mainnet": { url: "https://evmrpc.0g.ai", chainId: 16661 },
};

async function main() {
  const network = process.argv[2] || "0g-galileo-testnet";
  const cfg = NETWORKS[network];
  if (!cfg) throw new Error(`Unknown network: ${network}`);

  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("PRIVATE_KEY not set in .env.local");

  const provider = new ethers.JsonRpcProvider(cfg.url);
  const wallet = new ethers.Wallet(pk, provider);
  console.log(`Deploying to ${network} with ${wallet.address}`);

  // Read compiled artifact
  const artifactPath = path.join(__dirname, "../artifacts/contracts/Gochi.sol/Gochi.json");
  if (!fs.existsSync(artifactPath)) {
    throw new Error("Artifact not found — run: npm run contract:compile first");
  }
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));

  const baseURI = process.env.BASE_URI || "https://gochi.edycu.dev/api/metadata/";
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy(baseURI);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`\n✅ Gochi deployed to: ${address}`);
  console.log(`   Network:  ${network} (Chain ID: ${cfg.chainId})`);
  console.log(`   Explorer: https://chainscan-galileo.0g.ai/address/${address}`);
  console.log(`\n   Add to .env.local:\n   NEXT_PUBLIC_CONTRACT_ADDRESS=${address}\n`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
