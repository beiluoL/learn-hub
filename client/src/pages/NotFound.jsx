import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-24 text-center">
      <Home size={56} className="mx-auto mb-4 text-text-muted" />
      <h1 className="text-2xl font-extrabold text-text-primary">页面走丢了</h1>
      <p className="text-text-secondary mt-2">你访问的页面不存在。</p>
      <Link
        to="/"
        className="btn-primary inline-flex items-center gap-2 mt-6 px-6 py-2.5 rounded-lg font-semibold"
      >
        <Home size={16} />
        回到首页
      </Link>
    </div>
  );
}
