// 通用进度条：已学 done/total，pct 百分比
export default function ProgressBar({ pct = 0, done, total, color = '#10b981', height = 'h-2' }) {
  const w = Math.max(0, Math.min(100, pct));
  return (
    <div className="w-full">
      {(done !== undefined && total !== undefined) && (
        <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
          <span>已学 {done} / {total}</span>
          <span className="font-semibold text-text-primary">{w}%</span>
        </div>
      )}
      <div className={`w-full ${height} rounded-full bg-surface overflow-hidden`}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${w}%`, background: color }}
        />
      </div>
    </div>
  );
}
