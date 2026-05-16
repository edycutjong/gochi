'use client';

type Latencies = {
  kvRead: number | null;
  kvWrite: number | null;
  log: number | null;
  ai: number | null;
};

export default function LatencyMonitor({ latencies }: { latencies: Latencies }) {
  const getColor = (val: number | null, tGood: number, tWarn: number) => {
    if (val === null) return { text: 'text-gochi-muted', bar: '' };
    if (val < tGood) return { text: 'text-gochi-green', bar: 'bg-gochi-green' };
    if (val < tWarn) return { text: 'text-gochi-amber', bar: 'bg-gochi-amber' };
    return { text: 'text-gochi-red', bar: 'bg-gochi-red' };
  };

  const renderMetric = (
    label: string,
    value: number | null,
    tGood: number,
    tWarn: number,
    tMax: number,
  ) => {
    const { text, bar } = getColor(value, tGood, tWarn);
    const barPct = value === null ? 0 : Math.min(100, (value / tMax) * 100);

    return (
      <div className="space-y-1">
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-gochi-muted">{label}</span>
          <span className={`${text} font-bold tabular-nums`}>
            {value === null ? '—' : `${value}ms`}
          </span>
        </div>
        <div className="h-1.5 bg-gochi-bg rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${bar}`}
            style={{ width: `${barPct}%` }}
          />
        </div>
      </div>
    );
  };

  const hasAnyData = Object.values(latencies).some((v) => v !== null);

  return (
    <div className="bg-gochi-panel border border-gochi-border rounded-xl p-4 shadow-lg w-full">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gochi-border">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${hasAnyData ? 'bg-gochi-green animate-pulse' : 'bg-gochi-muted'}`} />
          <h4 className="font-display text-[10px] text-gochi-text">0G Network Latency</h4>
        </div>
        {hasAnyData && (
          <span className="font-mono text-[9px] text-gochi-green opacity-70">LIVE</span>
        )}
      </div>

      <div className="space-y-3">
        {renderMetric('KV Read',    latencies.kvRead,  20,   50,   200)}
        {renderMetric('KV Write',   latencies.kvWrite, 20,   50,   200)}
        {renderMetric('Log Upload', latencies.log,     300,  800,  3000)}
        {renderMetric('Compute AI', latencies.ai,      1000, 2000, 5000)}
      </div>

      <div className="mt-3 pt-2 border-t border-gochi-border flex justify-between font-mono text-[9px] text-gochi-muted">
        <span className="text-gochi-green">■ fast</span>
        <span className="text-gochi-amber">■ ok</span>
        <span className="text-gochi-red">■ slow</span>
      </div>
    </div>
  );
}
