import 'server-only';
import { Indexer, KvClient, MemData, Batcher, getFlowContract } from '@0gfoundation/0g-storage-ts-sdk';
import { ethers } from 'ethers';

const INDEXER_RPC = process.env.INDEXER_RPC || 'https://indexer-storage-turbo-testnet.0g.ai';
const KV_NODE_URL = process.env.KV_NODE_URL || '';
const FLOW_CONTRACT_ADDRESS = process.env.FLOW_CONTRACT_ADDRESS || '0xbD2C3F0E65eDF5582141C35969d66e34629cC768';
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://evmrpc-testnet.0g.ai';
// Fixed stream ID namespace for all Gochi state — keccak256("gochi_v1")
const STREAM_ID = process.env.GOCHI_STREAM_ID || '0x676f636869000000000000000000000000000000000000000000000000000001';

export function is0GConfigured(): boolean {
  return !!(process.env.PRIVATE_KEY && KV_NODE_URL && process.env.INDEXER_RPC);
}

function getSigner(): ethers.Wallet {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error('PRIVATE_KEY not set — 0G Storage writes require a server-side wallet');
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  return new ethers.Wallet(pk, provider);
}

export async function kvWrite(
  key: string,
  value: unknown
): Promise<{ txHash: string; rootHash: string }> {
  const signer = getSigner();
  const indexer = new Indexer(INDEXER_RPC);
  const [nodes, nodesErr] = await indexer.selectNodes(1);
  if (nodesErr) throw nodesErr;

  const flow = getFlowContract(FLOW_CONTRACT_ADDRESS, signer);
  const batcher = new Batcher(1, nodes, flow, RPC_URL);

  batcher.streamDataBuilder.set(
    STREAM_ID,
    Uint8Array.from(Buffer.from(key, 'utf-8')),
    Uint8Array.from(Buffer.from(JSON.stringify(value), 'utf-8'))
  );

  const [result, err] = await batcher.exec();
  if (err) throw err;
  return result;
}

export async function kvRead(key: string): Promise<unknown | null> {
  if (!KV_NODE_URL) throw new Error('KV_NODE_URL not set');
  const client = new KvClient(KV_NODE_URL);
  const result = await client.getValue(STREAM_ID, Buffer.from(key, 'utf-8'));
  if (!result) return null;
  return JSON.parse(Buffer.from(result.data).toString('utf-8'));
}

export async function logUpload(
  data: unknown
): Promise<{ txHash: string; rootHash: string }> {
  const signer = getSigner();
  const indexer = new Indexer(INDEXER_RPC);

  const encoded = new TextEncoder().encode(JSON.stringify(data));
  const memData = new MemData(encoded);

  const [result, err] = await indexer.upload(memData, RPC_URL, signer);
  if (err) throw err;

  if ('txHash' in result) {
    return { txHash: result.txHash, rootHash: result.rootHash };
  }
  return { txHash: result.txHashes[0], rootHash: result.rootHashes[0] };
}
