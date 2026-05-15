'use client';
import { useState, useRef, useEffect } from 'react';
import { Bot, ShieldCheck } from 'lucide-react';

type Message = { id: string; sender: 'user' | 'gochi'; text: string; teeVerified?: boolean };
type Memory = { type: string; title: string; time: string };

export default function ChatPanel({
  state,
  memories,
  onLatency,
}: {
  state: { hunger: number; mood: number; energy: number };
  memories?: Memory[];
  onLatency?: (ms: number) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'gochi', text: "Beep boop! I'm online." },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { id: Date.now().toString(), sender: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, state, memories }),
      });
      const data = await res.json();

      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), sender: 'gochi', text: data.reply, teeVerified: data.teeVerified },
        ]);
      }
      if (data.latency) onLatency?.(data.latency);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--gochi-panel)] border border-[var(--gochi-border)] rounded-xl overflow-hidden font-mono shadow-lg relative">
      <div className="bg-[var(--gochi-bg)] px-4 py-2 border-b border-[var(--gochi-border)] flex justify-between items-center text-xs text-[var(--gochi-muted)]">
        <span>&gt; TERMINAL_LINK_ESTABLISHED</span>
        <span className="text-[var(--gochi-purple)]">Powered by 0G Compute</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm flex items-start gap-2 ${
                msg.sender === 'user'
                  ? 'bg-[#1e293b] text-white rounded-br-none'
                  : 'bg-[#083344] text-[var(--gochi-cyan)] border border-[var(--gochi-cyan)]/30 rounded-bl-none'
              }`}
            >
              {msg.sender === 'gochi' && <Bot className="w-4 h-4 mt-0.5 opacity-70 shrink-0" />}
              <span className="flex-1">{msg.text}</span>
              {msg.teeVerified && (
                <ShieldCheck
                  className="w-3 h-3 text-[var(--gochi-green)] shrink-0 mt-0.5"
                  title="TEE Verified by 0G Compute"
                />
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-[#083344] text-[var(--gochi-cyan)] border border-[var(--gochi-cyan)]/30 rounded-lg rounded-bl-none px-3 py-2 text-sm flex gap-1 items-center">
              <Bot className="w-4 h-4 mr-2 opacity-70 shrink-0" />
              <span className="animate-bounce">.</span>
              <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>.</span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-3 bg-[var(--gochi-bg)] border-t border-[var(--gochi-border)] flex gap-2">
        <span className="text-[var(--gochi-cyan)] pt-2">&gt;</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Talk to your Gochi..."
          className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--gochi-text)] placeholder:text-[var(--gochi-muted)]"
          disabled={isTyping}
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="px-4 py-2 bg-[var(--gochi-panel)] border border-[var(--gochi-border)] hover:bg-[#1e293b] rounded text-sm disabled:opacity-50 transition-colors"
        >
          SEND
        </button>
      </form>
    </div>
  );
}
