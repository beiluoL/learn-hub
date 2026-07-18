import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileQuestion, FolderOpen, Sparkles } from 'lucide-react';
import { content } from '../content.js';
import ArticleCard from '../components/ArticleCard.jsx';
import Reveal from '../components/Reveal.jsx';
import Roadmap from '../components/Roadmap.jsx';
import CatIcon from '../components/CatIcon.jsx';
import RoadmapList from '../components/RoadmapList.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import { ListSkeleton } from '../components/Skeleton.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getDoneIds } from '../lib/progress.js';
import { moduleProgress, recommendNext, normalizeLevel, normalizeTier } from '../lib/study.js';

const LEVELS = [
  { id: 'all', label: '全部难度' },
  { id: 'easy', label: '简单/入门' },
  { id: 'medium', label: '中等' },
  { id: 'hard', label: '困难/进阶' },
];

const TIERS = [
  { id: 'all', label: '全部层级' },
  { id: 'basic', label: '基础' },
  { id: 'core', label: '核心' },
  { id: 'key', label: '重点' },
  { id: 'extra', label: '拓展' },
];

export default function Category() {
  const { catId, moduleId } = useParams();
  const [category, setCategory] = useState(undefined);
  const [articles, setArticles] = useState([]);
  const [level, setLevel] = useState('all');
  const [tier, setTier] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setLevel('all');
    setTier('all');
    Promise.all([
      content.categories().then((cs) => setCategory(cs.find((c) => c.id === catId) || null)),
      content.articles(catId).then(setArticles),
    ]).finally(() => setLoading(false));
  }, [catId]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="h-4 w-24 rounded bg-surface animate-pulse mb-6" />
        <div className="flex items-center gap-4 mb-6 animate-pulse">
          <div className="w-14 h-14 rounded-lg bg-surface" />
          <div>
            <div className="h-6 w-32 rounded bg-surface mb-1" />
            <div className="h-4 w-48 rounded bg-surface" />
          </div>
        </div>
        <ListSkeleton count={6} />
      </div>
    );
  }

  if (!loading && category === null) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#FEE2E2] text-[#EF4444] mb-4">
          <FileQuestion size={30} />
        </div>
        <h1 className="text-2xl font-extrabold text-text-primary mb-2">未找到该分类</h1>
        <p className="text-text-secondary mb-6">
          分类「<span className="font-semibold text-text-primary">{catId}</span>」不存在，或该分类下暂未发布文章。
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/" className="btn-primary">返回首页</Link>
          <Link to="/interviews" className="btn-ghost border border-border">浏览面试题</Link>
        </div>
      </div>
    );
  }

  const cat = category || { id: catId, name: catId, icon: '📁', color: '#6d28d9', desc: '', modules: [] };

  // 有 modules 的分类：无 moduleId → 模块 Hub；有 moduleId → 模块详情
  if (cat.modules?.length && !moduleId) {
    return <ModuleHub cat={cat} articles={articles} />;
  }
  if (cat.modules?.length && moduleId) {
    const mod = (cat.modules || []).find((m) => m.id === moduleId);
    if (!mod) {
      return (
        <div className="max-w-6xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-extrabold text-text-primary mb-2">未找到该模块</h1>
          <p className="text-text-secondary mb-6">模块「{moduleId}」不存在。</p>
          <Link to={`/category/${cat.id}`} className="btn-primary">返回{cat.name}</Link>
        </div>
      );
    }
    return (
      <ModuleDetail
        cat={cat}
        mod={mod}
        articles={articles}
        level={level}
        setLevel={setLevel}
        tier={tier}
        setTier={setTier}
      />
    );
  }

  // 其余分类（无 modules）：通用列表 + 难度/层级筛选（兼容两套词表）
  const filtered = articles.filter(
    (a) =>
      (level === 'all' || normalizeLevel(a.level) === normalizeLevel(level)) &&
      (tier === 'all' || normalizeTier(a.tier) === normalizeTier(tier))
  );
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <Breadcrumb items={[{ label: '首页', to: '/' }, { label: cat.name }]} />
      <CatHeader name={cat.name} desc={cat.desc} color={cat.color} iconId={cat.id} />
      <Roadmap articles={articles} color={cat.color} />
      <FilterBar level={level} setLevel={setLevel} tier={tier} setTier={setTier} />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((a, i) => (
          <Reveal key={a.id} delay={i * 50}>
            <ArticleCard article={a} />
          </Reveal>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-text-muted py-10 text-center">该筛选下暂无文章。</p>
      )}
    </div>
  );
}

/* 分类/模块通用头部 */
function CatHeader({ name, desc, color, iconId }) {
  return (
    <div className="flex items-center gap-4 mt-4 mb-6">
      <div
        className="w-14 h-14 rounded-lg grid place-items-center"
        style={{ background: `${color}1a` }}
      >
        <CatIcon catId={iconId} size={28} style={{ color }} />
      </div>
      <div>
        <h1 className="text-2xl font-extrabold text-text-primary">{name}</h1>
        <p className="text-text-secondary text-sm">{desc}</p>
      </div>
    </div>
  );
}

function SectionTitle({ title, sub }) {
  return (
    <div className="flex items-end justify-between mt-10 mb-4">
      <div>
        <h2 className="text-xl font-extrabold text-text-primary">{title}</h2>
        {sub && <p className="text-text-secondary text-sm mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/* 二维筛选条：重要度(基础/核心/重点/拓展) × 难度(简单/中等/复杂) */
function FilterBar({ level, setLevel, tier, setTier }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-6">
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-text-muted self-center mr-1">层级</span>
        {TIERS.map((t) => (
          <Chip key={t.id} active={tier === t.id} onClick={() => setTier(t.id)}>
            {t.label}
          </Chip>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-text-muted self-center mr-1">难度</span>
        {LEVELS.map((l) => (
          <Chip key={l.id} active={level === l.id} onClick={() => setLevel(l.id)}>
            {l.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
        active ? 'bg-brand-500 text-white' : 'btn-ghost border border-border'
      }`}
    >
      {children}
    </button>
  );
}

/* 模块 Hub：子模块卡片网格 + 综合（若有） */
function ModuleHub({ cat, articles }) {
  const modules = cat.modules || [];
  const general = articles.filter((a) => !a.module);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <Breadcrumb items={[{ label: '首页', to: '/' }, { label: cat.name }]} />
      <CatHeader name={cat.name} desc={cat.desc} color={cat.color} iconId={cat.id} />

      <SectionTitle
        title="学习模块"
        sub="每个模块都包含「学习路线」与「项目案例」两条主线"
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
        {modules.map((m) => {
          const count = articles.filter((a) => a.module === m.id).length;
          return (
            <Link
              key={m.id}
              to={`/category/${cat.id}/${m.id}`}
              className="group flex flex-col h-full bg-card rounded-2xl p-6 border border-border shadow-card hover:-translate-y-0.5 hover:shadow-card-hover transition"
            >
              <div
                className="w-12 h-12 rounded-lg grid place-items-center mb-4"
                style={{ background: `${m.color}1a`, color: m.color }}
              >
                <CatIcon catId={m.icon || m.id} size={28} />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-text-primary group-hover:text-brand-600">
                  {m.name}
                </h3>
                <span className="text-xs text-text-muted">{count} 篇</span>
              </div>
              <p className="text-sm text-text-secondary mt-1.5">{m.desc}</p>
              <div className="mt-auto flex gap-2 text-[11px] pt-3">
                <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-600">学习路线</span>
                <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-600">项目案例</span>
              </div>
            </Link>
          );
        })}
      </div>

      {general.length > 0 && (
        <>
          <SectionTitle title="综合" sub={`${cat.name}的通用知识`} />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
            {general.map((a, i) => (
              <Reveal key={a.id} delay={i * 50}>
                <ArticleCard article={a} />
              </Reveal>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* 模块详情：学习路线（时间轴） + 项目案例，支持二维筛选 */
function ModuleDetail({ cat, mod, articles, level, setLevel, tier, setTier }) {
  const { user } = useAuth();
  const [doneIds, setDoneIds] = useState(new Set());
  const inMod = articles.filter((a) => a.module === mod.id);
  const roadmapAll = inMod.filter((a) => a.subcat === 'roadmap');
  const casesAll = inMod.filter((a) => a.subcat === 'cases');

  useEffect(() => {
    let alive = true;
    getDoneIds(user?.id).then((ids) => alive && setDoneIds(ids));
    return () => {
      alive = false;
    };
  }, [user]);

  const match = (a) =>
    (level === 'all' || normalizeLevel(a.level) === normalizeLevel(level)) &&
    (tier === 'all' || normalizeTier(a.tier) === normalizeTier(tier));
  const roadmap = roadmapAll.filter(match);
  const cases = casesAll.filter(match);

  const mp = moduleProgress(inMod, doneIds);
  const recs = recommendNext(inMod, doneIds, 3);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <Breadcrumb items={[
        { label: '首页', to: '/' },
        { label: cat.name, to: `/category/${cat.id}` },
        { label: mod.name },
      ]} />
      <CatHeader name={mod.name} desc={mod.desc} color={mod.color} iconId={mod.icon || mod.id} />

      {/* 模块学习进度 */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-card mb-6">
        <ProgressBar pct={mp.pct} done={mp.done} total={mp.total} color={mod.color} />
      </div>

      <SectionTitle title="学习路线" sub="从总览到逐章拆解：点开任意节点开始学习" />
      <FilterBar level={level} setLevel={setLevel} tier={tier} setTier={setTier} />
      {roadmap.length > 0 ? (
        <RoadmapList items={roadmap} />
      ) : (
        <EmptyHint />
      )}

      <SectionTitle title="项目案例" sub="可上手的实战项目与练手骨架" />
      {cases.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
          {cases.map((a, i) => (
            <Reveal key={a.id} delay={i * 50}>
              <ArticleCard article={a} />
            </Reveal>
          ))}
        </div>
      ) : (
        <EmptyHint />
      )}

      {/* 智能下一步推荐 */}
      <SectionTitle title="智能下一步" sub="基于层级 × 难度，推荐你现在最该学的" />
      {recs.length === 0 ? (
        <p className="text-text-muted text-sm py-4">这个模块都学完啦，去试试别的方向 🎉</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {recs.map((a) => (
            <Link
              key={a.id}
              to={`/article/${a.id}`}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 hover:border-brand-300 hover:-translate-y-0.5 transition shadow-card"
            >
              <Sparkles size={16} className="text-brand-500 shrink-0" />
              <span className="text-sm font-medium text-text-primary truncate">{a.title}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyHint() {
  return (
    <div className="flex items-center gap-3 text-text-muted py-8 px-4 rounded-xl border border-dashed border-border">
      <FolderOpen size={20} />
      <span>该分区正在建设中，敬请期待 🚧</span>
    </div>
  );
}
