import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 没配置 Supabase 时直接放行，避免一直转圈
    if (!supabase) {
      setLoading(false);
      return;
    }
    // 页面加载时恢复已有登录态（会话存在 localStorage）
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    // 监听登录/登出变化（含 GitHub OAuth 回调）
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // 邮箱 + 密码 注册
  const register = useCallback(async (email, password) => {
    if (!supabase) throw new Error('未配置 Supabase');
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }, []);

  // 邮箱 + 密码 登录
  const login = useCallback(async (email, password) => {
    if (!supabase) throw new Error('未配置 Supabase');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  // GitHub 第三方登录（会跳转到 GitHub 授权页，回来后自动登录）
  const loginWithGitHub = useCallback(async () => {
    if (!supabase) throw new Error('未配置 Supabase');
    // 注意：不要在这里写 '#/'。HashRouter 用 hash 做路由，若 redirectTo 含 '#/'，
    // Supabase 会把 PKCE 的 ?code 塞进 hash 片段，HashRouter 会把它误当成路由路径。
    // 正确做法：只给「源 + 基础路径」（本地是 /，部署是 /learn-hub/），
    // 让 ?code 成为真实 query 参数，Supabase 自行读取并清理；回调后落在首页（#/）。
    const redirectTo = window.location.origin + window.location.pathname;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo },
    });
    if (error) throw error;
  }, []);

  // 退出登录
  const logout = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const value = {
    user,
    loading,
    isSupabaseConfigured,
    register,
    login,
    loginWithGitHub,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth 必须在 AuthProvider 内使用');
  return ctx;
}
