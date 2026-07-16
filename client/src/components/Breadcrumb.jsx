import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Breadcrumb({ items = [] }) {
  if (items.length === 0) return null;

  return (
    <nav className="inline-flex items-center gap-1 text-sm text-text-muted">
      <ArrowLeft size={14} className="shrink-0" />
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
