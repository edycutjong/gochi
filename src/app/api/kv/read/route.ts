import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  if (!key) {
    return NextResponse.json({ error: 'Key is required' }, { status: 400 });
  }

  try {
    // TODO: Integrate actual @0gfoundation/0g-storage-ts-sdk KV read
    const start = Date.now();
    await new Promise(resolve => setTimeout(resolve, 5 + Math.random() * 5));
    const latency = Date.now() - start;

    // Return dummy state for Gochi
    const dummyState = {
      hunger: 80,
      mood: 90,
      energy: 70,
      lastUpdate: Date.now()
    };

    return NextResponse.json({ 
      success: true, 
      value: dummyState,
      latency 
    });
  } catch {
    return NextResponse.json({ error: 'Failed to read from 0G KV Storage' }, { status: 500 });
  }
}
