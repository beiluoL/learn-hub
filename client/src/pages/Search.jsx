import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Lightbulb, Search as SearchIcon } from 'lucide-react';
import { content } from '../content.js';
import ArticleCard from '../components/ArticleCard.jsx';
import InterviewCard from '../components/InterviewCard.jsx';

export default function Search() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!q) {
      setResult({ articles: [], interviews: [], total: 0 });
      setLoading(false);
      return;
    }
    setLoading(true);
    content
      .search(q)
      .then(setResult)
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-brand-600">
        <ArrowLeft size={14} />
        返回首页
      </Link>
      <h1 className="text-2xl font-extrabold text-text-primary mt-4">
        搜索 "<span className="text-brand-600">{q}</span>"
      </h1>

      {loading && <p className="text-text-secondary mt-6">搜索中…</p>}
      {!loading && result && (
        <p className="text-text-secondary mt-1">
          共找到 <b className="text-text-primary">{result.total}</b> 条结果
        </p>
      )}

      {!loading && result && result.articles.length > 0 && (
        <section className="mt-6">
          <h2 className="flex items-center gap-2 font-bold text-text-primary mb-3">
            <BookOpen size={16} className="text-brand-500" />
            文章 ({result.articles.length})
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {result.articles.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}

      {!loading && result && result.interviews.length > 0 && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 font-bold text-text-primary mb-3">
            <Lightbulb size={16} className="text-warning-500" />
            面试题 ({result.interviews.length})
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {result.interviews.map((iv) => (
              <InterviewCard key={iv.id} item={iv} />
            ))}
          </div>
        </section>
      )}

      {!loading && result && result.total === 0 && (
        <div className="text-center py-16">
          <SearchIcon size={48} className="mx-auto mb-3 text-text-muted" />
          <p className="text-text-secondary">没有找到相关内容，换个关键词试试？</p>
        </div>
      )}
    </div>
  );
}
