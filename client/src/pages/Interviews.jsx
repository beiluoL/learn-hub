import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { content } from '../content.js';
import InterviewCard from '../components/InterviewCard.jsx';
import Reveal from '../components/Reveal.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import { CardSkeleton } from '../components/Skeleton.jsx';

const FILTERS = [
  { id: 'all', label: '全部' },
  { id: 'java', label: 'Java' },
  { id: 'python', label: 'Python' },
  { id: 'frontend', label: '前端' },
  { id: 'ai', label: 'AI' },
  { id: 'system', label: '系统设计' },
];

export default function Interviews() {
  const [items, setItems] = useState([]);
  const [cat, setCat] = useState('all');
  const [loading, setLoading] = useState(true);
  const [hideMastered, setHideMastered] = useState(false);

  const [mastered, setMastered] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('iv-mastered') || '[]')); }
    catch { return new Set(); }
  });

  const toggleMastered = (id) => {
    setMastered(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem('iv-mastered', JSON.stringify([...next]));
      return next;
    });
  };

  useEffect(() => {
    setLoading(true);
    content.interviews(cat).then(setItems).finally(() => setLoading(false));
  }, [cat]);

  const filtered = hideMastered ? items.filter((iv) => !mastered.has(iv.id)) : items;
  const displayCount = hideMastered ? `${filtered.length} / ${items.length}` : items.length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Breadcrumb items={[
        { label: '首页', to: '/' },
        { label: '面试题' },
      ]} />
      <div className="flex items-center justify-between mt-4 mb-2">
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-text-primary">
          <FileText size={24} className="text-brand-500" />
          近期面试题
        </h1>
        <span className="text-sm text-text-muted">{displayCount} 题</span>
      </div>
      <p className="text-text-secondary text-sm mb-5">
        覆盖 Java / Python / 前端 / AI / 系统设计，点击题目展开答案要点。
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setCat(f.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
              cat === f.id
                ? 'bg-brand-500 text-white'
                : 'btn-ghost border border-border'
            }`}
          >
            {f.label}
          </button>
        ))}
        <button
          onClick={() => setHideMastered((v) => !v)}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
            hideMastered
              ? 'bg-success-500 text-white'
              : 'btn-ghost border border-border'
          }`}
        >
          仅未掌握
        </button>
      </div>

      <div className="space-y-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          : filtered.map((iv, i) => (
              <Reveal key={iv.id} delay={i * 50}>
                <InterviewCard
                  item={iv}
                  isMastered={mastered.has(iv.id)}
                  onToggleMastered={() => toggleMastered(iv.id)}
                />
              </Reveal>
            ))}
      </div>
      {!loading && filtered.length === 0 && (
        <p className="text-text-muted py-10 text-center">
          {hideMastered ? '所有题目已掌握！' : '该方向暂无面试题。'}
        </p>
      )}
    </div>
  );
}
