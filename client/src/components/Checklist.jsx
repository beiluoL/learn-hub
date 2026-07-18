import { useState, useEffect } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { extractChecklist } from '../lib/study.js';

// 把文章 markdown 里的 - [ ] / - [x] 渲染成可勾选清单，状态本地持久化。
// 复用文章正文，无需额外数据结构；游客/登录态都生效（localStorage）。

const keyOf = (articleId) => `lh_check_${articleId}`;
function loadChecks(articleId) {
  try {
    return JSON.parse(localStorage.getItem(keyOf(articleId)) || '{}');
  } catch {
    return {};
  }
}
function saveChecks(articleId, map) {
  try {
    localStorage.setItem(keyOf(articleId), JSON.stringify(map));
  } catch {
    /* 忽略 */
  }
}

export default function Checklist({ body, articleId }) {
  const [items, setItems] = useState(null);

  useEffect(() => {
    const base = extractChecklist(body || '');
    const saved = loadChecks(articleId);
    const merged = base.map((b) => ({
      ...b,
      checked: saved[b.text] !== undefined ? saved[b.text] : b.checked,
    }));
    setItems(merged);
  }, [body, articleId]);

  if (!items) return null;
  if (items.length === 0) return null;

  const toggle = (text) => {
    setItems((prev) => {
      const next = prev.map((it) =>
        it.text === text ? { ...it, checked: !it.checked } : it
      );
      const map = {};
      next.forEach((it) => (map[it.text] = it.checked));
      saveChecks(articleId, map);
      return next;
    });
  };

  const done = items.filter((i) => i.checked).length;

  return (
    <section className="my-6 rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-text-primary flex items-center gap-2">
          <CheckCircle2 size={18} className="text-brand-500" />
          学习目标清单
        </h3>
        <span className="text-xs text-text-secondary">
          {done}/{items.length} 已完成
        </span>
      </div>
      <ul className="space-y-1.5">
        {items.map((it, idx) => (
          <li key={idx}>
            <button
              onClick={() => toggle(it.text)}
              className="w-full flex items-start gap-2.5 text-left rounded-lg px-2 py-1.5 hover:bg-surface transition"
            >
              {it.checked ? (
                <CheckCircle2 size={18} className="text-emerald-500 mt-0.5 shrink-0" />
              ) : (
                <Circle size={18} className="text-text-muted mt-0.5 shrink-0" />
              )}
              <span
                className={
                  it.checked
                    ? 'text-text-secondary line-through text-sm'
                    : 'text-text-primary text-sm'
                }
              >
                {it.text}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
