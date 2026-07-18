import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock, Lightbulb, CheckCircle2, Circle, Play, Award, Link2 } from 'lucide-react';
import { content } from '../content.js';
import LevelBadge from '../components/LevelBadge.jsx';
import Markdown from '../components/Markdown.jsx';
import Timeline from '../components/Timeline.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import ReadingProgress from '../components/ReadingProgress.jsx';
import ShareButton from '../components/ShareButton.jsx';
import Checklist from '../components/Checklist.jsx';
import NotesPanel from '../components/NotesPanel.jsx';
import Flashcards from '../components/Flashcards.jsx';
import CodeRunner from '../components/CodeRunner.jsx';
import Quiz from '../components/Quiz.jsx';
import { ArticleDetailSkeleton } from '../components/Skeleton.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getDone, setDone, setLastRead, logStudy } from '../lib/progress.js';
import { extractFlashcards, extractQuizzes } from '../lib/study.js';

// 从正文抽取可在线运行的代码块（Python / JS / HTML）
function extractRunnables(body = '') {
  const re = /```(\w+)\n([\s\S]*?)```/g;
  const out = [];
  let m;
  while ((m = re.exec(body)) !== null) {
    out.push({ lang: m[1], code: m[2].replace(/\n$/, '') });
  }
  const ok = ['python', 'py', 'javascript', 'js', 'html'];
  return out.filter((b) => ok.includes(b.lang.toLowerCase()));
}

export default function ArticleDetail() {
  const { '*': id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prevArticle, setPrevArticle] = useState(null);
  const [nextArticle, setNextArticle] = useState(null);
  const [allArticles, setAllArticles] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [catName, setCatName] = useState('');
  const [moduleName, setModuleName] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [done, setDoneState] = useState(false);
  const [busyDone, setBusyDone] = useState(false);

  useEffect(() => {
    setLoading(true);
    setPrevArticle(null);
    setNextArticle(null);
    setAllArticles([]);

    content
      .article(id)
      .then((a) => {
        setArticle(a);
        // 拉取全站文章：同分类内找前后篇，全站按共享标签算相关阅读
        if (a) {
          content.articles().then((list) => {
            setAllArticles(list);
            const catList = list.filter((item) => item.category === a.category);
            const idx = catList.findIndex((item) => item.id === a.id);
            if (idx > 0) setPrevArticle(catList[idx - 1]);
            if (idx >= 0 && idx < catList.length - 1) setNextArticle(catList[idx + 1]);
          });
        }
      })
      .catch(() => setArticle(null))
      .finally(() => setLoading(false));
  }, [id]);

  // 解析分类名 + 模块名，用于面包屑（前端模块文章需补「模块」层级）
  useEffect(() => {
    if (!article) return;
    content.categories().then((cs) => {
      const c = cs.find((x) => x.id === article.category);
      if (!c) return;
      setCatName(c.name || article.category);
      if (article.category === 'frontend' && article.module) {
        const mod = (c.modules || []).find((m) => m.id === article.module);
        setModuleName(mod?.name || article.module);
      }
    });
  }, [article]);

  // 已登录时拉取本篇「已学」状态
  useEffect(() => {
    if (!user || !article) {
      setDoneState(false);
      return;
    }
    getDone(user.id, article.id).then(setDoneState);
  }, [user, article]);

  // 记录「上次读到」，用于首页「继续学习 / 上次读到」
  useEffect(() => {
    if (article) setLastRead(user?.id, article.id);
  }, [article, user]);

  // 切换「标记已学」
  const toggleDone = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    const next = !done;
    setDoneState(next);
    setBusyDone(true);
    try {
      await setDone(user.id, article.id, next);
      if (next) {
        logStudy(user?.id, {
          articleId: article.id,
          minutes: Number(article.readMinutes) || 10,
        });
      }
    } finally {
      setBusyDone(false);
    }
  };

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

  // 闪卡（来自清单/概念/小节）+ 可在线运行的代码块
  const flashcards = useMemo(
    () => (article ? extractFlashcards(article) : []),
    [article]
  );
  const runnables = useMemo(
    () => extractRunnables(article?.body || ''),
    [article]
  );

  // 知识自测（来自正文 ```quiz 块）
  const quizzes = useMemo(
    () => extractQuizzes(article?.body || ''),
    [article]
  );

  // 相关阅读：按共享标签数量排序，取前 3（排除自身与上下篇）
  const related = useMemo(() => {
    if (!article) return [];
    const myTags = new Set((article.tags || []).map((t) => t.toLowerCase()));
    const skip = new Set(
      [article.id, prevArticle?.id, nextArticle?.id].filter(Boolean)
    );
    return allArticles
      .filter((a) => a.id && !skip.has(a.id) && a.category === article.category)
      .map((a) => {
        const shared = (a.tags || []).filter((t) => myTags.has(t.toLowerCase())).length;
        return { a, shared };
      })
      .filter((x) => x.shared > 0)
      .sort((x, y) => y.shared - x.shared || (x.a.order || 0) - (y.a.order || 0))
      .slice(0, 3)
      .map((x) => x.a);
  }, [article, allArticles, prevArticle, nextArticle]);

  // 构造面包屑：前端模块文章补「模块」层级，其余显示分类名。
  // 注意：本组件所有 hooks（含下方的 useRef / useEffect）必须无条件执行，
  // 因此「守卫（loading / !article）」放在文件末尾所有 hooks 之后；
  // 这里用 article?. 做 null 保护，article 为 null 时仅生成首页这一级，不会崩溃。
  const crumbs = [{ label: '首页', to: '/' }];
  if (article?.category === 'frontend') {
    crumbs.push({ label: '前端学习', to: '/category/frontend' });
    if (article?.module) {
      crumbs.push({
        label: moduleName || article.module,
        to: `/category/frontend/${article.module}`,
      });
    }
  } else if (catName) {
    crumbs.push({ label: catName, to: `/category/${article.category}` });
  } else if (article?.category) {
    crumbs.push({ label: article.category, to: `/category/${article.category}` });
  }

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
        <Breadcrumb items={crumbs} />
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
          <div className="flex flex-col items-end gap-2 shrink-0">
            <ShareButton />
            <button
              onClick={toggleDone}
              disabled={busyDone}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition cursor-pointer border ${
                done
                  ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                  : 'bg-surface text-text-secondary border-border hover:bg-brand-50 hover:text-brand-600'
              }`}
            >
              {done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
              {done ? '已学' : '标记已学'}
            </button>
          </div>
        </div>
        <p className="text-text-secondary mt-2">{article.summary}</p>
        <div className="flex flex-wrap gap-1.5 my-4">
          {article.tags?.map((t) => (
            <Link
              key={t}
              to={`/search?q=${encodeURIComponent(t)}`}
              className="text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full hover:bg-brand-100 transition"
            >
              #{t}
            </Link>
          ))}
        </div>
        <hr className="border-border my-5" />
        {/* 学习目标清单：把正文 - [ ] 变成可勾选、本地持久化 */}
        <Checklist body={article.body} articleId={article.id} />
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

        {/* 在线运行示例：把正文里的 Python/JS/HTML 代码块变成可运行 playground */}
        {runnables.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-bold text-text-primary mb-1 flex items-center gap-2">
              <Play size={18} className="text-brand-500" /> 在线运行
            </h2>
            <p className="text-sm text-text-secondary mb-3">边学边跑，记忆更牢。</p>
            {runnables.map((r, i) => (
              <CodeRunner key={i} code={r.code} lang={r.lang} />
            ))}
          </section>
        )}

        {/* 笔记 + 闪卡：主动过手，记忆留存率更高 */}
        <div className="mt-8 grid md:grid-cols-2 gap-5 items-start">
          <NotesPanel articleId={article.id} userId={user?.id} />
          <Flashcards cards={flashcards} />
        </div>

        {/* 随堂小测：把正文里的 ```quiz 块变成即时判分的交互题 */}
        {quizzes.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-bold text-text-primary mb-1 flex items-center gap-2">
              <Award size={18} className="text-brand-500" /> 随堂小测
            </h2>
            <p className="text-sm text-text-secondary mb-3">
              合上文章试一试，做错的地方回对应小节再巩固。
            </p>
            <Quiz quizzes={quizzes} />
          </section>
        )}

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

        {/* 相关阅读：同分类下共享标签最多的几篇，方便顺着知识点延伸 */}
        {related.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-bold text-text-primary mb-3 flex items-center gap-2">
              <Link2 size={18} className="text-brand-500" /> 相关阅读
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link
                  key={r.id}
                  to={`/article/${r.id}`}
                  className="group bg-card border border-border rounded-2xl p-4 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition"
                >
                  <p className="text-sm font-semibold text-text-primary group-hover:text-brand-600 line-clamp-2 leading-snug">
                    {r.title}
                  </p>
                  <span className="inline-block mt-2 text-xs text-text-muted">
                    {r.readMinutes} 分钟 · {r.level}
                  </span>
                </Link>
              ))}
            </div>
          </section>
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
