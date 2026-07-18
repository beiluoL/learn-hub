import { useState, useEffect, useRef } from 'react';
import { NotebookPen, Check } from 'lucide-react';
import { getNote, setNote } from '../lib/progress.js';

// 每篇文章的个人笔记。登录态存 Supabase notes 表，游客态降级 localStorage。
export default function NotesPanel({ articleId, userId }) {
  const [text, setText] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    let alive = true;
    setLoaded(false);
    getNote(userId, articleId).then((t) => {
      if (alive) {
        setText(t || '');
        setLoaded(true);
      }
    });
    return () => {
      alive = false;
    };
  }, [articleId, userId]);

  const onChange = (e) => {
    const v = e.target.value;
    setText(v);
    setSaved(false);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setNote(userId, articleId, v).then(() => setSaved(true));
    }, 600);
  };

  return (
    <section className="my-6 rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-text-primary flex items-center gap-2">
          <NotebookPen size={18} className="text-brand-500" />
          我的笔记
        </h3>
        {saved && loaded && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-500">
            <Check size={14} /> 已保存
          </span>
        )}
      </div>
      <textarea
        value={text}
        onChange={onChange}
        placeholder="读到这里有灵感？随手记点什么，会自动保存…"
        className="w-full min-h-[120px] resize-y rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
      />
      <p className="mt-1.5 text-xs text-text-muted">
        {userId ? '已登录：笔记云端保存，换设备也在。' : '游客态：笔记仅保存在本机浏览器。'}
      </p>
    </section>
  );
}
