import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
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
      <Link to="/" className="text-sm text-brand-600 hover:underline">
        ← 返回首页
      </Link>
      <h1 className="text-2xl font-extrabold text-gray-800 mt-4">
        搜索 “<span className="text-brand-600">{q}</span>”
      </h1>

      {loading && <p className="text-gray-500 mt-6">搜索中…</p>}
      {!loading && result && (
        <p className="text-gray-500 mt-1">
          共找到 <b className="text-gray-700">{result.total}</b> 条结果
        </p>
      )}

      {!loading && result && result.articles.length > 0 && (
        <section className="mt-6">
          <h2 className="font-bold text-gray-700 mb-3">📚 文章 ({result.articles.length})</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {result.articles.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}

      {!loading && result && result.interviews.length > 0 && (
        <section className="mt-8">
          <h2 className="font-bold text-gray-700 mb-3">💡 面试题 ({result.interviews.length})</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {result.interviews.map((iv) => (
              <InterviewCard key={iv.id} item={iv} />
            ))}
          </div>
        </section>
      )}

      {!loading && result && result.total === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🔍</div>
          <p className="text-gray-500">没有找到相关内容，换个关键词试试？</p>
        </div>
      )}
    </div>
  );
}
