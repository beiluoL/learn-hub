import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { content } from '../content.js';
import ArticleCard from '../components/ArticleCard.jsx';
import Roadmap from '../components/Roadmap.jsx';
import CatIcon from '../components/CatIcon.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import { ListSkeleton } from '../components/Skeleton.jsx';

const LEVELS = [
  { id: 'all', label: '全部' },
  { id: 'beginner', label: '入门' },
  { id: 'intermediate', label: '进阶' },
  { id: 'advanced', label: '高级' },
];

export default function Category() {
  const { catId } = useParams();
  const [category, setCategory] = useState(undefined);
  const [articles, setArticles] = useState([]);
  const [level, setLevel] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setLevel('all');
    Promise.all([
      content.categories().then((cs) => setCategory(cs.find((c) => c.id === catId) || null)),
      content.articles(catId).then(setArticles),
    ]).finally(() => setLoading(false));
  }, [catId]);

  const filtered = level === 'all' ? articles : articles.filter((a) => a.level === level);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="h-4 w-24 rounded bg-surface animate-pulse mb-6" />
        <div className="flex items-center gap-4 mb-6 animate-pulse">
          <div className="w-14 h-14 rounded-lg bg-surface" />
          <div>
            <div className="h-6 w-32 rounded bg-surface mb-1" />
            <div className="h-4 w-48 rounded bg-surface" />
          </div>
        </div>
        <ListSkeleton count={6} />
      </div>
    );
  }

  const cat = category || { id: catId, name: catId, icon: '📁', color: '#6d28d9', desc: '' };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <Breadcrumb items={[
        { label: '首页', to: '/' },
        { label: cat.name },
      ]} />
      <div className="flex items-center gap-4 mt-4 mb-6">
        <div
          className="w-14 h-14 rounded-lg grid place-items-center"
          style={{ background: `${cat.color}1a` }}
        >
          <CatIcon catId={cat.id} size={28} style={{ color: cat.color }} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary">{cat.name}</h1>
          <p className="text-text-secondary text-sm">{cat.desc}</p>
        </div>
      </div>

      {/* 学习路线时间轴 */}
      <Roadmap articles={articles} color={cat.color} />

      <div className="flex flex-wrap gap-2 mb-6">
        {LEVELS.map((l) => (
          <button
            key={l.id}
            onClick={() => setLevel(l.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              level === l.id
                ? 'bg-brand-500 text-white'
                : 'btn-ghost border border-border'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((a) => (
          <ArticleCard key={a.id} article={a} />
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-text-muted py-10 text-center">该难度下暂无文章。</p>
      )}
    </div>
  );
}
