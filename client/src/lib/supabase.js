import { createClient } from '@supabase/supabase-js';

// 这两个值来自 .env（Vite 会把 VITE_ 前缀的变量暴露到 import.meta.env）
// 没配置时（占位/本地未填）保持 null，整个站点降级为「游客模式」，不会崩溃。
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// 是否已正确配置 Supabase（前端只用 publishable key，它本就公开）
export const isSupabaseConfigured = Boolean(url && key);

export const supabase = isSupabaseConfigured ? createClient(url, key) : null;
