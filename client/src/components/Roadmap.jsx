import { Link } from 'react-router-dom';
import LevelBadge from './LevelBadge.jsx';

// 学习路线：按难度分为 入门 / 进阶 / 高级 三个阶段，章节按 order 编号排成时间轴。
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
  if (ordered.length === 0) return null;

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6 mb-8">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">🧭</span>
        <h2 className="text-lg font-extrabold text-gray-800">学习路线</h2>
        <span className="text-xs text-gray-400 ml-1">
          按推荐顺序循序渐进 · 共 {ordered.length} 章
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        沿着时间轴依次学习，每个章节都可点击直达正文。
      </p>

      {groups.map((g) => (
        <div key={g.id}>
          <div className="flex items-center gap-2 my-3">
            <span className="text-sm font-bold" style={{ color }}>
              {g.label}
            </span>
            <span className="text-xs text-gray-400">· {g.items.length} 章</span>
            <span className="text-xs text-gray-300">{g.hint}</span>
            <span className="flex-1 h-px bg-gray-100" />
          </div>

          <ol
            className="relative border-l-2 border-dashed ml-3"
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
                    className="block bg-gray-50 hover:bg-brand-50 border border-gray-100 hover:border-brand-200 rounded-xl px-4 py-3 transition group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <LevelBadge level={item.level} />
                      <span className="text-xs text-gray-400">⏱ {item.readMinutes} 分钟</span>
                    </div>
                    <h4 className="font-semibold text-gray-800 group-hover:text-brand-600">
                      {item.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.summary}</p>
                  </Link>
                </li>
              ))}
          </ol>
        </div>
      ))}
    </section>
  );
}
