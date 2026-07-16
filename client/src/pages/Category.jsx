import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Code, Terminal, Globe, Brain, Server, BookOpen } from 'lucide-react';
import { content } from '../content.js';
import ArticleCard from '../components/ArticleCard.jsx';
import Roadmap from '../components/Roadmap.jsx';

const LEVELS = [
  { id: 'all', label: '全部' },
  { id: 'beginner', label: '入门' },
  { id: 'intermediate', label: '进阶' },
  { id: 'advanced', label: '高级' },
];

const CAT_ICONS = {
  java: Code,
  python: Terminal,
  frontend: Globe,
  ai: Brain,
  system: Server,
};

export default function Category() {
  const { catId } = useParams();
  const [category, setCategory] = useState(null);
  const [articles, setArticles] = useState([]);
  const [level, setLevel] = useState('all');

  useEffect(() => {
    content.categories().then((cs) => setCategory(cs.find((c) => c.id === catId) || null));
    content.articles(catId).then(setArticles);
    setLevel('all');
  }, [catId]);

  const filtered = level === 'all' ? articles : articles.filter((a) => a.level === level);

  if (category === undefined) {
    return <div className="max-w-6xl mx-auto px-4 py-20 text-center text-text-secondary">加载中…</div>;
  }
  const cat = category || {
    id: catId,
    name: catId,
    icon: '📁',
    color: '#6d28d9',
    desc: '',
  };

  const CatIcon = CAT_ICONS[catId] || BookOpen;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-brand-600">
        <ArrowLeft size={14} />
        返回首页
      </Link>
      <div className="flex items-center gap-4 mt-4 mb-6">
        <div
          className="w-14 h-14 rounded-2xl grid place-items-center"
          style={{ background: `${cat.color}1a` }}
        >
          <CatIcon size={28} style={{ color: cat.color }} />
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
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              level === l.id
                ? 'bg-brand-600 text-white'
                : 'bg-card text-text-secondary border border-border hover:border-brand-300'
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
