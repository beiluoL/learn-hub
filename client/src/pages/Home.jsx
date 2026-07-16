import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { content } from '../content.js';
import ArticleCard from '../components/ArticleCard.jsx';
import InterviewCard from '../components/InterviewCard.jsx';
import LINKS, { WECHAT, SocialLinkList } from '../components/AuthorSocial.jsx';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [stats, setStats] = useState({});
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    content.categories().then(setCategories);
    content.articles().then(setArticles);
    content.interviews().then(setInterviews);
    content.stats().then(setStats);
  }, []);

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
      <section className="relative bg-gradient-to-br from-brand-600 via-indigo-600 to-violet-700 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_40%),radial-gradient(circle_at_80%_60%,white,transparent_35%)]" />
        <div className="relative max-w-6xl mx-auto px-4 py-20 text-center">
          <span className="inline-block text-sm font-medium bg-white/15 px-3 py-1 rounded-full mb-5">
            📚 一站式编程学习平台
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
            <div className="flex bg-white rounded-2xl p-1.5 shadow-lg">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="搜点什么？比如 HashMap、装饰器、RAG…"
                className="flex-1 px-4 py-3 text-gray-700 outline-none bg-transparent"
              />
              <button className="bg-brand-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-700">
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
                className="group bg-white rounded-2xl p-6 border border-gray-100 shadow-soft hover:-translate-y-0.5 hover:shadow-lg transition"
              >
                <div
                  className="w-12 h-12 rounded-xl grid place-items-center text-2xl mb-4"
                  style={{ background: `${c.color}1a` }}
                >
                  {c.icon}
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800 group-hover:text-brand-600">
                    {c.name}
                  </h3>
                  <span className="text-xs text-gray-400">{c.count} 篇</span>
                </div>
                <p className="text-sm text-gray-500 mt-1.5">{c.desc}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 知识地图入口 */}
      <section className="max-w-6xl mx-auto px-4 pb-4">
        <Link
          to="/map"
          className="flex items-center gap-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-2xl p-5 shadow-soft hover:-translate-y-0.5 transition"
        >
          <span className="text-3xl">🕸</span>
          <div className="flex-1">
            <div className="font-bold">学习知识点地图</div>
            <div className="text-white/80 text-sm">像 Obsidian 关系图谱一样，把文章与面试题连成知识网</div>
          </div>
          <span className="text-sm font-semibold bg-white/20 px-4 py-2 rounded-xl">进入 →</span>
        </Link>
      </section>

      {/* 精选文章 */}
      <section className="max-w-6xl mx-auto px-4 pb-14">
        <SectionTitle title="精选文章" sub="来自各方向的实战内容" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {featured.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </div>
      </section>

      {/* 近期面试题 */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <div className="flex items-end justify-between">
            <SectionTitle title="近期面试题" sub="点击展开查看答案要点" align="left" />
            <Link to="/interviews" className="text-sm font-semibold text-brand-600 hover:underline mb-2">
              查看全部 →
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-6">
            {recentIv.map((iv) => (
              <InterviewCard key={iv.id} item={iv} />
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
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center text-white text-2xl font-extrabold shadow-lg">
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
              <img
                src={`${import.meta.env.BASE_URL}qrcode-wechat.jpg`}
                alt="公众号：北落拾光"
                className="w-32 h-32 rounded-xl bg-white p-1.5 shadow-lg mb-4"
              />
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
      <h2 className="text-2xl font-extrabold text-gray-800">{title}</h2>
      {sub && <p className="text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}
