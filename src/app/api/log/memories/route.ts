import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get('tokenId');

    let query = supabase.from('gochi_memories').select('*');
    if (tokenId) {
      query = query.eq('token_id', tokenId);
    }

    const { data, error } = await query
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
