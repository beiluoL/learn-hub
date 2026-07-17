// 二维标签体系：
//  - 难度/复杂度（difficulty）：简单 / 中等 / 复杂  → 由 article.level 承载
//  - 重要度/层级（tier）：基础 / 核心 / 重点 / 拓展  → 由 article.tier 承载
// 旧数据可能仍用 beginner/intermediate/advanced，做向下兼容映射。

const DIFF_MAP = {
  easy: { label: '简单', cls: 'bg-success-100 text-success-600' },
  medium: { label: '中等', cls: 'bg-warning-100 text-warning-600' },
  middle: { label: '中等', cls: 'bg-warning-100 text-warning-600' }, // 面试题沿用
  complex: { label: '复杂', cls: 'bg-danger-100 text-danger-600' },
  // 兼容旧值
  beginner: { label: '简单', cls: 'bg-success-100 text-success-600' },
  intermediate: { label: '中等', cls: 'bg-warning-100 text-warning-600' },
  advanced: { label: '复杂', cls: 'bg-danger-100 text-danger-600' },
};
export { DIFF_MAP };

const TIER_MAP = {
  basic: { label: '基础', cls: 'bg-slate-100 text-slate-600' },
  core: { label: '核心', cls: 'bg-brand-100 text-brand-600' },
  key: { label: '重点', cls: 'bg-purple-100 text-purple-600' },
  extend: { label: '拓展', cls: 'bg-amber-100 text-amber-600' },
};

export function TierBadge({ tier }) {
  const m = TIER_MAP[tier] || TIER_MAP.core;
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${m.cls}`}>
      {m.label}
    </span>
  );
}

export function DifficultyBadge({ level }) {
  const m = DIFF_MAP[level] || DIFF_MAP.easy;
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${m.cls}`}>
      {m.label}
    </span>
  );
}

// 兼容旧用法：<LevelBadge level="..." /> 显示难度标签
export default function LevelBadge({ level }) {
  return <DifficultyBadge level={level} />;
}
