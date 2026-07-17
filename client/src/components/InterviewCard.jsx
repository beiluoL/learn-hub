import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, CheckCircle, Circle, ChevronDown } from 'lucide-react';
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

// 模块级缓存：避免折叠再展开时重复 fetch
const answerCache = new Map();

export default function InterviewCard({ item, isMastered, onToggleMastered }) {
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const diff = DIFF_MAP[item.difficulty] || DIFF_MAP.middle;

  useEffect(() => {
    if (!open) return;
    // 命中缓存直接使用
    if (answerCache.has(item.id)) {
      setAnswer(answerCache.get(item.id));
      setHasFetched(true);
      return;
    }
    // 已 fetch 过但未展开时也跳过
    if (hasFetched && answer) return;

    setLoading(true);
    setError(false);
    content
      .interview(item.id)
      .then((iv) => {
        const html = iv?.answer || '';
        setAnswer(html);
        answerCache.set(item.id, html);
      })
      .catch(() => setError(true))
      .finally(() => {
        setLoading(false);
        setHasFetched(true);
      });
  }, [open, item.id]);

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden min-h-[132px]">
      <div className="p-5 flex items-start gap-3">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? '收起答案' : '展开答案'}
          className="flex-1 text-left flex items-start gap-3"
        >
          <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5 ${diff.cls}`}>
            {diff.label}
          </span>
          <span className="flex-1">
            <span className="font-semibold text-text-primary">{item.question}</span>
            <span className="block mt-1 text-xs text-text-muted">
              {CAT_NAME[item.category] || item.category}
              {item.tags?.map((t) => ` · #${t}`).join('')}
            </span>
          </span>
          <ChevronDown
            size={18}
            className={`shrink-0 text-text-muted transition-transform duration-200 mt-0.5 ${open ? 'rotate-180' : ''}`}
          />
        </button>
        {onToggleMastered && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleMastered();
            }}
            className="shrink-0 ml-1 mt-0.5"
            aria-pressed={isMastered}
            title={isMastered ? '已掌握' : '标记为已掌握'}
            aria-label={isMastered ? '取消已掌握标记' : '标记为已掌握'}
          >
            {isMastered ? (
              <CheckCircle size={18} className="text-success-500" />
            ) : (
              <Circle size={18} className="text-text-muted" />
            )}
          </button>
        )}
      </div>
      {open && (
        <div className="px-5 pb-5 border-t border-border pt-4">
          {loading && <p className="text-text-muted text-sm animate-pulse">加载答案…</p>}
          {error && (
            <p className="text-danger-500 text-sm">
              加载失败，
              <button
                onClick={() => { setHasFetched(false); answerCache.delete(item.id); }}
                className="underline"
              >
                点击重试
              </button>
            </p>
          )}
          {!loading && !error && answer && <Markdown html={answer} />}
          <div className="mt-3 text-right">
            <Link
              to={`/interview/${item.id}`}
              className="btn-ghost inline-flex items-center gap-1 text-sm font-medium"
            >
              查看详情页
              <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
