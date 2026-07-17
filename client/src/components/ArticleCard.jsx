import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { TierBadge, DifficultyBadge } from './LevelBadge.jsx';

export default function ArticleCard({ article }) {
  return (
    <Link
      to={`/article/${article.id}`}
      className="group flex flex-col h-full bg-card rounded-2xl p-5 border border-border shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition"
    >
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <TierBadge tier={article.tier} />
        <DifficultyBadge level={article.level} />
        <span className="inline-flex items-center gap-1 text-xs text-text-muted">
          <Clock size={12} />
          {article.readMinutes} 分钟
        </span>
      </div>
      <h3 className="font-bold text-text-primary group-hover:text-brand-600 transition">
        {article.title}
      </h3>
      <p className="text-sm text-text-secondary mt-1.5 line-clamp-2">{article.summary}</p>
      <div className="flex flex-wrap gap-1.5 mt-auto pt-3">
        {article.tags?.map((t) => (
          <span key={t} className="text-[11px] text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
            #{t}
          </span>
        ))}
      </div>
    </Link>
  );
}
