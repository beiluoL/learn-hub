import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Breadcrumb({ items = [] }) {
  const navigate = useNavigate();
  if (items.length === 0) return null;

  // 返回上一页：优先浏览器历史回退，无历史则回首页
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  return (
    <nav className="inline-flex items-center gap-1 text-sm text-text-muted">
      <button
        type="button"
        onClick={goBack}
        title="返回上一页"
        aria-label="返回上一页"
        className="inline-flex items-center justify-center w-6 h-6 -ml-1 rounded-md hover:bg-surface hover:text-brand-600 transition"
      >
        <ArrowLeft size={14} className="shrink-0" />
      </button>
      {items.map((item, idx) => (
        <span key={idx} className="flex items-center gap-1">
          {idx > 0 && <span className="text-text-muted select-none">/</span>}
          {item.to ? (
            <Link to={item.to} className="hover:text-brand-600 transition">
              {item.label}
            </Link>
          ) : (
            <span className="text-text-secondary">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
