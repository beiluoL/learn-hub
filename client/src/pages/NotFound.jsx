import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-24 text-center">
      <div className="text-6xl mb-4">🧭</div>
      <h1 className="text-2xl font-extrabold text-gray-800">页面走丢了</h1>
      <p className="text-gray-500 mt-2">你访问的页面不存在。</p>
      <Link
        to="/"
        className="inline-block mt-6 bg-brand-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-brand-700"
      >
        回到首页
      </Link>
    </div>
  );
}
