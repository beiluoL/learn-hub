import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock, Clock, BookOpen, Sparkles } from 'lucide-react';
import { content } from '../content.js';
import { buildPlan } from '../lib/study.js';
import { getDoneIds } from '../lib/progress.js';
import { useAuth } from '../context/AuthContext.jsx';
import ProgressBar from '../components/ProgressBar.jsx';

const PLAN_KEY = 'lh_plan';
const WEEK_OPTS = [
  { v: 3, label: '每周 3 天' },
  { v: 5, label: '每周 5 天' },
  { v: 7, label: '每天' },
];

export default function StudyPlan() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [catId, setCatId] = useState('');
  const [moduleId, setModuleId] = useState(''); // '' = 整个方向
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [minutesPerDay, setMinutesPerDay] = useState(30);
  const [articles, setArticles] = useState([]);
  const [doneIds, setDoneIds] = useState(new Set());
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    content.categories().then((cs) => {
      setCategories(cs);
      const last = JSON.parse(localStorage.getItem(PLAN_KEY) || 'null');
      if (last) {
        setCatId(last.catId || (cs[0] && cs[0].id) || '');
        setModuleId(last.moduleId || '');
        setDaysPerWeek(last.daysPerWeek || 5);
        setMinutesPerDay(last.minutesPerDay || 30);
      } else if (cs[0]) {
        setCatId(cs[0].id);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!catId) return;
    let alive = true;
    content.articles(catId).then((list) => {
      if (!alive) return;
      const inMod = moduleId ? list.filter((a) => a.module === moduleId) : list;
      setArticles(inMod);
    });
    getDoneIds(user?.id).then((ids) => alive && setDoneIds(ids));
    return () => {
      alive = false;
    };
  }, [catId, moduleId, user]);

  const currentCat = categories.find((c) => c.id === catId);
  const modules = currentCat?.modules || [];

  const totalMinutes = useMemo(
    () => articles.reduce((s, a) => s + (Number(a.readMinutes) || 10), 0),
    [articles]
  );

  const generate = () => {
    const days = buildPlan(articles, { daysPerWeek, minutesPerDay });
    setPlan(days);
    localStorage.setItem(
      PLAN_KEY,
      JSON.stringify({ catId, moduleId, daysPerWeek, minutesPerDay })
    );
  };

  if (loading) {
    return <div className="max-w-5xl mx-auto px-4 py-16 text-text-muted">加载中…</div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-1">
        <CalendarClock className="text-brand-500" size={26} />
        <h1 className="text-2xl font-extrabold text-text-primary">学习计划生成器</h1>
      </div>
      <p className="text-text-secondary mb-6">
        选一个方向 / 模块，按每篇 <code className="px-1 rounded bg-surface">readMinutes</code> 自动排出可执行日程。
      </p>

      {/* 选择区 */}
      <div className="grid md:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-xs text-text-muted mb-1">学习方向</label>
          <select
            value={catId}
            onChange={(e) => {
              setCatId(e.target.value);
              setModuleId('');
              setPlan(null);
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
          <label className="block text-xs text-text-muted mb-1">模块（可选，留空=整个方向）</label>
          <select
            value={moduleId}
            onChange={(e) => {
              setModuleId(e.target.value);
              setPlan(null);
            }}
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

      <div className="flex flex-wrap items-end gap-6 mb-6">
        <div>
          <span className="block text-xs text-text-muted mb-1.5">节奏</span>
          <div className="flex gap-2">
            {WEEK_OPTS.map((o) => (
              <button
                key={o.v}
                onClick={() => setDaysPerWeek(o.v)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                  daysPerWeek === o.v ? 'bg-brand-500 text-white' : 'btn-ghost border border-border'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="block text-xs text-text-muted mb-1.5">
            每天约 {minutesPerDay} 分钟
          </span>
          <input
            type="range"
            min="10"
            max="90"
            step="5"
            value={minutesPerDay}
            onChange={(e) => setMinutesPerDay(Number(e.target.value))}
            className="w-44 accent-brand-500"
          />
        </div>
        <button onClick={generate} className="btn-primary px-5 py-2.5 rounded-lg font-semibold">
          <Sparkles size={16} className="inline mr-1" /> 生成计划
        </button>
      </div>

      {/* 概览 */}
      <div className="flex flex-wrap gap-4 mb-6 text-sm">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border">
          <BookOpen size={15} className="text-brand-500" /> {articles.length} 篇
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border">
          <Clock size={15} className="text-brand-500" /> 约 {totalMinutes} 分钟总阅读
        </span>
        {plan && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-border">
            预计 {plan.length} 个学习日
          </span>
        )}
      </div>

      {/* 日历视图 */}
      {!plan && (
        <div className="text-text-muted text-sm py-10 text-center border border-dashed border-border rounded-2xl">
          选择上方条件后点击「生成计划」，这里会出现按天排好的学习清单。
        </div>
      )}
      {plan && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {plan.map((day, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-text-primary">{day.date}</span>
                <span className="text-xs text-text-muted">{day.totalMinutes} 分钟</span>
              </div>
              <ul className="space-y-1.5">
                {day.items.map((it) => {
                  const done = doneIds.has(it.id);
                  return (
                    <li key={it.id}>
                      <Link
                        to={`/article/${it.id}`}
                        className={`flex items-center gap-2 text-sm rounded-lg px-2 py-1 hover:bg-surface ${
                          done ? 'text-text-muted line-through' : 'text-text-primary'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            done ? 'bg-emerald-500' : 'bg-brand-400'
                          }`}
                        />
                        <span className="truncate">{it.title}</span>
                        <span className="ml-auto text-[11px] text-text-muted shrink-0">
                          {it.readMinutes}′
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
