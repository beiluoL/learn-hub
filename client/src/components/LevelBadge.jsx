const MAP = {
  beginner: { label: '入门', cls: 'bg-success-100 text-success-600' },
  intermediate: { label: '进阶', cls: 'bg-warning-100 text-warning-600' },
  advanced: { label: '高级', cls: 'bg-danger-100 text-danger-600' },
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
  easy: { label: '简单', cls: 'bg-success-100 text-success-600' },
  middle: { label: '中等', cls: 'bg-warning-100 text-warning-600' },
  hard: { label: '困难', cls: 'bg-danger-100 text-danger-600' },
};
