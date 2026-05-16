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
    { id: '1', sender: 'gochi', text: "I'm alive... and I remember everything. What do you want to do today?" },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      console.warn('Chat API error:', error);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), sender: 'gochi', text: '*Network interference detected. Please try again.*' },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gochi-panel border border-gochi-border rounded-xl overflow-hidden font-mono shadow-lg relative">
      <div className="bg-gochi-bg px-4 py-2 border-b border-gochi-border flex justify-between items-center text-xs text-gochi-muted">
        <span>&gt; TERMINAL_LINK_ESTABLISHED</span>
        <span className="text-gochi-purple">Powered by 0G Compute</span>
      </div>

      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm flex items-start gap-2 ${
                msg.sender === 'user'
                  ? 'bg-[#1e293b] text-white rounded-br-none'
                  : 'bg-[#083344] text-gochi-cyan border border-gochi-cyan/30 rounded-bl-none'
              }`}
            >
              {msg.sender === 'gochi' && <Bot className="w-4 h-4 mt-0.5 opacity-70 shrink-0" />}
              <span className="flex-1">{msg.text}</span>
              {msg.teeVerified && (
                <span
                  title="Response cryptographically verified by 0G Compute TEE"
                  className="inline-flex items-center gap-1 text-[9px] font-mono text-gochi-green bg-gochi-green/10 border border-gochi-green/30 px-1.5 py-0.5 rounded shrink-0 self-end"
                >
                  <ShieldCheck className="w-3 h-3" />
                  TEE
                </span>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-[#083344] text-gochi-cyan border border-gochi-cyan/30 rounded-lg rounded-bl-none px-3 py-2 text-sm flex gap-1 items-center">
              <Bot className="w-4 h-4 mr-2 opacity-70 shrink-0" />
              <span className="animate-bounce">.</span>
              <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>.</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 bg-gochi-bg border-t border-gochi-border flex gap-2 items-center">
        <span className="text-gochi-cyan flex items-center gap-0.5 shrink-0">
          &gt;
          {!isTyping && !input && (
            <span className="animate-blink text-gochi-cyan">_</span>
          )}
        </span>
        <input
          id="chat-input"
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isTyping ? '' : 'Talk to your Gochi...'}
          className="flex-1 bg-transparent border-none outline-none text-sm text-gochi-text placeholder:text-gochi-muted caret-gochi-cyan"
          disabled={isTyping}
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="px-4 py-2 bg-gochi-panel border border-gochi-border hover:bg-[#1e293b] rounded text-sm disabled:opacity-50 transition-colors"
        >
          SEND
        </button>
      </form>
    </div>
  );
}
