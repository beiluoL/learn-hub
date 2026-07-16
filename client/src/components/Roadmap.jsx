import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, ChevronRight, Clock } from 'lucide-react';
import LevelBadge from './LevelBadge.jsx';

// 学习路线：按难度分为 入门 / 进阶 / 高级 三个阶段，章节按 order 编号排成时间轴。
// 每个阶段是可折叠的手风琴，点击标题展开/收起。
const STAGES = [
  { id: 'beginner', label: '入门阶段', hint: '打基础' },
  { id: 'intermediate', label: '进阶阶段', hint: '练实战' },
  { id: 'advanced', label: '高级阶段', hint: '钻深入' },
];

export default function Roadmap({ articles, color = '#7c3aed' }) {
  const groups = STAGES.map((s) => ({
    ...s,
    items: [...articles]
      .filter((a) => a.level === s.id)
      .sort((a, b) => (a.order || 0) - (b.order || 0)),
  })).filter((g) => g.items.length > 0);

  // 跨阶段连续编号，形成一条完整的学习路径
  let idx = 0;
  const ordered = groups.flatMap((g) => g.items.map((item) => ({ group: g, item, n: ++idx })));

  // 默认全部展开
  const [openMap, setOpenMap] = useState(() =>
    Object.fromEntries(STAGES.map((s) => [s.id, true]))
  );
  const toggle = (id) => setOpenMap((m) => ({ ...m, [id]: !m[id] }));
  const allOpen = groups.every((g) => openMap[g.id]);
  const setAll = (v) => setOpenMap(Object.fromEntries(STAGES.map((s) => [s.id, v])));

  if (ordered.length === 0) return null;

  return (
    <section className="bg-card rounded-2xl border border-border shadow-card p-6 mb-8">
      <div className="flex items-center gap-2 mb-1">
        <Compass size={20} style={{ color }} />
        <h2 className="text-lg font-extrabold text-text-primary">学习路线</h2>
        <span className="text-xs text-text-muted ml-1">
          按推荐顺序循序渐进 · 共 {ordered.length} 章
        </span>
        <button
          onClick={() => setAll(!allOpen)}
          className="ml-auto text-xs text-brand-600 hover:underline font-medium"
        >
          {allOpen ? '全部收起' : '全部展开'}
        </button>
      </div>
      <p className="text-sm text-text-secondary mb-4">
        沿着时间轴依次学习，点击阶段标题可折叠，每个章节都可点击直达正文。
      </p>

      {groups.map((g) => {
        const open = openMap[g.id];
        return (
          <div key={g.id} className="mb-2">
            <button
              onClick={() => toggle(g.id)}
              className="w-full flex items-center gap-2 py-2.5 px-1 text-left rounded-lg hover:bg-brand-50 transition"
            >
              <ChevronRight
                size={16}
                className="shrink-0 transition-transform"
                style={{ color, transform: open ? 'rotate(90deg)' : 'none' }}
              />
              <span className="text-sm font-bold" style={{ color }}>
                {g.label}
              </span>
              <span className="text-xs text-text-muted">· {g.items.length} 章</span>
              <span className="text-xs text-text-muted">{g.hint}</span>
              <span className="flex-1 h-px bg-border" />
            </button>

            {open && (
              <ol
                className="relative border-l-2 border-brand-200 border-dashed ml-4 mt-2"
                style={{ borderColor: `${color}55` }}
              >
                {ordered
                  .filter((o) => o.group.id === g.id)
                  .map(({ item, n }) => (
                    <li key={item.id} className="ml-6 mb-3 relative">
                      <span
                        className="absolute -left-[2.4rem] top-1 w-7 h-7 rounded-full grid place-items-center text-xs font-bold text-white shadow"
                        style={{ background: color }}
                      >
                        {n}
                      </span>
                      <Link
                        to={`/article/${item.id}`}
                        className="block bg-surface hover:bg-brand-50 border border-border hover:border-brand-300 rounded-xl px-4 py-3 transition group"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <LevelBadge level={item.level} />
                          <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                            <Clock size={12} />
                            {item.readMinutes} 分钟
                          </span>
                        </div>
                        <h4 className="font-semibold text-text-primary group-hover:text-brand-600">
                          {item.title}
                        </h4>
                        <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">{item.summary}</p>
                      </Link>
                    </li>
                  ))}
              </ol>
            )}
          </div>
        );
      })}
    </section>
  );
}
