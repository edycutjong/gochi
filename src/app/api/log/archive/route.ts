import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { action, title, txHash } = await request.json();

    if (!action) {
      return NextResponse.json({ error: 'Action content is required' }, { status: 400 });
    }

    const start = Date.now();
    const merkleRoot = `0x${Math.random().toString(16).slice(2).padStart(64, '0')}`;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMemory = {
      id: Date.now().toString(),
      type: action.toUpperCase(),
      title,
      time,
      merkle_root: merkleRoot,
      tx_hash: txHash
    };

    const { data, error } = await supabase
      .from('gochi_memories')
      .insert([newMemory])
      .select();

    if (error) throw error;

    const latency = Date.now() - start;

    return NextResponse.json({ 
      success: true, 
      merkleRoot, // Simulated 0G storage log merkle root
      latency,
      data
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to archive memory to Storage Log', details: err.message }, { status: 500 });
  }
}
