import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { BookOpen, Lightbulb, Search as SearchIcon } from 'lucide-react';
import { content } from '../content.js';
import Breadcrumb from '../components/Breadcrumb.jsx';
import Reveal from '../components/Reveal.jsx';
import { SearchResultSkeleton } from '../components/Skeleton.jsx';
import { normalizeLevel, normalizeTier, LEVEL_LABEL, TIER_LABEL } from '../lib/study.js';

function highlightSnippet(text, keywords) {
  if (!text || !keywords.length) return text;
  const escaped = keywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) => {
    const lower = part.toLowerCase();
    const isMatch = keywords.some((k) => lower === k);
    return isMatch ? (
      <mark key={i} className="bg-yellow-200 text-inherit rounded-sm px-0.5">
        {part}
      </mark>
    ) : (
      part
    );
  });
}

export default function Search() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState('all');
  const [level, setLevel] = useState('all');

  const keywords = useMemo(() => {
    if (!q) return [];
    return q
      .trim()
      .toLowerCase()
      .split(/[\s,，、]+/)
      .filter(Boolean);
  }, [q]);

  useEffect(() => {
    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    content
      .search(q)
      .then(setResults)
      .finally(() => setLoading(false));
  }, [q]);

  // 全站筛选：按重要度(层级) × 难度（仅文章，面试题不参与）
  const filtered = useMemo(() => {
    if (!results) return null;
    return results.filter((item) => {
      if (item._type !== 'article') return true;
      const okTier = tier === 'all' || normalizeTier(item.tier) === normalizeTier(tier);
      const okLevel = level === 'all' || normalizeLevel(item.level) === normalizeLevel(level);
      return okTier && okLevel;
    });
  }, [results, tier, level]);

  const TIER_OPTS = [
    { id: 'all', label: '全部层级' },
    { id: 'basic', label: TIER_LABEL.basic },
    { id: 'core', label: TIER_LABEL.core },
    { id: 'key', label: TIER_LABEL.key },
    { id: 'extra', label: TIER_LABEL.extra },
  ];
  const LEVEL_OPTS = [
    { id: 'all', label: '全部难度' },
    { id: 'easy', label: '简单/入门' },
    { id: 'medium', label: '中等' },
    { id: 'hard', label: '困难/进阶' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Breadcrumb items={[
        { label: '首页', to: '/' },
        { label: '搜索结果' },
      ]} />
      <h1 className="text-2xl font-extrabold text-text-primary mt-4">
        搜索 &quot;<span className="text-brand-600">{q}</span>&quot;
      </h1>

      {loading && <SearchResultSkeleton />}

      {!loading && q !== '' && filtered !== null && (
        <p className="text-text-secondary mt-1">
          共找到 <b className="text-text-primary">{filtered.length}</b> 条结果
        </p>
      )}

      {/* 全站筛选：重要度 × 难度 */}
      {!loading && q !== '' && filtered !== null && filtered.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-text-muted self-center mr-1">层级</span>
            {TIER_OPTS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTier(t.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  tier === t.id ? 'bg-brand-500 text-white' : 'btn-ghost border border-border'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-text-muted self-center mr-1">难度</span>
            {LEVEL_OPTS.map((l) => (
              <button
                key={l.id}
                onClick={() => setLevel(l.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  level === l.id ? 'bg-brand-500 text-white' : 'btn-ghost border border-border'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {!loading && filtered && filtered.length > 0 && (
        <div className="mt-6 space-y-4">
          {filtered.map((item, i) => (
            <Reveal key={item._type + '-' + item.id} delay={i * 50}>
              <Link
                to={
                  item._type === 'article'
                    ? `/article/${item.id}`
                    : `/interview/${item.id}`
                }
                className="group block bg-card rounded-2xl p-5 border border-border shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                      item._type === 'article'
                        ? 'bg-brand-50 text-brand-600'
                        : 'bg-warning-50 text-warning-600'
                    }`}
                  >
                    {item._type === 'article' ? (
                      <BookOpen size={11} />
                    ) : (
                      <Lightbulb size={11} />
                    )}
                    {item._type === 'article' ? '文章' : '面试题'}
                  </span>
                  <span className="text-xs text-text-muted">
                    {item.category}
                  </span>
                </div>
                <h3 className="font-bold text-text-primary group-hover:text-brand-600 transition">
                  {item.title || item.question}
                </h3>
                {item._snippet && (
                  <p className="text-sm text-text-secondary mt-1.5">
                    {highlightSnippet(item._snippet, keywords)}
                  </p>
                )}
                {item.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {item.tags.map((t) => (
                      <Link
                        key={t}
                        to={`/search?q=${encodeURIComponent(t)}`}
                        className="text-[11px] text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full hover:bg-brand-100 transition"
                      >
                        #{t}
                      </Link>
                    ))}
                  </div>
                )}
              </Link>
            </Reveal>
          ))}
        </div>
      )}

      {!loading && q === '' && (
        <div className="text-center py-16">
          <SearchIcon size={48} className="mx-auto mb-3 text-text-muted" />
          <p className="text-text-secondary mb-1">输入关键词，搜索全站文章与面试题</p>
          <p className="text-text-muted text-sm mb-5">例如：HashMap、装饰器、RAG、微服务、JVM 调优</p>
          <div className="flex flex-wrap justify-center gap-2">
            {['HashMap', '装饰器', 'RAG', '微服务', 'MySQL 索引', 'React Hooks'].map((t) => (
              <Link
                key={t}
                to={`/search?q=${encodeURIComponent(t)}`}
                className="text-sm text-brand-600 bg-brand-50 px-3 py-1 rounded-full hover:bg-brand-100 transition"
              >
                {t}
              </Link>
            ))}
          </div>
        </div>
      )}

      {!loading && q !== '' && filtered && filtered.length === 0 && (
        <div className="text-center py-16">
          <SearchIcon size={48} className="mx-auto mb-3 text-text-muted" />
          <p className="text-text-secondary">
            没有找到相关内容，换个关键词试试？
          </p>
        </div>
      )}
    </div>
  );
}
