import { supabase } from './supabase';

// 全部走 Supabase 的 progress / notes / study_log 表（用户登录后才有云端数据）。
// 未配置 Supabase 或游客态时：进度/笔记/上次读到 等安全降级到 localStorage，
// 这样「本地持久化」始终可用（满足「清单勾选状态本地持久化」需求）。

const LS_DONE = 'lh_done'; // { [articleId]: true }
const LS_NOTE = 'lh_notes'; // { [articleId]: '笔记文本' }
const LS_LAST = 'lh_lastread'; // { [userIdOrGuest]: articleId }

function lsGet(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}
function lsSet(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    /* 容量满/隐私模式：静默降级 */
  }
}

// ---------------- 学习进度（已学） ----------------
export async function getDone(userId, articleId) {
  if (!supabase || !userId) return !!lsGet(LS_DONE, {})[articleId];
  const { data } = await supabase
    .from('progress')
    .select('done')
    .eq('user_id', userId)
    .eq('article_id', articleId)
    .single();
  return data?.done ?? false;
}

export async function setDone(userId, articleId, done) {
  if (!supabase || !userId) {
    const map = lsGet(LS_DONE, {});
    if (done) map[articleId] = true;
    else delete map[articleId];
    lsSet(LS_DONE, map);
    return;
  }
  await supabase.from('progress').upsert({
    user_id: userId,
    article_id: articleId,
    done,
    updated_at: new Date().toISOString(),
  });
}

export async function getDoneIds(userId) {
  if (!supabase || !userId) return new Set(Object.keys(lsGet(LS_DONE, {})));
  const { data } = await supabase
    .from('progress')
    .select('article_id')
    .eq('user_id', userId)
    .eq('done', true);
  return new Set((data || []).map((d) => d.article_id));
}

// 取最近标记/阅读的进度行（用于热力图 & 首页「最近」）
export async function getRecent(userId, limit = 5) {
  if (!supabase || !userId) return [];
  const { data } = await supabase
    .from('progress')
    .select('article_id, done, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit);
  return data || [];
}

// 取用户全部进度行（用于热力图，最多 365 条）
export async function getAllProgress(userId) {
  if (!supabase || !userId) return [];
  const { data } = await supabase
    .from('progress')
    .select('article_id, done, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(365);
  return data || [];
}

export async function getDoneCount(userId) {
  if (!supabase || !userId) return Object.keys(lsGet(LS_DONE, {})).length;
  const { count } = await supabase
    .from('progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('done', true);
  return count || 0;
}

// ---------------- 笔记 ----------------
export async function getNote(userId, articleId) {
  if (!supabase || !userId) return lsGet(LS_NOTE, {})[articleId] || '';
  const { data } = await supabase
    .from('notes')
    .select('body')
    .eq('user_id', userId)
    .eq('article_id', articleId)
    .single();
  return data?.body || '';
}

export async function setNote(userId, articleId, body) {
  if (!supabase || !userId) {
    const map = lsGet(LS_NOTE, {});
    if (body && body.trim()) map[articleId] = body;
    else delete map[articleId];
    lsSet(LS_NOTE, map);
    return;
  }
  await supabase.from('notes').upsert({
    user_id: userId,
    article_id: articleId,
    body,
    updated_at: new Date().toISOString(),
  });
}

// ---------------- 上次读到（继续学习） ----------------
export function getLastRead(userId) {
  const key = userId || 'guest';
  return lsGet(LS_LAST, {})[key] || null;
}
export function setLastRead(userId, articleId) {
  const key = userId || 'guest';
  const map = lsGet(LS_LAST, {});
  map[key] = articleId;
  lsSet(LS_LAST, map);
}

// ---------------- 学习日志（热力图分钟数 / 打卡） ----------------
// 游客态不写云端；登录态写入 study_log 表（用于更丰富的热力图）
export async function logStudy(userId, { articleId, minutes = 0 }) {
  if (!supabase || !userId) return;
  const day = new Date().toISOString().slice(0, 10);
  try {
    await supabase.from('study_log').upsert(
      {
        user_id: userId,
        day,
        article_id: articleId,
        minutes: Math.max(0, Math.round(minutes)),
      },
      { onConflict: 'user_id,day,article_id' }
    );
  } catch {
    /* 表不存在（未执行最新 schema）时静默忽略，不影响「标记已学」 */
  }
}

export async function getStudyLog(userId) {
  if (!supabase || !userId) return [];
  const { data } = await supabase
    .from('study_log')
    .select('day, minutes, article_id')
    .eq('user_id', userId)
    .order('day', { ascending: false })
    .limit(400);
  return data || [];
}
