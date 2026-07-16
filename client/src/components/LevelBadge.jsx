const MAP = {
  beginner: { label: '入门', cls: 'bg-emerald-100 text-emerald-700' },
  intermediate: { label: '进阶', cls: 'bg-amber-100 text-amber-700' },
  advanced: { label: '高级', cls: 'bg-rose-100 text-rose-700' },
};

export default function LevelBadge({ level }) {
  const m = MAP[level] || MAP.beginner;
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${m.cls}`}>
      {m.label}
    </span>
  );
}

export const DIFF_MAP = {
  easy: { label: '简单', cls: 'bg-emerald-100 text-emerald-700' },
  middle: { label: '中等', cls: 'bg-amber-100 text-amber-700' },
  hard: { label: '困难', cls: 'bg-rose-100 text-rose-700' },
};
