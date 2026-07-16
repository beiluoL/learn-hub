import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock, Lightbulb } from 'lucide-react';
import { content } from '../content.js';
import LevelBadge from '../components/LevelBadge.jsx';
import Markdown from '../components/Markdown.jsx';
import { ArticleDetailSkeleton } from '../components/Skeleton.jsx';

export default function ArticleDetail() {
  const { '*': id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prevArticle, setPrevArticle] = useState(null);
  const [nextArticle, setNextArticle] = useState(null);

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

  if (loading) return <ArticleDetailSkeleton />;

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-text-secondary mb-4">未找到该文章。</p>
        <Link to="/" className="text-brand-600 hover:underline">返回首页</Link>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto px-4 py-10">
      <Link to={`/category/${article.category}`} className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-brand-600">
        <ArrowLeft size={14} />
        {article.category}
      </Link>
      <div className="flex items-center gap-3 mt-4 mb-2">
        <LevelBadge level={article.level} />
        <span className="inline-flex items-center gap-1 text-sm text-text-muted">
          <Clock size={14} />
          {article.readMinutes} 分钟阅读
        </span>
      </div>
      <h1 className="text-3xl font-extrabold text-text-primary leading-tight">{article.title}</h1>
      <p className="text-text-secondary mt-2">{article.summary}</p>
      <div className="flex flex-wrap gap-1.5 my-4">
        {article.tags?.map((t) => (
          <span key={t} className="text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">#{t}</span>
        ))}
      </div>
      <hr className="border-border my-5" />
      <Markdown html={article.content} />
      <div className="mt-10 p-4 rounded-2xl bg-brand-50 text-sm text-brand-700">
        <span className="inline-flex items-center gap-1.5 font-semibold">
          <Lightbulb size={14} />
          觉得有用？去 <Link to="/interviews" className="underline">面试题</Link> 板块检验一下掌握程度吧。
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
  );
}
