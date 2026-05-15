import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  if (!key) {
    return NextResponse.json({ error: 'Key is required' }, { status: 400 });
  }

  try {
    const start = Date.now();
    const { data, error } = await supabase
      .from('gochi_kv')
      .select('value')
      .eq('key', key)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
      throw error;
    }

    const latency = Date.now() - start;

    // Return dummy state if no data found yet
    const dummyState = {
      hunger: 80,
      mood: 90,
      energy: 70,
      lastUpdate: Date.now()
    };

    return NextResponse.json({ 
      success: true, 
      value: data?.value || dummyState,
      latency 
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to read from KV Storage', details: err.message }, { status: 500 });
  }
}
