import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!user) {
    return (
      <Link
        to="/login"
        className="px-3 py-2 rounded-lg text-sm font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 transition"
      >
        登录
      </Link>
    );
  }

  const email = user.email || (user.app_metadata?.provider && `GitHub 用户`) || '已登录';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-text-secondary hover:bg-brand-50 hover:text-brand-600 transition cursor-pointer"
      >
        <span className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 grid place-items-center text-white">
          <User size={15} />
        </span>
        <span className="hidden sm:inline max-w-[120px] truncate">{email}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-card border border-border rounded-xl shadow-card p-1.5 z-50">
          <div className="px-3 py-2 text-xs text-text-muted truncate">{email}</div>
          <button
            onClick={async () => {
              setOpen(false);
              await logout();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-primary hover:bg-brand-50 hover:text-brand-600 transition cursor-pointer"
          >
            <LogOut size={15} />
            退出登录
          </button>
        </div>
      )}
    </div>
  );
}
