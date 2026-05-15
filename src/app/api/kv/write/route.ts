import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { key, value } = await request.json();

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 });
    }

    const start = Date.now();
    const { data, error } = await supabase
      .from('gochi_kv')
      .upsert({ key, value, updated_at: new Date().toISOString() })
      .select();

    if (error) throw error;

    const latency = Date.now() - start;

    return NextResponse.json({ 
      success: true, 
      txHash: `0x${Math.random().toString(16).slice(2)}`, // Simulated 0G storage hash
      latency,
      data
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to write to KV Storage', details: err.message }, { status: 500 });
  }
}
