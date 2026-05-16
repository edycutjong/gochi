import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logUpload, is0GConfigured } from '@/lib/zero-g';

export async function POST(request: Request) {
  try {
    const { action, title, txHash: kvTxHash, tokenId } = await request.json();

    if (!action) {
      return NextResponse.json({ error: 'Action content is required' }, { status: 400 });
    }

    const start = Date.now();
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const memoryPayload = {
      gochiId: tokenId ?? 'demo',
      event: action.toUpperCase(),
      title,
      stats: {},
      timestamp: Date.now(),
    };

    let rootHash: string;
    let uploadTxHash: string | undefined;
    let source: 'zerog' | 'supabase';

    if (is0GConfigured()) {
      try {
        const result = await logUpload(memoryPayload);
        rootHash = result.rootHash;
        uploadTxHash = result.txHash;
        source = 'zerog';
      } catch (zkErr: unknown) {
        console.warn('0G Log upload failed, falling back to Supabase:', zkErr instanceof Error ? zkErr.message : zkErr);
        const crypto = await import('crypto');
        rootHash = `0x${crypto.randomBytes(32).toString('hex')}`;
        source = 'supabase';
      }
    } else {
      const crypto = await import('crypto');
      rootHash = `0x${crypto.randomBytes(32).toString('hex')}`;
      source = 'supabase';
    }

    const newMemory = {
      id: Date.now().toString(),
      type: action.toUpperCase(),
      title,
      time,
      merkle_root: rootHash,
      tx_hash: uploadTxHash ?? kvTxHash,
      token_id: tokenId ? String(tokenId) : null,
    };

    const { error } = await supabase.from('gochi_memories').insert([newMemory]);
    if (error) console.warn('Supabase memory insert failed:', error.message);

    return NextResponse.json({
      success: true,
      merkleRoot: rootHash,
      txHash: uploadTxHash,
      source,
      latency: Date.now() - start,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to archive memory to Storage Log', details: message }, { status: 500 });
  }
}
