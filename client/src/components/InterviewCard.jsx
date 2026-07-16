import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DIFF_MAP } from './LevelBadge.jsx';
import { content } from '../content.js';
import Markdown from './Markdown.jsx';

const CAT_NAME = {
  java: 'Java',
  python: 'Python',
  frontend: '前端',
  ai: 'AI',
  system: '系统设计',
};

export default function InterviewCard({ item }) {
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const diff = DIFF_MAP[item.difficulty] || DIFF_MAP.middle;

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    content
      .interview(item.id)
      .then((iv) => setAnswer(iv?.answer || ''))
      .finally(() => setLoading(false));
  }, [open, item.id]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left p-5 flex items-start gap-3"
      >
        <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5 ${diff.cls}`}>
          {diff.label}
        </span>
        <span className="flex-1">
          <span className="font-semibold text-gray-800">{item.question}</span>
          <span className="block mt-1 text-xs text-gray-400">
            {CAT_NAME[item.category] || item.category}
            {item.tags?.map((t) => ` · #${t}`).join('')}
          </span>
        </span>
        <span className="text-gray-400 text-lg">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="px-5 pb-5 -mt-2">
          {loading && <p className="text-gray-400 text-sm">加载答案…</p>}
          {!loading && <Markdown html={answer} />}
          <div className="mt-3 text-right">
            <Link
              to={`/interview/${item.id}`}
              className="text-sm text-brand-600 hover:underline font-medium"
            >
              查看详情页 →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
