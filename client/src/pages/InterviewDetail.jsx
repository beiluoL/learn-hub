import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { content } from '../content.js';
import { DIFF_MAP } from '../components/LevelBadge.jsx';
import Markdown from '../components/Markdown.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import ShareButton from '../components/ShareButton.jsx';
import Flashcards from '../components/Flashcards.jsx';
import { interviewFlashcards } from '../lib/study.js';
import { InterviewDetailSkeleton } from '../components/Skeleton.jsx';

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
    return <InterviewDetailSkeleton />;
  }
  if (!iv) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-text-secondary mb-4">未找到该面试题。</p>
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
      <Breadcrumb items={[
        { label: '首页', to: '/' },
        { label: '面试题', to: '/interviews' },
      ]} />
      <div className="flex items-center gap-3 mt-4 mb-3">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${diff.cls}`}>
          {diff.label}
        </span>
        <span className="text-sm text-text-muted">{CAT_NAME[iv.category] || iv.category}</span>
      </div>
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary leading-snug flex-1">
          {iv.question}
        </h1>
        <ShareButton />
      </div>
      <div className="flex flex-wrap gap-1.5 my-4">
        {iv.tags?.map((t) => (
          <span key={t} className="text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
            #{t}
          </span>
        ))}
      </div>
      <hr className="border-border my-5" />
      <div className="text-xs font-bold text-brand-600 mb-2 tracking-wide">参考答案</div>
      <Markdown html={iv.answer} />

      <section className="mt-8">
        <h2 className="text-lg font-bold text-text-primary mb-3">自测题卡 · 间隔复习</h2>
        <Flashcards cards={interviewFlashcards(iv)} />
      </section>

      <div className="grid grid-cols-2 gap-3 mt-10">
        {prev ? (
          <Link
            to={`/interview/${prev.id}`}
            className="p-4 rounded-2xl bg-card border border-border hover:border-brand-300 shadow-card transition"
          >
            <div className="flex items-center gap-1 text-xs text-text-muted mb-1">
              <ArrowLeft size={12} />
              上一题
            </div>
            <div className="text-sm font-semibold text-text-primary line-clamp-2">{prev.question}</div>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            to={`/interview/${next.id}`}
            className="p-4 rounded-xl bg-card border border-border hover:border-brand-300 shadow-card transition text-right"
          >
            <div className="flex items-center justify-end gap-1 text-xs text-text-muted mb-1">
              下一题
              <ArrowRight size={12} />
            </div>
            <div className="text-sm font-semibold text-text-primary line-clamp-2">{next.question}</div>
          </Link>
        ) : (
          <span />
        )}
      </div>
    </article>
  );
}
