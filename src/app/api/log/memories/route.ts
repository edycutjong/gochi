import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('gochi_memories')
      .select('*')
      .order('id', { ascending: false })
      .limit(20);

    if (error) throw error;

    const memories = (data ?? []).map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      time: row.time,
      merkleRoot: row.merkle_root,
      txHash: row.tx_hash,
    }));

    return NextResponse.json({ success: true, memories });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch memories', details: message }, { status: 500 });
  }
}
