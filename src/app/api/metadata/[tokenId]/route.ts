import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://gochi.edycu.dev';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  const { tokenId } = await params;
  const id = parseInt(tokenId, 10);

  if (isNaN(id) || id < 1) {
    return NextResponse.json({ error: 'Invalid token ID' }, { status: 400 });
  }

  let hunger = 80, mood = 90, energy = 70;
  let memoryCount = 0;
  try {
    const [kvResult, memoriesResult] = await Promise.all([
      supabase.from('gochi_kv').select('value').eq('key', tokenId).single(),
      supabase.from('gochi_memories').select('id', { count: 'exact', head: true }).eq('token_id', String(id)),
    ]);
    if (kvResult.data?.value) {
      const v = kvResult.data.value as { hunger?: number; mood?: number; energy?: number };
      hunger = v.hunger ?? hunger;
      mood = v.mood ?? mood;
      energy = v.energy ?? energy;
    }
    memoryCount = memoriesResult.count ?? 0;
  } catch { /* use defaults */ }

  const statusLabel = (val: number) =>
    val >= 80 ? 'Great' : val >= 50 ? 'OK' : val >= 30 ? 'Low' : 'Critical';

  const metadata = {
    name: `Gochi #${id}`,
    description: `An on-chain AI virtual pet living on the 0G Network. It cannot be deleted. It cannot be shut down. Hunger: ${hunger}/100. Mood: ${mood}/100. Energy: ${energy}/100.`,
    image: `${APP_URL}/api/metadata/${id}/image`,
    external_url: `${APP_URL}/play?tokenId=${id}`,
    attributes: [
      { trait_type: 'Hunger', value: hunger, max_value: 100, display_type: 'number' },
      { trait_type: 'Mood', value: mood, max_value: 100, display_type: 'number' },
      { trait_type: 'Energy', value: energy, max_value: 100, display_type: 'number' },
      { trait_type: 'Hunger Status', value: statusLabel(hunger) },
      { trait_type: 'Mood Status', value: statusLabel(mood) },
      { trait_type: 'Energy Status', value: statusLabel(energy) },
      { trait_type: 'Memories Archived', value: memoryCount, display_type: 'number' },
      { trait_type: 'Network', value: '0G Galileo Testnet' },
      { trait_type: 'Storage', value: '0G Storage + Supabase' },
    ],
  };

  return NextResponse.json(metadata, {
    headers: {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
