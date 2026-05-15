import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { kvWrite, is0GConfigured } from '@/lib/zero-g';

export async function POST(request: Request) {
  try {
    const { key, value } = await request.json();

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 });
    }

    const start = Date.now();
    let txHash: string;
    let rootHash: string | undefined;
    let source: 'zerog' | 'supabase';

    if (is0GConfigured()) {
      try {
        const result = await kvWrite(`gochi:${key}`, value);
        txHash = result.txHash;
        rootHash = result.rootHash;
        source = 'zerog';
      } catch (zkErr: unknown) {
        console.warn('0G KV write failed, falling back to Supabase:', zkErr instanceof Error ? zkErr.message : zkErr);
        const { error } = await supabase
          .from('gochi_kv')
          .upsert({ key, value, updated_at: new Date().toISOString() });
        if (error) throw error;
        txHash = `0x${Date.now().toString(16).padStart(64, '0')}`;
        source = 'supabase';
      }
    } else {
      const { error } = await supabase
        .from('gochi_kv')
        .upsert({ key, value, updated_at: new Date().toISOString() });
      if (error) throw error;
      txHash = `0x${Date.now().toString(16).padStart(64, '0')}`;
      source = 'supabase';
    }

    return NextResponse.json({
      success: true,
      txHash,
      rootHash,
      source,
      latency: Date.now() - start,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to write to KV Storage', details: message }, { status: 500 });
  }
}
