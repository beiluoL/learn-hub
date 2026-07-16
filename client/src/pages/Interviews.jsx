import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { content } from '../content.js';
import InterviewCard from '../components/InterviewCard.jsx';

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
  const [openAll, setOpenAll] = useState(false);

  useEffect(() => {
    content.interviews(cat).then(setItems);
  }, [cat]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Link to="/" className="text-sm text-brand-600 hover:underline">
        ← 返回首页
      </Link>
      <div className="flex items-center justify-between mt-4 mb-2">
        <h1 className="text-2xl font-extrabold text-gray-800">📝 近期面试题</h1>
        <span className="text-sm text-gray-400">{items.length} 题</span>
      </div>
      <p className="text-gray-500 text-sm mb-5">
        覆盖 Java / Python / 前端 / AI / 系统设计，点击题目展开答案要点。
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setCat(f.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              cat === f.id
                ? 'bg-brand-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {items.map((iv) => (
          <InterviewCard key={iv.id} item={iv} />
        ))}
      </div>
      {items.length === 0 && (
        <p className="text-gray-400 py-10 text-center">该方向暂无面试题。</p>
      )}
    </div>
  );
}
