import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock, Lightbulb } from 'lucide-react';
import { content } from '../content.js';
import LevelBadge from '../components/LevelBadge.jsx';
import Markdown from '../components/Markdown.jsx';
import Timeline from '../components/Timeline.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import ReadingProgress from '../components/ReadingProgress.jsx';
import ShareButton from '../components/ShareButton.jsx';
import { ArticleDetailSkeleton } from '../components/Skeleton.jsx';

export default function ArticleDetail() {
  const { '*': id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prevArticle, setPrevArticle] = useState(null);
  const [nextArticle, setNextArticle] = useState(null);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    setLoading(true);
    setPrevArticle(null);
    setNextArticle(null);

    content
      .article(id)
      .then((a) => {
        setArticle(a);
        // 拉取同分类文章列表找前后篇
        if (a) {
          content.articles(a.category).then((list) => {
            const idx = list.findIndex((item) => item.id === a.id);
            if (idx > 0) setPrevArticle(list[idx - 1]);
            if (idx >= 0 && idx < list.length - 1) setNextArticle(list[idx + 1]);
          });
        }
      })
      .catch(() => setArticle(null))
      .finally(() => setLoading(false));
  }, [id]);

  // 从 article.content（HTML 字符串）提取 h2/h3 标题
  const headings = useMemo(() => {
    if (!article?.content) return [];
    const result = [];
    const regex = /<h([23])(?:\s[^>]*)?>([\s\S]*?)<\/h[23]>/gi;
    let match;
    let idx = 0;
    while ((match = regex.exec(article.content)) !== null) {
      const text = match[2].replace(/<[^>]*>/g, '').trim();
      if (!text) continue;
      const id =
        'h-' +
        idx +
        '-' +
        text.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '').slice(0, 20);
      result.push({ level: parseInt(match[1]), text, id });
      idx++;
    }
    return result;
  }, [article?.content]);

  const isTimeline = article?.timeline === true;
  const showToc = headings.length > 0 && !isTimeline;

  // IntersectionObserver：监视所有 h2/h3，当前可见标题在 ToC 中高亮
  const visibleMap = useRef({});
  useEffect(() => {
    if (!showToc) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visibleMap.current[entry.target.id] = entry.isIntersecting;
        });
        // 取第一个可见标题
        const active = headings.find((h) => visibleMap.current[h.id]);
        if (active) setActiveId(active.id);
      },
      { rootMargin: '-10% 0px -80% 0px', threshold: 0 }
    );

    // Markdown.jsx 的 useEffect（子组件）比此 effect 先执行，id 已就位
    const timer = setTimeout(() => {
      headings.forEach((h) => {
        const el = document.getElementById(h.id);
        if (el) observer.observe(el);
      });
    }, 0);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [headings, showToc]);

  if (loading) return <ArticleDetailSkeleton />;

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-text-secondary mb-4">未找到该文章。</p>
        <Link to="/" className="text-brand-600 hover:underline">
          返回首页
        </Link>
      </div>
    );
  }

  return (
    <>
      <ReadingProgress />
      <article className="max-w-3xl mx-auto px-4 py-10">
        <Breadcrumb items={[
          { label: '首页', to: '/' },
          { label: article.category, to: `/category/${article.category}` },
        ]} />
        <div className="flex items-center gap-3 mt-4 mb-2">
          <LevelBadge level={article.level} />
          <span className="inline-flex items-center gap-1 text-sm text-text-muted">
            <Clock size={14} />
            {article.readMinutes} 分钟阅读
          </span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-extrabold text-text-primary leading-tight flex-1">
            {article.title}
          </h1>
          <ShareButton />
        </div>
        <p className="text-text-secondary mt-2">{article.summary}</p>
        <div className="flex flex-wrap gap-1.5 my-4">
          {article.tags?.map((t) => (
            <span
              key={t}
              className="text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full"
            >
              #{t}
            </span>
          ))}
        </div>
        <hr className="border-border my-5" />
        {isTimeline ? (
          <Timeline markdown={article.body} />
        ) : (
          <Markdown html={article.content} />
        )}
        <div className="mt-10 p-4 rounded-2xl bg-brand-50 text-sm text-brand-700">
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <Lightbulb size={14} />
            觉得有用？去{' '}
            <Link to="/interviews" className="underline">
              面试题
            </Link>{' '}
            板块检验一下掌握程度吧。
          </span>
        </div>

        {/* 上/下篇导航 */}
        {(prevArticle || nextArticle) && (
          <nav className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {prevArticle ? (
              <Link
                to={`/article/${prevArticle.id}`}
                className="group bg-card border border-border rounded-2xl p-4 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition text-left"
              >
                <span className="inline-flex items-center gap-1 text-xs text-text-muted mb-1">
                  <ArrowLeft size={12} /> 上一篇
                </span>
                <p className="text-sm font-semibold text-text-primary group-hover:text-brand-600 line-clamp-1">
                  {prevArticle.title}
                </p>
              </Link>
            ) : (
              <div />
            )}
            {nextArticle && (
              <Link
                to={`/article/${nextArticle.id}`}
                className="group bg-card border border-border rounded-2xl p-4 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition text-right"
              >
                <span className="inline-flex items-center justify-end gap-1 text-xs text-text-muted mb-1">
                  下一篇 <ArrowRight size={12} />
                </span>
                <p className="text-sm font-semibold text-text-primary group-hover:text-brand-600 line-clamp-1">
                  {nextArticle.title}
                </p>
              </Link>
            )}
          </nav>
        )}
      </article>

      {/* 悬浮 ToC 侧栏（平板及以上固定右侧显示） */}
      {showToc && (
        <aside className="hidden md:block fixed right-[max(1rem,calc((100vw-72rem)/2))] top-24 w-48">
          <nav className="sticky top-24 max-h-[70vh] overflow-y-auto text-sm">
            <h4 className="font-semibold text-text-primary mb-2">目录</h4>
            {headings.map((h) => (
              <a
                key={h.id}
                href={`#${h.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .getElementById(h.id)
                    ?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`block py-1 border-l-2 pl-3 transition truncate ${
                  activeId === h.id
                    ? 'border-brand-500 text-brand-600 font-medium'
                    : 'border-transparent text-text-muted hover:text-brand-600'
                } ${h.level === 3 ? 'ml-4' : ''}`}
              >
                {h.text}
              </a>
            ))}
          </nav>
        </aside>
      )}
    </>
  );
}
