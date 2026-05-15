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

export default function Home() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const REQUIRED_CHAIN_ID = 16602;
  const [isMinted, setIsMinted] = useState(false);
  const [action, setAction] = useState<'idle' | 'feed' | 'play' | 'sleep'>('idle');
  
  const [stats, setStats] = useState({ hunger: 70, mood: 80, energy: 60 });
  const [memories, setMemories] = useState<Memory[]>([]);
  const [latencies, setLatencies] = useState<{ kvRead: number | null; kvWrite: number | null; log: number | null; ai: number | null }>({ kvRead: null, kvWrite: null, log: null, ai: null });

  // Simulate reading initial state on load
  useEffect(() => {
    if (isMinted && isConnected) {
      fetch('/api/kv/read?key=gochi_state')
        .then(res => res.json())
        .then(data => {
          if (data.value) setStats({ hunger: data.value.hunger, mood: data.value.mood, energy: data.value.energy });
          if (data.latency) setLatencies(l => ({ ...l, kvRead: data.latency }));
        })
        .catch(console.error);
    }
  }, [isMinted, isConnected]);

  const handleAction = async (newAction: 'feed' | 'play' | 'sleep') => {
    setAction(newAction);
    
    // Optimistic UI update
    const newStats = { ...stats };
    if (newAction === 'feed') newStats.hunger = Math.min(100, newStats.hunger + 20);
    if (newAction === 'play') { newStats.mood = Math.min(100, newStats.mood + 15); newStats.energy = Math.max(0, newStats.energy - 10); }
    if (newAction === 'sleep') newStats.energy = Math.min(100, newStats.energy + 30);
    setStats(newStats);

    // Write to KV
    try {
      const res = await fetch('/api/kv/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'gochi_state', value: newStats })
      });
      const data = await res.json();
      if (data.latency) setLatencies(l => ({ ...l, kvWrite: data.latency }));

      const actionTitle = `Gochi felt ${newAction === 'feed' ? 'full' : newAction === 'play' ? 'happy' : 'rested'}!`;
      const logRes = await fetch('/api/log/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: newAction,
          title: actionTitle,
          txHash: data.txHash || '0x0000000000000000000000000000000000000000000000000000000000000000'
        })
      });
      const logData = await logRes.json();
      if (logData.latency) setLatencies(l => ({ ...l, log: logData.latency }));

      if (logData.success) {
        setMemories(prev => [{
          id: Date.now().toString(),
          type: newAction.toUpperCase(),
          title: actionTitle,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          merkleRoot: logData.merkleRoot,
          txHash: data.txHash
        }, ...prev]);
      } else {
        console.error("Failed to archive memory:", logData.error);
      }
    } catch (e) {
      console.error(e);
    }

    setTimeout(() => setAction('idle'), 2000);
  };

  if (!isConnected) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[var(--gochi-muted)] font-mono space-y-4 min-h-[50vh]">
        <Plug className="w-12 h-12 animate-pulse mb-4 text-[var(--gochi-cyan)] opacity-80" />
        <p>Please connect your wallet to interact with your Gochi.</p>
        <p className="text-xs opacity-50">Make sure you are on the 0G Galileo Testnet (Chain ID: 16602).</p>
      </div>
    );
  }

  if (isConnected && chainId !== REQUIRED_CHAIN_ID) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[var(--gochi-muted)] font-mono space-y-4 min-h-[50vh]">
        <Plug className="w-12 h-12 mb-4 text-[var(--gochi-amber)] opacity-80" />
        <p className="text-[var(--gochi-amber)]">Wrong network detected.</p>
        <p className="text-sm">Please switch to the <strong className="text-[var(--gochi-text)]">0G Galileo Testnet</strong> (Chain ID: 16602) in your wallet.</p>
      </div>
    );
  }

  if (!isMinted) {
    return <MintFlow onMint={async () => setIsMinted(true)} />;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto h-full xl:h-[calc(100vh-5rem)] grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-6">
      
      {/* Left Column: Pet & Actions */}
      <div className="xl:col-span-4 flex flex-col gap-6">
        <PetViewport action={action} />
        <StatBars stats={stats} />
        <ActionButtons onAction={handleAction} />
      </div>

      {/* Center Column: Chat Panel */}
      <div className="xl:col-span-5 h-[500px] md:h-[600px] xl:h-full">
        <ChatPanel state={stats} onLatency={(ms) => setLatencies(l => ({ ...l, ai: ms }))} />
      </div>

      {/* Right Column: Memory Log & Latency */}
      <div className="xl:col-span-3 flex flex-col gap-6 h-[500px] md:h-[600px] xl:h-full">
        <div className="flex-1 min-h-0">
          <MemoryLog memories={memories} />
        </div>
        <LatencyMonitor latencies={latencies} />
      </div>

    </div>
  );
}
