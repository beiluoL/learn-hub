import { Link } from 'react-router-dom';
import LevelBadge from './LevelBadge.jsx';

export default function ArticleCard({ article }) {
  return (
    <Link
      to={`/article/${article.id}`}
      className="group block bg-white rounded-2xl p-5 border border-gray-100 shadow-soft hover:-translate-y-0.5 hover:shadow-lg transition"
    >
      <div className="flex items-center gap-2 mb-2">
        <LevelBadge level={article.level} />
        <span className="text-xs text-gray-400">⏱ {article.readMinutes} 分钟</span>
      </div>
      <h3 className="font-bold text-gray-800 group-hover:text-brand-600 transition">
        {article.title}
      </h3>
      <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">{article.summary}</p>
      <div className="flex flex-wrap gap-1.5 mt-3">
        {article.tags?.map((t) => (
          <span key={t} className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            #{t}
          </span>
        ))}
      </div>
    </Link>
  );
}
