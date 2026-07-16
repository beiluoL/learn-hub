import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { content } from '../content.js';
import { DIFF_MAP } from '../components/LevelBadge.jsx';
import Markdown from '../components/Markdown.jsx';

const CAT_NAME = {
  java: 'Java',
  python: 'Python',
  frontend: '前端',
  ai: 'AI',
  system: '系统设计',
};

export default function InterviewDetail() {
  // 面试题 id 含斜杠（interviews/iv-fe-3），用 splat 路由捕获完整路径
  const { '*': id } = useParams();
  const [iv, setIv] = useState(null);
  const [siblings, setSiblings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    content
      .interview(id)
      .then(async (data) => {
        setIv(data);
        if (data) {
          const list = await content.interviews(data.category);
          setSiblings(list);
        }
      })
      .catch(() => setIv(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-gray-500">加载中…</div>;
  }
  if (!iv) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-600 mb-4">未找到该面试题。</p>
        <Link to="/interviews" className="text-brand-600 hover:underline">
          返回面试题列表
        </Link>
      </div>
    );
  }

  const diff = DIFF_MAP[iv.difficulty] || DIFF_MAP.middle;
  const pos = siblings.findIndex((s) => s.id === iv.id);
  const prev = pos > 0 ? siblings[pos - 1] : null;
  const next = pos >= 0 && pos < siblings.length - 1 ? siblings[pos + 1] : null;

  return (
    <article className="max-w-3xl mx-auto px-4 py-10">
      <Link to="/interviews" className="text-sm text-brand-600 hover:underline">
        ← 返回面试题
      </Link>
      <div className="flex items-center gap-3 mt-4 mb-3">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${diff.cls}`}>
          {diff.label}
        </span>
        <span className="text-sm text-gray-400">{CAT_NAME[iv.category] || iv.category}</span>
      </div>
      <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-snug">
        {iv.question}
      </h1>
      <div className="flex flex-wrap gap-1.5 my-4">
        {iv.tags?.map((t) => (
          <span key={t} className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            #{t}
          </span>
        ))}
      </div>
      <hr className="border-gray-100 my-5" />
      <div className="text-xs font-bold text-brand-600 mb-2 tracking-wide">参考答案</div>
      <Markdown html={iv.answer} />

      <div className="grid grid-cols-2 gap-3 mt-10">
        {prev ? (
          <Link
            to={`/interview/${prev.id}`}
            className="p-4 rounded-xl border border-gray-100 hover:border-brand-200 hover:bg-brand-50 transition"
          >
            <div className="text-xs text-gray-400 mb-1">← 上一题</div>
            <div className="text-sm font-semibold text-gray-700 line-clamp-2">{prev.question}</div>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            to={`/interview/${next.id}`}
            className="p-4 rounded-xl border border-gray-100 hover:border-brand-200 hover:bg-brand-50 transition text-right"
          >
            <div className="text-xs text-gray-400 mb-1">下一题 →</div>
            <div className="text-sm font-semibold text-gray-700 line-clamp-2">{next.question}</div>
          </Link>
        ) : (
          <span />
        )}
      </div>
    </article>
  );
}
