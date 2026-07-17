import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Coffee, Search, Menu, X, Sun, Moon } from 'lucide-react';

const NAV = [
  { to: '/', label: '首页' },
  { to: '/map', label: '知识地图' },
  { to: '/interviews', label: '面试题' },
];

export default function Header() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  const submit = (e) => {
    e.preventDefault();
    const term = q.trim();
    if (term) {
      navigate(`/search?q=${encodeURIComponent(term)}`);
      setQ('');
      setOpen(false);
    }
  };

  const active = (to) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  const linkClass = (to) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition ${
      active(to)
        ? 'text-brand-600 bg-brand-50'
        : 'text-text-secondary hover:bg-brand-50 hover:text-brand-600'
    }`;

  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 bg-card/80 backdrop-blur border-b border-border">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0" onClick={close}>
          <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 grid place-items-center text-white shadow-soft">
            <Coffee size={20} />
          </span>
          <span className="text-lg font-extrabold tracking-tight hidden sm:inline">
            Learn<span className="text-brand-600">Hub</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className={linkClass(n.to)}>
              {n.label}
            </Link>
          ))}
        </nav>

        {/* Search */}
        <form onSubmit={submit} className="ml-auto flex-1 max-w-md">
          <label htmlFor="hd-search" className="sr-only">搜索</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              id="hd-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索 Java / Python / 前端 / AI…"
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface border border-border focus:border-brand-400 focus:bg-card outline-none text-sm text-text-primary placeholder:text-text-muted transition"
            />
          </div>
        </form>

        {/* Dark mode toggle */}
        <button
          onClick={() => setDark(!dark)}
          className="p-2 rounded-lg text-text-muted hover:bg-brand-50 hover:text-brand-600 transition"
          aria-label="切换暗色模式"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Hamburger button */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 rounded-lg text-text-secondary hover:bg-brand-50 hover:text-brand-600 transition"
          aria-label="菜单"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <>
          <div
            className="md:hidden fixed inset-0 top-16 bg-black/30 z-30"
            onClick={close}
          />
          <nav className="md:hidden absolute top-full left-0 right-0 bg-card border-b border-border shadow-card z-30 px-4 py-4 flex flex-col gap-1">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={close}
                className={linkClass(n.to) + ' block'}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </>
      )}
    </header>
  );
}
