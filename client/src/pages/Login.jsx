import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Coffee, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, register, loginWithGitHub, isSupabaseConfigured } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setOk('');
    if (!isSupabaseConfigured) {
      setErr('还没有配置 Supabase。请先在项目根目录 .env 填入 VITE_SUPABASE_URL 和 VITE_SUPABASE_PUBLISHABLE_KEY（见 .env.example）。');
      return;
    }
    if (password.length < 6) {
      setErr('密码至少 6 位。');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password);
        setOk('注册成功！如果开启了邮箱验证，请先去邮箱点击确认链接，再回来登录。');
      }
      if (mode === 'login') navigate('/');
    } catch (e) {
      setErr(e.message || '操作失败，请重试。');
    } finally {
      setBusy(false);
    }
  };

  const onGitHub = async () => {
    setErr('');
    if (!isSupabaseConfigured) {
      setErr('还没有配置 Supabase。请先在 .env 填入密钥，并在 Supabase 后台开启 GitHub 登录。');
      return;
    }
    try {
      await loginWithGitHub(); // 会跳转到 GitHub，无需后续处理
    } catch (e) {
      setErr(e.message || 'GitHub 登录失败。');
    }
  };

  return (
    <div className="min-h-[70vh] grid place-items-center px-4 py-12">
      <div className="w-full max-w-md bg-card border border-border rounded-3xl shadow-card p-8">
        <div className="flex items-center gap-2 justify-center mb-6">
          <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 grid place-items-center text-white">
            <Coffee size={22} />
          </span>
          <span className="text-xl font-extrabold">
            Learn<span className="text-brand-600">Hub</span>
          </span>
        </div>

        <div className="flex p-1 bg-surface rounded-xl mb-6">
          <button
            onClick={() => { setMode('login'); setErr(''); setOk(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
              mode === 'login' ? 'bg-brand-600 text-white shadow' : 'text-text-secondary'
            }`}
          >
            登录
          </button>
          <button
            onClick={() => { setMode('register'); setErr(''); setOk(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
              mode === 'register' ? 'bg-brand-600 text-white shadow' : 'text-text-secondary'
            }`}
          >
            注册
          </button>
        </div>

        {err && (
          <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{err}</span>
          </div>
        )}
        {ok && (
          <div className="flex items-start gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            <span>{ok}</span>
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">
              邮箱
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="search-input w-full pl-9 pr-3 py-2.5 rounded-xl bg-surface border border-border focus:border-brand-400 outline-none text-sm text-text-primary placeholder:text-text-muted"
              />
            </div>
          </div>
          <div>
            <label htmlFor="pwd" className="block text-sm font-medium text-text-secondary mb-1">
              密码
            </label>
            <input
              id="pwd"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位"
              className="search-input w-full px-3 py-2.5 rounded-xl bg-surface border border-border focus:border-brand-400 outline-none text-sm text-text-primary placeholder:text-text-muted"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-xl bg-brand-600 text-white font-semibold text-sm hover:bg-brand-700 transition disabled:opacity-60 cursor-pointer"
          >
            {busy ? '处理中…' : mode === 'login' ? '登录' : '注册并登录'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5 text-xs text-text-muted">
          <div className="h-px bg-border flex-1" />
          或
          <div className="h-px bg-border flex-1" />
        </div>

        <button
          onClick={onGitHub}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border bg-surface text-sm font-semibold text-text-primary hover:bg-brand-50 hover:text-brand-600 transition cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 .5C5.73.5.5 5.73.5 12.02c0 5.1 3.29 9.42 7.86 10.95.58.11.79-.25.79-.56v-2.1c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.1-.75.41-1.27.74-1.56-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.69.42.36.8 1.08.8 2.18v3.23c0 .31.21.68.8.56A11.53 11.53 0 0 0 23.5 12.02C23.5 5.73 18.27.5 12 .5z" />
          </svg>
          使用 GitHub 登录
        </button>

        <p className="text-center text-xs text-text-muted mt-6">
          <Link to="/" className="hover:text-brand-600 underline">
            返回首页
          </Link>
        </p>
      </div>
    </div>
  );
}
