-- ============================================================
-- LearnHub · Supabase 建表 SQL
-- 用法：登录 Supabase 控制台 → SQL Editor → 新建查询 → 粘贴本文件 → Run
-- 作用：用户资料、学习进度、笔记 三张表 + 行级安全（RLS）策略
-- ============================================================

-- 1) 用户资料（与 auth.users 一对一关联）
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text,
  created_at timestamptz default now()
);

-- 2) 学习进度（复用文章的 id；done=true 表示「已学」）
create table if not exists public.progress (
  user_id uuid references auth.users (id) on delete cascade,
  article_id text not null,
  done boolean default false,
  updated_at timestamptz default now(),
  primary key (user_id, article_id)
);

-- 3) 笔记
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid (),
  user_id uuid references auth.users (id) on delete cascade,
  article_id text not null,
  body text,
  created_at timestamptz default now()
);

-- 4) 站点访问计数（可选：想在首页显示「累计访问」时使用）
create table if not exists public.site_stats (
  id int primary key default 1,
  visits int default 0
);
insert into public.site_stats (id, visits) values (1, 0) on conflict (id) do nothing;

-- ===================== 开启行级安全（必须） =====================
alter table public.profiles enable row level security;
alter table public.progress enable row level security;
alter table public.notes enable row level security;
alter table public.site_stats enable row level security;

-- 用户只能读写自己的资料
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid () = id) with check (auth.uid () = id);

-- 用户只能读写自己的进度
drop policy if exists "own progress" on public.progress;
create policy "own progress" on public.progress
  for all using (auth.uid () = user_id) with check (auth.uid () = user_id);

-- 用户只能读写自己的笔记
drop policy if exists "own notes" on public.notes;
create policy "own notes" on public.notes
  for all using (auth.uid () = user_id) with check (auth.uid () = user_id);

-- 访问计数：任何人可读，任何人可 +1（匿名也允许）
drop policy if exists "anyone reads stats" on public.site_stats;
create policy "anyone reads stats" on public.site_stats for select using (true);
drop policy if exists "anyone +1 stats" on public.site_stats;
create policy "anyone +1 stats" on public.site_stats for update using (true) with check (true);

-- 5) 学习日志（热力图 / 打卡：记录每日学习的文章与分钟数）
create table if not exists public.study_log (
  user_id uuid references auth.users (id) on delete cascade,
  day date not null,
  article_id text not null,
  minutes int default 0,
  primary key (user_id, day, article_id)
);

alter table public.study_log enable row level security;
drop policy if exists "own study_log" on public.study_log;
create policy "own study_log" on public.study_log
  for all using (auth.uid () = user_id) with check (auth.uid () = user_id);
