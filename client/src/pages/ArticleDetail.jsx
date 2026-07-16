import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { content } from '../content.js';
import LevelBadge from '../components/LevelBadge.jsx';
import Markdown from '../components/Markdown.jsx';

export default function ArticleDetail() {
  // 文章 id 含斜杠（如 ai/ai-prompt），用 splat 路由捕获完整路径
  const { '*': id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    content
      .article(id)
      .then(setArticle)
      .catch(() => setArticle(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-20 text-center text-gray-500">加载中…</div>;
  }
  if (!article) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-600 mb-4">未找到该文章。</p>
        <Link to="/" className="text-brand-600 hover:underline">
          返回首页
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto px-4 py-10">
      <Link to={`/category/${article.category}`} className="text-sm text-brand-600 hover:underline">
        ← {article.category}
      </Link>
      <div className="flex items-center gap-3 mt-4 mb-2">
        <LevelBadge level={article.level} />
        <span className="text-sm text-gray-400">⏱ {article.readMinutes} 分钟阅读</span>
      </div>
      <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">{article.title}</h1>
      <p className="text-gray-500 mt-2">{article.summary}</p>
      <div className="flex flex-wrap gap-1.5 my-4">
        {article.tags?.map((t) => (
          <span key={t} className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            #{t}
          </span>
        ))}
      </div>
      <hr className="border-gray-100 my-5" />
      <Markdown html={article.content} />
      <div className="mt-10 p-4 rounded-2xl bg-brand-50 text-sm text-brand-700">
        💡 觉得有用？去 <Link to="/interviews" className="font-semibold underline">面试题</Link> 板块检验一下掌握程度吧。
      </div>
    </article>
  );
}
