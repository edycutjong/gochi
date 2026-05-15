import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { kvRead, is0GConfigured } from '@/lib/zero-g';

const DEFAULT_STATE = { hunger: 80, mood: 90, energy: 70, lastUpdate: 0 };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  if (!key) {
    return NextResponse.json({ error: 'Key is required' }, { status: 400 });
  }

  try {
    const start = Date.now();
    let value: unknown = null;
    let source: 'zerog' | 'supabase';

    if (is0GConfigured()) {
      try {
        value = await kvRead(`gochi:${key}`);
        source = 'zerog';
      } catch (zkErr: unknown) {
        console.warn('0G KV read failed, falling back to Supabase:', zkErr instanceof Error ? zkErr.message : zkErr);
        const { data, error } = await supabase
          .from('gochi_kv')
          .select('value')
          .eq('key', key)
          .single();
        if (error && error.code !== 'PGRST116') throw error;
        value = data?.value ?? null;
        source = 'supabase';
      }
    } else {
      const { data, error } = await supabase
        .from('gochi_kv')
        .select('value')
        .eq('key', key)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      value = data?.value ?? null;
      source = 'supabase';
    }

    return NextResponse.json({
      success: true,
      value: value ?? DEFAULT_STATE,
      source,
      latency: Date.now() - start,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to read from KV Storage', details: message }, { status: 500 });
  }
}
