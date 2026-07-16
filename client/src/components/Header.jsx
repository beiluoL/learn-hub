import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Header() {
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    const term = q.trim();
    if (term) navigate(`/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-500 grid place-items-center text-white text-lg shadow-soft">
            🚀
          </span>
          <span className="text-lg font-extrabold tracking-tight">
            Learn<span className="text-brand-600">Hub</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-gray-600">
          <Link to="/" className="px-3 py-2 rounded-lg hover:bg-gray-100">
            首页
          </Link>
          <Link to="/interviews" className="px-3 py-2 rounded-lg hover:bg-gray-100">
            面试题
          </Link>
        </nav>

        <form onSubmit={submit} className="ml-auto flex-1 max-w-md">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索 Java / Python / 前端 / AI / 面试题…"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-gray-100 border border-transparent focus:border-brand-300 focus:bg-white outline-none text-sm"
            />
          </div>
        </form>
      </div>
    </header>
  );
}
