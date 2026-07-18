import { useState, useMemo } from 'react';
import { RefreshCw, Check, ArrowRight, ArrowLeft, Lightbulb } from 'lucide-react';

// 闪卡：翻转记忆 + 间隔复习。cards: [{q, a, kind}]
// 已知卡可标记「记住」，进度本地保存（lh_flash_<hash>）用于间隔复习。
function flashKey(q) {
  return 'lh_flash_' + btoa(unescape(encodeURIComponent(q))).slice(0, 24);
}
function loadKnown(q) {
  try {
    return localStorage.getItem(flashKey(q)) === '1';
  } catch {
    return false;
  }
}
function markKnown(q, v) {
  try {
    if (v) localStorage.setItem(flashKey(q), '1');
    else localStorage.removeItem(flashKey(q));
  } catch {
    /* ignore */
  }
}

export default function Flashcards({ cards }) {
  const list = useMemo(() => cards || [], [cards]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [knownFilter, setKnownFilter] = useState('all'); // all | unknown

  if (!list.length) {
    return (
      <div className="text-text-muted text-sm py-6 text-center">
        这篇文章暂无可生成的闪卡，去试试其它章节或面试题吧。
      </div>
    );
  }

  const visible = list.filter((c) =>
    knownFilter === 'unknown' ? !loadKnown(c.q) : true
  );
  const cur = visible[Math.min(idx, visible.length - 1)] || list[0];
  const knownCount = list.filter((c) => loadKnown(c.q)).length;

  const next = () => {
    setFlipped(false);
    setIdx((i) => (i + 1) % visible.length);
  };
  const prev = () => {
    setFlipped(false);
    setIdx((i) => (i - 1 + visible.length) % visible.length);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-text-primary flex items-center gap-2">
          <Lightbulb size={18} className="text-amber-500" />
          自测闪卡
        </h3>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-text-secondary">
            {knownCount}/{list.length} 已掌握
          </span>
          <button
            onClick={() => setKnownFilter(knownFilter === 'all' ? 'unknown' : 'all')}
            className="px-2.5 py-1 rounded-lg border border-border text-text-secondary hover:bg-surface"
          >
            {knownFilter === 'all' ? '只看未掌握' : '看全部'}
          </button>
        </div>
      </div>

      <button
        onClick={() => setFlipped((f) => !f)}
        className="w-full text-left rounded-xl border border-border bg-surface p-5 min-h-[120px] flex flex-col justify-center transition hover:border-brand-300"
      >
        <span className="text-xs text-text-muted mb-2">
          {cur.kind === 'check' ? '动手要点' : cur.kind === 'term' ? '概念' : '回顾'}
        </span>
        <span className="text-lg font-semibold text-text-primary">
          {flipped ? cur.a : cur.q}
        </span>
        {!flipped && (
          <span className="text-xs text-brand-500 mt-3 inline-flex items-center gap-1">
            点击查看答案 <ArrowRight size={13} />
          </span>
        )}
      </button>

      <div className="flex items-center justify-between mt-4">
        <button onClick={prev} className="p-2 rounded-lg border border-border hover:bg-surface" aria-label="上一张">
          <ArrowLeft size={16} />
        </button>
        <span className="text-xs text-text-muted">
          {Math.min(idx + 1, visible.length)} / {visible.length}
        </span>
        <button onClick={next} className="p-2 rounded-lg border border-border hover:bg-surface" aria-label="下一张">
          <ArrowRight size={16} />
        </button>
      </div>

      <button
        onClick={() => {
          markKnown(cur.q, !loadKnown(cur.q));
          setIdx((i) => (i + 1) % visible.length);
          setFlipped(false);
        }}
        className={`mt-3 w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-medium transition ${
          loadKnown(cur.q)
            ? 'bg-surface text-text-secondary border border-border'
            : 'bg-brand-500 text-white hover:bg-brand-600'
        }`}
      >
        {loadKnown(cur.q) ? (
          <>
            <RefreshCw size={15} /> 标为未掌握
          </>
        ) : (
          <>
            <Check size={15} /> 我记住了
          </>
        )}
      </button>
    </div>
  );
}
