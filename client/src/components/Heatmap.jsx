import { useMemo } from 'react';
import { lastNDates } from '../lib/study.js';

// GitHub 贡献图风格的学习热力图。data: { 'YYYY-MM-DD': count }
// 展示最近 ~17 周（119 天）的每日学习打卡密度。
function level(count) {
  if (!count) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}
const COLORS = [
  'rgba(34,197,94,0.12)', // 0
  'rgba(34,197,94,0.35)', // 1
  'rgba(34,197,94,0.55)', // 2
  'rgba(34,197,94,0.78)', // 3
  'rgba(34,197,94,1)', // 4
];

export default function Heatmap({ data = {} }) {
  const weeks = useMemo(() => {
    const dates = lastNDates(119);
    const firstDow = new Date(dates[0] + 'T00:00:00').getDay();
    const cells = [...Array(firstDow).fill(null), ...dates];
    const out = [];
    for (let i = 0; i < cells.length; i += 7) out.push(cells.slice(i, i + 7));
    return out;
  }, []);

  const total = Object.values(data).reduce((s, v) => s + v, 0);

  return (
    <div>
      <div className="flex gap-[3px] overflow-x-auto pb-1">
        {weeks.map((w, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {w.map((d, di) =>
              d ? (
                <div
                  key={di}
                  title={`${d}：${data[d] || 0} 次学习`}
                  className="w-3 h-3 rounded-[3px]"
                  style={{ background: COLORS[level(data[d] || 0)] }}
                />
              ) : (
                <div key={di} className="w-3 h-3" />
              )
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-2 text-xs text-text-muted">
        <span>近 17 周 · 共 {total} 次学习打卡</span>
        <div className="flex items-center gap-1">
          <span>少</span>
          {COLORS.map((c, i) => (
            <div key={i} className="w-3 h-3 rounded-[3px]" style={{ background: c }} />
          ))}
          <span>多</span>
        </div>
      </div>
    </div>
  );
}
