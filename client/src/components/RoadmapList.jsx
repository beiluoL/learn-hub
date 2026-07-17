import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

// 学习路线时间轴：把一组 roadmap 文章渲染成竖向时间线（非卡片）。
// 第 1 个（总览路线图）用星标节点，其余为「第 N 章」节点，均可点击进入详情。
export default function RoadmapList({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <ol className="relative mt-4">
      <span
        aria-hidden="true"
        className="absolute left-4 top-3 bottom-3 w-0.5 bg-gradient-to-b from-brand-300 via-brand-200 to-brand-100"
      />
      {items.map((a, i) => {
        const isOverview = i === 0;
        return (
          <li key={a.id} className="relative pl-12 pb-6 last:pb-0">
            <span className="absolute left-0 top-0 w-8 h-8 rounded-full grid place-items-center bg-brand-500 text-white text-sm font-bold shadow-soft ring-4 ring-white dark:ring-slate-900">
              {isOverview ? <Sparkles size={16} /> : i}
            </span>
            <Link
              to={`/article/${a.id}`}
              className="group block bg-card border border-border rounded-2xl p-5 shadow-card hover:-translate-y-0.5 hover:shadow-card-hover transition"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-bold text-text-primary group-hover:text-brand-600">
                  {a.title}
                </h3>
                <span className="shrink-0 text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                  {isOverview ? '总览' : `第 ${i} 章`}
                </span>
              </div>
              {a.summary && (
                <p className="text-sm text-text-secondary mt-1.5">{a.summary}</p>
              )}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
