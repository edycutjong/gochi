'use client';
import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { Plug } from 'lucide-react';
import PetViewport from '@/components/PetViewport';
import StatBars from '@/components/StatBars';
import ActionButtons from '@/components/ActionButtons';
import ChatPanel from '@/components/ChatPanel';
import MemoryLog from '@/components/MemoryLog';
import LatencyMonitor from '@/components/LatencyMonitor';
import MintFlow from '@/components/MintFlow';

type Memory = {
  id: string;
  type: string;
  title: string;
  time: string;
  merkleRoot: string;
  txHash: string;
};

type Stats = { hunger: number; mood: number; energy: number; lastUpdate: number };

const REQUIRED_CHAIN_ID = 16602;

// Stat decay rates per minute (PRD: hunger drops ~1pt/10min, mood/energy slower)
const DECAY_PER_MINUTE = { hunger: 0.1, mood: 0.05, energy: 0.03 };

function applyDecay(stats: Stats): Stats {
  const elapsedMinutes = (Date.now() - stats.lastUpdate) / 60000;
  if (elapsedMinutes < 0.5) return stats;
  return {
    hunger: Math.max(0, stats.hunger - DECAY_PER_MINUTE.hunger * elapsedMinutes),
    mood: Math.max(0, stats.mood - DECAY_PER_MINUTE.mood * elapsedMinutes),
    energy: Math.max(0, stats.energy - DECAY_PER_MINUTE.energy * elapsedMinutes),
    lastUpdate: Date.now(),
  };
}

export default function PlayPage() {
  const { isConnected } = useAccount();
  const chainId = useChainId();

  const [isMinted, setIsMinted] = useState(false);
  const [tokenId, setTokenId] = useState<number | undefined>();
  const [action, setAction] = useState<'idle' | 'feed' | 'play' | 'sleep'>('idle');

  const [stats, setStats] = useState<Stats>(() => ({ hunger: 70, mood: 80, energy: 60, lastUpdate: Date.now() }));
  const [memories, setMemories] = useState<Memory[]>([]);
  const [latencies, setLatencies] = useState<{
    kvRead: number | null;
    kvWrite: number | null;
    log: number | null;
    ai: number | null;
  }>({ kvRead: null, kvWrite: null, log: null, ai: null });

  // Load state + memories from server after mint
  useEffect(() => {
    if (!isMinted || !isConnected) return;

    const stateKey = tokenId ? `gochi_state_${tokenId}` : 'gochi_state';

    fetch(`/api/kv/read?key=${stateKey}`)
      .then((res) => { if (!res.ok) throw new Error(`kv/read ${res.status}`); return res.json(); })
      .then((data) => {
        if (data.value) {
          const loaded = data.value as Stats;
          setStats(applyDecay({ ...loaded, lastUpdate: loaded.lastUpdate || Date.now() }));
        }
        if (data.latency) setLatencies((l) => ({ ...l, kvRead: data.latency }));
      })
      .catch(console.error);

    fetch('/api/log/memories')
      .then((res) => { if (!res.ok) throw new Error(`log/memories ${res.status}`); return res.json(); })
      .then((data) => {
        if (data.memories?.length) setMemories(data.memories);
      })
      .catch(console.error);
  }, [isMinted, isConnected, tokenId]);

  // Passive stat decay tick every 60s
  useEffect(() => {
    if (!isMinted) return;
    const interval = setInterval(() => {
      setStats((s) => applyDecay(s));
    }, 60000);
    return () => clearInterval(interval);
  }, [isMinted]);

  const handleAction = async (newAction: 'feed' | 'play' | 'sleep') => {
    setAction(newAction);

    const newStats: Stats = { ...stats, lastUpdate: Date.now() };
    if (newAction === 'feed') newStats.hunger = Math.min(100, newStats.hunger + 20);
    if (newAction === 'play') {
      newStats.mood = Math.min(100, newStats.mood + 15);
      newStats.energy = Math.max(0, newStats.energy - 10);
    }
    if (newAction === 'sleep') newStats.energy = Math.min(100, newStats.energy + 30);
    setStats(newStats);

    const stateKey = tokenId ? `gochi_state_${tokenId}` : 'gochi_state';

    try {
      const res = await fetch('/api/kv/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: stateKey, value: newStats }),
      });
      const data = await res.json();
      if (data.latency) setLatencies((l) => ({ ...l, kvWrite: data.latency }));

      const actionTitle = `Gochi felt ${newAction === 'feed' ? 'full' : newAction === 'play' ? 'happy' : 'rested'}!`;
      const logRes = await fetch('/api/log/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: newAction,
          title: actionTitle,
          txHash: data.txHash,
          tokenId,
        }),
      });
      const logData = await logRes.json();
      if (logData.latency) setLatencies((l) => ({ ...l, log: logData.latency }));

      if (logData.success) {
        setMemories((prev) => [
          {
            id: Date.now().toString(),
            type: newAction.toUpperCase(),
            title: actionTitle,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            merkleRoot: logData.merkleRoot,
            txHash: data.txHash,
          },
          ...prev,
        ]);
      }
    } catch (e) {
      console.error(e);
    }

    setTimeout(() => setAction('idle'), 2000);
  };

  if (!isConnected) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center font-mono space-y-6 min-h-[50vh]">
        <Plug className="w-14 h-14 animate-pulse text-[var(--gochi-cyan)] opacity-80" />
        <div className="space-y-2">
          <p className="text-[var(--gochi-text)] text-base">Connect your wallet to hatch your Gochi.</p>
          <p className="text-xs text-[var(--gochi-muted)]">Use the <strong className="text-[var(--gochi-cyan)]">Connect Wallet</strong> button in the top-right corner.</p>
        </div>
        <p className="text-[10px] text-[var(--gochi-muted)] opacity-50">Requires 0G Galileo Testnet · Chain ID {REQUIRED_CHAIN_ID}</p>
      </div>
    );
  }

  if (isConnected && chainId !== REQUIRED_CHAIN_ID) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center font-mono space-y-6 min-h-[50vh]">
        <Plug className="w-14 h-14 text-[var(--gochi-amber)] opacity-80" />
        <div className="space-y-2">
          <p className="text-[var(--gochi-amber)] text-base font-semibold">Wrong network</p>
          <p className="text-sm text-[var(--gochi-muted)]">
            Switch to <strong className="text-[var(--gochi-text)]">0G Galileo Testnet</strong> (Chain ID: {REQUIRED_CHAIN_ID}) in your wallet, then reload.
          </p>
        </div>
        <div className="text-[10px] text-[var(--gochi-muted)] space-y-1 opacity-60">
          <p>RPC: https://evmrpc-testnet.0g.ai</p>
          <p>Explorer: https://chainscan-galileo.0g.ai</p>
        </div>
      </div>
    );
  }

  if (!isMinted) {
    return (
      <MintFlow
        onMint={async (id) => {
          setTokenId(id);
          setIsMinted(true);
        }}
      />
    );
  }

  return (
    <div className="relative">
      {/* Ambient background */}
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 cyber-grid opacity-[0.08]" />
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-[var(--gochi-cyan)] opacity-[0.04] blur-[120px] rounded-full" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-[var(--gochi-purple)] opacity-[0.03] blur-[100px] rounded-full" />
      </div>
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto h-full xl:h-[calc(100vh-5rem)] grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-6">
      {/* Left Column: Pet & Actions */}
      <div className="xl:col-span-4 flex flex-col gap-6">
        <PetViewport action={action} stats={stats} tokenId={tokenId} />
        <StatBars stats={stats} />
        <ActionButtons onAction={handleAction} />
      </div>

      {/* Center Column: Chat Panel */}
      <div className="xl:col-span-5 h-[500px] md:h-[600px] xl:h-full">
        <ChatPanel
          state={stats}
          memories={memories}
          onLatency={(ms) => setLatencies((l) => ({ ...l, ai: ms }))}
        />
      </div>

      {/* Right Column: Memory Log & Latency */}
      <div className="xl:col-span-3 flex flex-col gap-6 h-[500px] md:h-[600px] xl:h-full">
        <div className="flex-1 min-h-0">
          <MemoryLog memories={memories} />
        </div>
        <LatencyMonitor latencies={latencies} />
      </div>
    </div>
    </div>
  );
}
