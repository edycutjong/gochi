'use client';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
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
  const [isMinted, setIsMinted] = useState(false);
  const [action, setAction] = useState<'idle' | 'feed' | 'play' | 'sleep'>('idle');
  
  const [stats, setStats] = useState({ hunger: 70, mood: 80, energy: 60 });
  const [memories, setMemories] = useState<Memory[]>([]);
  const [latencies, setLatencies] = useState({ kvRead: null, kvWrite: null, log: null, ai: null });

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

      // Archive memory if milestone
      if (Math.random() > 0.5) { // Simulate random milestone for hackathon demo
        const logRes = await fetch('/api/log/archive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ memory: `Performed action: ${newAction}` })
        });
        const logData = await logRes.json();
        if (logData.latency) setLatencies(l => ({ ...l, log: logData.latency }));
        
        setMemories(prev => [{
          id: Date.now().toString(),
          type: newAction.toUpperCase(),
          title: `Gochi felt ${newAction === 'feed' ? 'full' : newAction === 'play' ? 'happy' : 'rested'}!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          merkleRoot: logData.merkleRoot,
          txHash: data.txHash
        }, ...prev]);
      }
    } catch (e) {
      console.error(e);
    }

    setTimeout(() => setAction('idle'), 2000);
  };

  if (!isConnected) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[var(--gochi-muted)] font-mono space-y-4 min-h-[50vh]">
        <div className="text-4xl animate-pulse mb-4">🔌</div>
        <p>Please connect your wallet to interact with your Gochi.</p>
        <p className="text-xs opacity-50">Make sure you are on the 0G Mainnet (Chain ID: 16661).</p>
      </div>
    );
  }

  if (!isMinted) {
    return <MintFlow onMint={async () => setIsMinted(true)} />;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto h-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-6">
      
      {/* Left Column: Pet & Actions */}
      <div className="xl:col-span-4 flex flex-col gap-6">
        <PetViewport action={action} />
        <StatBars stats={stats} />
        <ActionButtons onAction={handleAction} />
      </div>

      {/* Center Column: Chat Panel */}
      <div className="xl:col-span-5 h-[500px] md:h-[600px] xl:h-auto">
        <ChatPanel state={stats} />
      </div>

      {/* Right Column: Memory Log & Latency */}
      <div className="xl:col-span-3 flex flex-col gap-6 h-[500px] md:h-[600px] xl:h-auto">
        <div className="flex-1 min-h-0">
          <MemoryLog memories={memories} />
        </div>
        <LatencyMonitor latencies={latencies} />
      </div>

    </div>
  );
}
