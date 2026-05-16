import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  const { tokenId } = await params;
  const id = parseInt(tokenId, 10);

  let hunger = 80, mood = 90, energy = 70;
  try {
    const { data } = await supabase
      .from('gochi_kv')
      .select('value')
      .eq('key', `gochi:${tokenId}`)
      .single();
    if (data?.value) {
      const v = data.value as { hunger?: number; mood?: number; energy?: number };
      hunger = v.hunger ?? hunger;
      mood = v.mood ?? mood;
      energy = v.energy ?? energy;
    }
  } catch { /* use defaults */ }

  const statBar = (val: number, color: string) => {
    const filled = Math.round((val / 100) * 10);
    return Array.from({ length: 10 }, (_, i) =>
      `<rect x="${170 + i * 12}" y="0" width="10" height="8" rx="2" fill="${i < filled ? color : '#1e293b'}"/>`
    ).join('');
  };

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <defs>
    <radialGradient id="bg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0f1629"/>
      <stop offset="100%" stop-color="#050a14"/>
    </radialGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="softglow">
      <feGaussianBlur stdDeviation="12" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="400" height="400" fill="url(#bg)"/>

  <!-- Grid lines -->
  ${Array.from({ length: 20 }, (_, i) => `<line x1="${i * 20}" y1="0" x2="${i * 20}" y2="400" stroke="#06b6d4" stroke-width="0.3" opacity="0.08"/>`).join('')}
  ${Array.from({ length: 20 }, (_, i) => `<line x1="0" y1="${i * 20}" x2="400" y2="${i * 20}" stroke="#06b6d4" stroke-width="0.3" opacity="0.08"/>`).join('')}

  <!-- Ambient glow -->
  <circle cx="200" cy="180" r="100" fill="#06b6d4" opacity="0.04" filter="url(#softglow)"/>

  <!-- Ghost body -->
  <g transform="translate(200,170)" filter="url(#glow)">
    <path d="M-44 44 L-44 -10 C-44 -34 -24 -54 0 -54 C24 -54 44 -34 44 -10 L44 44 L33 33 L22 44 L11 33 L0 44 L-11 33 L-22 44 L-33 33 Z"
      fill="none" stroke="#06b6d4" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="-14" cy="-8" r="7" fill="#06b6d4" opacity="0.9"/>
    <circle cx="14" cy="-8" r="7" fill="#06b6d4" opacity="0.9"/>
    <circle cx="-14" cy="-8" r="3" fill="#050a14"/>
    <circle cx="14" cy="-8" r="3" fill="#050a14"/>
  </g>

  <!-- Token ID badge -->
  <rect x="24" y="24" width="80" height="24" rx="12" fill="#06b6d4" opacity="0.15" stroke="#06b6d4" stroke-width="1" stroke-opacity="0.4"/>
  <text x="64" y="41" font-family="monospace" font-size="11" fill="#06b6d4" text-anchor="middle" opacity="0.9">GOCHI #${isNaN(id) ? tokenId : id}</text>

  <!-- Network badge -->
  <rect x="296" y="24" width="80" height="24" rx="12" fill="#a855f7" opacity="0.15" stroke="#a855f7" stroke-width="1" stroke-opacity="0.4"/>
  <text x="336" y="41" font-family="monospace" font-size="10" fill="#a855f7" text-anchor="middle" opacity="0.9">0G CHAIN</text>

  <!-- Stats section -->
  <text x="24" y="308" font-family="monospace" font-size="10" fill="#64748b">HUNGER</text>
  <g transform="translate(0,316)">${statBar(hunger, '#f59e0b')}</g>

  <text x="24" y="340" font-family="monospace" font-size="10" fill="#64748b">MOOD</text>
  <g transform="translate(0,348)">${statBar(mood, '#22c55e')}</g>

  <text x="24" y="372" font-family="monospace" font-size="10" fill="#64748b">ENERGY</text>
  <g transform="translate(0,380)">${statBar(energy, '#06b6d4')}</g>

  <!-- Bottom label -->
  <text x="200" y="392" font-family="monospace" font-size="9" fill="#1e3a4c" text-anchor="middle">gochi.edycu.dev</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    },
  });
}
