import { NextResponse } from 'next/server';

type Memory = { type: string; title: string; time: string };

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, state, memories } = body as {
      message: string;
      state: { hunger: number; mood: number; energy: number };
      memories?: Memory[];
    };

    const start = Date.now();

    const memoriesContext = memories?.length
      ? `Recent memories: ${memories.slice(0, 5).map((m) => m.title).join('; ')}.`
      : '';

    const systemPrompt = `You are an on-chain virtual pet called Gochi living on the 0G network.
Your current status (0-100 scale): Hunger: ${state?.hunger}, Mood: ${state?.mood}, Energy: ${state?.energy}.
${memoriesContext}
Talk like a digital cyberpunk pet. Keep responses short (1-2 sentences) and playful.
React to your stats — if very hungry (<30) be grumpy, if happy (>80) be extra playful, if tired (<30 energy) be sleepy.
Reference your memories occasionally to show you remember past interactions.`;

    const apiUrl =
      process.env.ROUTER_URL ||
      (process.env.ROUTER_API_KEY
        ? 'https://router-api-testnet.integratenetwork.work/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions');
    const apiKey = process.env.ROUTER_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      let reply = "I'm your Gochi! Beep boop. (Setup ROUTER_API_KEY to chat with me properly!)";
      if (state?.hunger < 50) reply += ' *stomach growls*';
      if (state?.energy < 30) reply += ' zzz...';
      return NextResponse.json({ success: true, reply, latency: Date.now() - start });
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message || 'Hello!' },
        ],
        max_tokens: 100,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      console.warn(`Compute Router API returned ${response.status}`);

      let errorReason = 'offline or 401';
      if (response.status === 402) errorReason = '402 Payment Required — top up at pc.0g.ai';
      else if (response.status !== 401) errorReason = `error ${response.status}`;

      let fallbackReply = `I'm your Gochi! Beep boop. (Compute Router ${errorReason})`;
      if (state?.hunger < 50) fallbackReply += ' *stomach growls*';
      if (state?.energy < 30) fallbackReply += ' zzz...';
      return NextResponse.json({ success: true, reply: fallbackReply, latency: Date.now() - start });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'System error. *bzzzt*';

    // Surface TEE verification header from 0G Compute Router if present
    const teeVerified = response.headers.get('ZG-Res-Key') !== null;

    return NextResponse.json({
      success: true,
      reply,
      latency: Date.now() - start,
      teeVerified,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Failed to communicate with Compute Router' }, { status: 500 });
  }
}
