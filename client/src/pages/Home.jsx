import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Network, QrCode, GraduationCap, ArrowRight } from 'lucide-react';
import { content } from '../content.js';
import ArticleCard from '../components/ArticleCard.jsx';
import InterviewCard from '../components/InterviewCard.jsx';
import Reveal from '../components/Reveal.jsx';
import CatIcon from '../components/CatIcon.jsx';
import LINKS, { WECHAT, SocialLinkList } from '../components/AuthorSocial.jsx';
import { ListSkeleton } from '../components/Skeleton.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getRecent, getDoneCount, getLastRead } from '../lib/progress.js';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [qrError, setQrError] = useState(false);
  const [articles, setArticles] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const { user, isSupabaseConfigured } = useAuth();
  const [myRecent, setMyRecent] = useState([]);
  const [doneCount, setDoneCount] = useState(0);
  const [lastRead, setLastRead] = useState(null);

  useEffect(() => {
    Promise.all([
      content.categories().then(setCategories),
      content.articles().then(setArticles),
      content.interviews().then(setInterviews),
      content.stats().then(setStats),
    ]).finally(() => setLoading(false));
  }, []);

  // 登录用户：拉取「我的学习进度」
  useEffect(() => {
    if (!user) {
      setMyRecent([]);
      setDoneCount(0);
      return;
    }
    let alive = true;
    (async () => {
      const [count, recent, lastId] = await Promise.all([
        getDoneCount(user.id),
        getRecent(user.id, 4),
        Promise.resolve(getLastRead(user.id)),
      ]);
      if (!alive) return;
      setDoneCount(count);
      // 只保留「能在本站内容里找到」的文章，避免进度表里残留的脏 id
      // 生成死链（点进去会显示「未找到该文章」）。
      const resolved = [];
      for (const r of recent) {
        try {
          const a = await content.article(r.article_id);
          if (a) {
            resolved.push({
              id: r.article_id,
              title: a.title,
              to: `/article/${r.article_id}`,
            });
          }
        } catch {
          /* 跳过找不到的文章 */
        }
      }
      if (alive) setMyRecent(resolved);
      // 「继续学习 / 上次读到」
      if (lastId) {
        try {
          const a = await content.article(lastId);
          if (alive && a) setLastRead({ id: lastId, title: a.title });
        } catch {
          /* ignore */
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  const submit = (e) => {
    e.preventDefault();
    const term = q.trim();
    if (term) navigate(`/search?q=${encodeURIComponent(term)}`);
  };

  const featured = articles.slice(0, 6);
  const recentIv = interviews.slice(0, 4);

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-brand-500 to-brand-700 text-white overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          {/* 装饰圆点 */}
          <span className="absolute top-10 right-[15%] w-4 h-4 rounded-full bg-white/10" />
          <span className="absolute top-1/3 right-[5%] w-3 h-3 rounded-full bg-white/10" />
          <span className="absolute bottom-[20%] left-[8%] w-5 h-5 rounded-full bg-white/10" />
          <span className="absolute bottom-10 right-[25%] w-3 h-3 rounded-full bg-white/10" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-20 text-center">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium bg-white/15 px-3 py-1 rounded-full mb-5">
            <BookOpen size={16} />
            一站式编程学习平台
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
            学 Java · Python · 前端 · AI
            <br />
            还有最新面试题
          </h1>
          <p className="mt-4 text-white/85 max-w-2xl mx-auto">
            体系化学习路线、实战示例与高频面试题，帮你从入门到进阶，从容应对技术面试。
          </p>
          <form onSubmit={submit} className="mt-8 max-w-xl mx-auto">
            <label htmlFor="home-search" className="sr-only">搜索</label>
            <div className="flex bg-card rounded-lg p-1.5 shadow-lg border border-transparent transition focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-200">
              <input
                id="home-search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="搜点什么？比如 HashMap、装饰器、RAG…"
                className="search-input flex-1 px-4 py-3 text-gray-700 outline-none bg-transparent rounded-lg"
              />
              <button className="btn-primary px-6 py-3 rounded-lg font-semibold">
                搜索
              </button>
            </div>
          </form>

          <div className="mt-10 flex flex-wrap justify-center gap-8 text-center">
            <Stat n={stats.categories} label="学习方向" />
            <Stat n={stats.articles} label="精品文章" />
            <Stat n={stats.interviews} label="面试题" />
          </div>
        </div>
      </section>

      {/* 分类 */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <SectionTitle title="学习方向" sub="选择你感兴趣的方向开始" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {categories.map((c) => {
            const to = c.id === 'interview' ? '/interviews' : `/category/${c.id}`;
            return (
              <Link
                key={c.id}
                to={to}
                className="group flex flex-col h-full bg-card rounded-2xl p-6 border border-border shadow-card hover:-translate-y-0.5 hover:shadow-card-hover transition"
              >
                <div
                  className="w-12 h-12 rounded-lg grid place-items-center mb-4"
                  style={{ background: `${c.color}1a`, color: c.color }}
                >
                  <CatIcon catId={c.id} size={28} />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-text-primary group-hover:text-brand-600">
                    {c.name}
                  </h3>
                  <span className="text-xs text-text-muted">{c.count} 篇</span>
                </div>
                <p className="text-sm text-text-secondary mt-1.5">{c.desc}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 我的学习进度（仅登录后显示） */}
      {isSupabaseConfigured && user && (
        <section className="max-w-6xl mx-auto px-4 pb-4">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl p-5 shadow-soft">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-xl bg-white/20 grid place-items-center">
                  <GraduationCap size={24} />
                </span>
                <div>
                  <div className="font-bold text-lg">我的学习进度</div>
                  <div className="text-white/85 text-sm">
                    已学 <span className="font-bold">{doneCount}</span> 篇 · 继续加油！
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  to="/plan"
                  className="text-sm font-semibold bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition"
                >
                  学习计划
                </Link>
                <Link
                  to="/dashboard"
                  className="text-sm font-semibold bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition"
                >
                  仪表盘
                </Link>
              </div>
            </div>

            {lastRead && (
              <Link
                to={`/article/${lastRead.id}`}
                className="mt-4 inline-flex items-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 px-4 py-2.5 rounded-lg text-sm font-semibold transition"
              >
                <ArrowRight size={15} /> 继续学习：{lastRead.title}
              </Link>
            )}

            {myRecent.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {myRecent.map((r) => (
                  <Link
                    key={r.id}
                    to={r.to}
                    className="inline-flex items-center gap-1 bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg text-sm transition truncate max-w-xs"
                  >
                    <ArrowRight size={13} className="shrink-0" />
                    <span className="truncate">{r.title}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 知识地图入口 */}
      <section className="max-w-6xl mx-auto px-4 pb-4">
        <Link
          to="/map"
          className="flex items-center gap-4 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-2xl p-5 shadow-soft hover:-translate-y-0.5 transition"
        >
          <Network size={28} />
          <div className="flex-1">
            <div className="font-bold">学习知识点地图</div>
            <div className="text-white/80 text-sm">像 Obsidian 关系图谱一样，把文章与面试题连成知识网</div>
          </div>
          <span className="text-sm font-semibold bg-white/20 px-4 py-2 rounded-lg">进入 →</span>
        </Link>
      </section>

      {/* 精选文章 */}
      <section className="max-w-6xl mx-auto px-4 pb-14">
        <SectionTitle title="精选文章" sub="来自各方向的实战内容" />
        {loading ? (
          <ListSkeleton count={6} />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
            {featured.map((a, i) => (
              <Reveal key={a.id} delay={i * 60}>
                <ArticleCard article={a} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* 近期面试题 */}
      <section className="bg-card border-y border-border">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <div className="flex items-end justify-between">
            <SectionTitle title="近期面试题" sub="点击展开查看答案要点" align="left" />
            <Link to="/interviews" className="text-sm font-semibold text-brand-600 hover:underline mb-2">
              查看全部 →
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-6 items-start">
            {recentIv.map((iv, i) => (
              <Reveal key={iv.id} delay={i * 60}>
                <InterviewCard item={iv} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 关于作者 / 关注我 */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 text-white rounded-2xl shadow-xl overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* 左侧：作者信息 */}
            <div className="flex-1 px-8 py-10">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center text-white text-2xl font-extrabold shadow-lg">
                  北
                </div>
                <div>
                  <h3 className="text-xl font-extrabold">北落</h3>
                  <p className="text-sm text-gray-300">全栈开发工程师 · 10 年经验</p>
                </div>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed mb-6 max-w-md">
                专注于 Java / Vue 全栈开发与 AI 大模型应用落地。热爱技术分享，坚持输出高质量技术文章与面试经验。
                欢迎关注我的博客和公众号，一起成长。
              </p>

              {/* 平台链接 */}
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                技术平台
              </h4>
              <div className="flex flex-wrap gap-2 mb-6">
                {LINKS.map((l) => (
                  <a
                    key={l.url}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 text-gray-200 hover:bg-white/20 hover:text-white transition"
                  >
                    {l.label}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>

            {/* 右侧：公众号 */}
            <div className="lg:w-72 bg-slate-700/40 flex flex-col items-center justify-center px-8 py-10 border-t lg:border-t-0 lg:border-l border-slate-600">
              {qrError ? (
                <div
                  role="img"
                  aria-label="公众号二维码加载失败"
                  className="w-32 h-32 rounded-lg bg-white/90 flex flex-col items-center justify-center gap-1 p-1.5 shadow-lg mb-4"
                >
                  <QrCode size={36} className="text-slate-400" />
                  <span className="text-[11px] text-slate-500 text-center leading-tight px-1">
                    二维码暂不可用
                    <br />
                    请搜索「{WECHAT.name}」
                  </span>
                </div>
              ) : (
                <img
                  src={`${import.meta.env.BASE_URL}qrcode-wechat.jpg`}
                  alt="公众号：北落拾光"
                  loading="lazy"
                  decoding="async"
                  onError={() => setQrError(true)}
                  className="w-32 h-32 rounded-lg bg-white p-1.5 shadow-lg mb-4"
                />
              )}
              <div className="text-center">
                <div className="font-bold text-white text-lg mb-1">{WECHAT.name}</div>
                <div className="text-sm text-gray-300 mb-3">{WECHAT.desc}</div>
                <span className="inline-block text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/30">
                  微信扫码关注
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

function Stat({ n, label }) {
  return (
    <div>
      <div className="text-3xl font-extrabold">{n ?? '—'}</div>
      <div className="text-white/80 text-sm mt-1">{label}</div>
    </div>
  );
}

function SectionTitle({ title, sub, align = 'center' }) {
  return (
    <div className={align === 'center' ? 'text-center' : 'text-left'}>
      <h2 className="text-2xl font-extrabold text-text-primary">{title}</h2>
      {sub && <p className="text-text-secondary mt-1">{sub}</p>}
    </div>
  );
}
