'use client';

type Latencies = {
  kvRead: number | null;
  kvWrite: number | null;
  log: number | null;
  ai: number | null;
};

export default function LatencyMonitor({ latencies }: { latencies: Latencies }) {
  const getColor = (val: number | null, thresholdGood: number, thresholdWarn: number) => {
    if (val === null) return 'text-[var(--gochi-muted)]';
    if (val < thresholdGood) return 'text-[var(--gochi-green)]';
    if (val < thresholdWarn) return 'text-[var(--gochi-amber)]';
    return 'text-[var(--gochi-red)]';
  };

  const renderMetric = (label: string, value: number | null, tGood: number, tWarn: number) => (
    <div className="flex justify-between items-center text-xs font-mono">
      <span className="text-[var(--gochi-muted)]">{label}:</span>
      <span className={`${getColor(value, tGood, tWarn)} font-bold`}>
        {value === null ? '--' : `${value}ms`}
      </span>
    </div>
  );

  return (
    <div className="bg-[var(--gochi-panel)] border border-[var(--gochi-border)] rounded-xl p-4 shadow-lg w-full max-w-sm mx-auto md:mx-0 xl:mt-auto">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--gochi-border)]">
        <div className="w-2 h-2 rounded-full bg-[var(--gochi-green)] animate-pulse"></div>
        <h4 className="font-display text-[10px] text-[var(--gochi-text)]">0G Network Latency</h4>
      </div>
      
      <div className="space-y-2">
        {renderMetric('KV Read', latencies.kvRead, 20, 50)}
        {renderMetric('KV Write', latencies.kvWrite, 20, 50)}
        {renderMetric('Log Upload', latencies.log, 300, 800)}
        {renderMetric('Compute AI', latencies.ai, 1000, 2000)}
      </div>
    </div>
  );
}
