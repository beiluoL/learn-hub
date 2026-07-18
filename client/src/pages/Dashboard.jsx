import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Flame, BookCheck, CalendarDays, Sparkles } from 'lucide-react';
import { content } from '../content.js';
import { moduleProgress, recommendNext, heatmapFromProgress, normalizeLevel, normalizeTier, LEVEL_LABEL, TIER_LABEL } from '../lib/study.js';
import { getDoneCount, getAllProgress, getDoneIds } from '../lib/progress.js';
import { useAuth } from '../context/AuthContext.jsx';
import Heatmap from '../components/Heatmap.jsx';
import ProgressBar from '../components/ProgressBar.jsx';

function fmt(dt) {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
function computeStreak(dateSet) {
  let s = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 400; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (dateSet.has(fmt(d))) s++;
    else break;
  }
  return s;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [doneCount, setDoneCount] = useState(0);
  const [heat, setHeat] = useState({});
  const [doneIds, setDoneIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  // 推荐区选择
  const [catId, setCatId] = useState('');
  const [moduleId, setModuleId] = useState('');
  const [modArticles, setModArticles] = useState([]);

  useEffect(() => {
    let alive = true;
    Promise.all([
      content.categories(),
      getDoneCount(user?.id),
      getAllProgress(user?.id),
      getDoneIds(user?.id),
    ]).then(([cs, dc, rows, ids]) => {
      if (!alive) return;
      setCategories(cs);
      setDoneCount(dc);
      setHeat(heatmapFromProgress(rows));
      setDoneIds(ids);
      if (cs[0]) {
        setCatId(cs[0].id);
        const firstMod = cs[0].modules?.[0]?.id || '';
        setModuleId(firstMod);
      }
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [user]);

  const currentCat = categories.find((c) => c.id === catId);
  const modules = currentCat?.modules || [];

  useEffect(() => {
    if (!catId) return;
    content.articles(catId).then((list) => {
      const inMod = moduleId ? list.filter((a) => a.module === moduleId) : list;
      setModArticles(inMod);
    });
  }, [catId, moduleId]);

  const mp = useMemo(() => moduleProgress(modArticles, doneIds), [modArticles, doneIds]);
  const recs = useMemo(
    () => recommendNext(modArticles, doneIds, 3),
    [modArticles, doneIds]
  );
  const studyDays = Object.keys(heat).length;
  const streak = useMemo(() => computeStreak(new Set(Object.keys(heat))), [heat]);

  if (loading) {
    return <div className="max-w-5xl mx-auto px-4 py-16 text-text-muted">加载中…</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-1">
        <LayoutDashboard className="text-brand-500" size={26} />
        <h1 className="text-2xl font-extrabold text-text-primary">学习仪表盘</h1>
      </div>
      <p className="text-text-secondary mb-6">看得见投入，才坚持得下去。</p>

      {/* 概览 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon={<BookCheck size={20} />} n={doneCount} label="已学篇数" />
        <StatCard icon={<CalendarDays size={20} />} n={studyDays} label="学习天数" />
        <StatCard icon={<Flame size={20} />} n={streak} label="连续打卡" />
      </div>

      {/* 热力图 */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-card mb-6">
        <h2 className="font-bold text-text-primary mb-3">学习热力图</h2>
        <Heatmap data={heat} />
        {!user && (
          <p className="mt-3 text-xs text-text-muted">
            游客态仅展示本地打卡；登录后跨设备同步更完整。
          </p>
        )}
      </section>

      {/* 智能下一步 */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <h2 className="font-bold text-text-primary flex items-center gap-2 mb-4">
          <Sparkles size={18} className="text-brand-500" /> 智能下一步推荐
        </h2>
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-text-muted mb-1">方向</label>
            <select
              value={catId}
              onChange={(e) => {
                setCatId(e.target.value);
                const c = categories.find((x) => x.id === e.target.value);
                setModuleId(c?.modules?.[0]?.id || '');
              }}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-text-primary"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">模块</label>
            <select
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-text-primary"
              disabled={!modules.length}
            >
              <option value="">整个方向</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <ProgressBar pct={mp.pct} done={mp.done} total={mp.total} />
        </div>

        <h3 className="text-sm font-semibold text-text-secondary mb-2">推荐你接下来学</h3>
        {recs.length === 0 ? (
          <p className="text-text-muted text-sm">这个模块都学完啦，去试试别的方向 🎉</p>
        ) : (
          <ul className="space-y-2">
            {recs.map((a) => (
              <li key={a.id}>
                <Link
                  to={`/article/${a.id}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-2.5 hover:border-brand-300 transition"
                >
                  <span className="font-medium text-text-primary truncate flex-1">{a.title}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 shrink-0">
                    {TIER_LABEL[normalizeTier(a.tier)] || a.tier}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 shrink-0">
                    {LEVEL_LABEL[normalizeLevel(a.level)] || a.level}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ icon, n, label }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card text-center">
      <div className="mx-auto w-10 h-10 rounded-xl bg-brand-50 text-brand-600 grid place-items-center mb-2">
        {icon}
      </div>
      <div className="text-2xl font-extrabold text-text-primary">{n}</div>
      <div className="text-xs text-text-muted mt-0.5">{label}</div>
    </div>
  );
}
