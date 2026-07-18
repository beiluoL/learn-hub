// 学习增强核心逻辑：难度/层级归一化、模块进度、学习计划生成、智能推荐、
// 清单/闪卡抽取、热力图聚合。纯函数，不依赖 React / Supabase，方便复用与测试。

// ---------- 难度 / 层级归一化 ----------
// 内容里 level 存在两套词表：beginner/intermediate/advanced 与 easy/medium/hard
const LEVEL_RANK_MAP = {
  beginner: 1,
  easy: 1,
  intermediate: 2,
  medium: 2,
  advanced: 3,
  hard: 3,
};
export const LEVEL_LABEL = {
  beginner: '入门',
  easy: '简单',
  intermediate: '中等',
  medium: '中等',
  advanced: '进阶',
  hard: '困难',
};

export const TIER_RANK = { basic: 1, core: 2, key: 3, extra: 4 };
export const TIER_LABEL = { basic: '基础', core: '核心', key: '重点', extra: '拓展' };

// 把任意 level 词归一化为 1~3 的整数；未知值按 2 处理
export function normalizeLevel(level) {
  return LEVEL_RANK_MAP[(level || '').toLowerCase()] ?? 2;
}

// 把任意 tier 词归一化为 1~4 的整数；未知值按 2 处理
export function normalizeTier(tier) {
  return TIER_RANK[(tier || '').toLowerCase()] ?? 2;
}

// ---------- 模块进度 ----------
// articles: 模块内文章数组；doneIds: Set<articleId>
export function moduleProgress(articles, doneIds) {
  const total = articles.length;
  const done = articles.filter((a) => doneIds.has(a.id)).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, pct };
}

// ---------- 学习计划生成 ----------
// articles: 排好序的模块文章；opts: { daysPerWeek, minutesPerDay }
// 返回天数数组：[{ date:'YYYY-MM-DD', weekday, items:[{id,title,readMinutes}], totalMinutes }]
export function buildPlan(articles, opts = {}) {
  const daysPerWeek = opts.daysPerWeek || 5;
  const minutesPerDay = opts.minutesPerDay || 30;

  // 排序：先按路线顺序，再按层级(基础→重点)，再按难度(易→难)
  const sorted = [...articles].sort((a, b) => {
    const o = (a.order || 0) - (b.order || 0);
    if (o !== 0) return o;
    const t = normalizeTier(a.tier) - normalizeTier(b.tier);
    if (t !== 0) return t;
    return normalizeLevel(a.level) - normalizeLevel(b.level);
  });

  const days = [];
  let cur = null;
  let curMin = 0;

  const pushDay = () => {
    if (cur && cur.items.length) days.push(cur);
    cur = null;
    curMin = 0;
  };

  // 生成后续学习日期（daysPerWeek<7 时跳过周末）
  const studyDates = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  let added = 0;
  const maxDays = Math.max(1, Math.ceil((sorted.length * minutesPerDay) / Math.max(1, minutesPerDay)) + 30);
  const d = new Date(start);
  while (studyDates.length < maxDays && added < maxDays) {
    const dow = d.getDay(); // 0=日 6=六
    const isWeekend = dow === 0 || dow === 6;
    if (daysPerWeek >= 7 || !isWeekend) studyDates.push(new Date(d));
    d.setDate(d.getDate() + 1);
    added++;
  }

  let dateIdx = 0;
  for (const a of sorted) {
    const rm = Number(a.readMinutes) || 10;
    // 若把这篇放进去会超预算、且当天已有内容、且还有下一天可用 → 先收尾换天，
    // 这样「多篇文章的某天」绝不会超过预算（单篇超长则独自成天，无法再切分）。
    if (cur && curMin + rm > minutesPerDay && cur.items.length > 0 && dateIdx < studyDates.length - 1) {
      pushDay();
      dateIdx++;
    }
    if (!cur) {
      cur = {
        date: fmtDate(studyDates[dateIdx] || start),
        weekday: (studyDates[dateIdx] || start).getDay(),
        items: [],
        totalMinutes: 0,
      };
      curMin = 0;
    }
    cur.items.push({ id: a.id, title: a.title, readMinutes: rm });
    cur.totalMinutes += rm;
    curMin += rm;
  }
  pushDay();

  return days;
}

function fmtDate(dt) {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ---------- 智能下一步推荐 ----------
// articles: 模块文章；doneIds: Set<articleId>；返回按推荐度排序的若干篇
export function recommendNext(articles, doneIds, limit = 3) {
  const candidates = articles.filter((a) => !doneIds.has(a.id));
  if (candidates.length === 0) return [];
  // 推荐打分：层级越关键分越高；难度越低（更易上手）分略高；顺序越靠前分越高
  const scored = candidates.map((a) => {
    const tierScore = normalizeTier(a.tier) * 10; // 1~4 -> 10~40
    const levelScore = (4 - normalizeLevel(a.level)) * 3; // 越易分越高 0~9
    const orderScore = (1000 - (a.order || 0)) / 100; // 顺序靠前略高
    return { a, score: tierScore + levelScore + orderScore };
  });
  scored.sort((x, y) => y.score - x.score);
  return scored.slice(0, limit).map((s) => s.a);
}

// ---------- 从 Markdown 抽取可勾选清单 ----------
// 先去掉代码围栏，避免误把代码里的 - [ ] 当清单
export function extractChecklist(body = '') {
  const noCode = body.replace(/```[\s\S]*?```/g, '').replace(/~~~[\s\S]*?~~~/g, '');
  const re = /^\s*[-*]\s+\[([ xX])\]\s+(.*)$/gm;
  const out = [];
  let m;
  while ((m = re.exec(noCode)) !== null) {
    out.push({ text: m[2].trim(), checked: m[1].toLowerCase() === 'x' });
  }
  return out;
}

// ---------- 从文章抽取闪卡 ----------
// 来源：1) 勾选项（作为「动手要点」）2) 「**术语**：定义」类行 3) 面试题(外部注入)
export function extractFlashcards(article) {
  const cards = [];
  const body = article?.body || '';
  const noCode = body.replace(/```[\s\S]*?```/g, '').replace(/~~~[\s\S]*?~~~/g, '');

  // 勾选项
  const checklist = extractChecklist(body);
  checklist.forEach((c) => {
    cards.push({
      q: c.text,
      a: c.checked ? '你已标记完成 ✅' : '动手完成它，记忆更牢',
      kind: 'check',
    });
  });

  // **术语**：定义
  const termRe = /^\s*[-*]\s+\*\*(.+?)\*\*\s*[:：]\s*(.+)$/gm;
  let t;
  while ((t = termRe.exec(noCode)) !== null) {
    cards.push({ q: t[1].trim(), a: t[2].trim(), kind: 'term' });
  }
  // 标题型：## xxx 作为提示
  const headRe = /^#{2,3}\s+(.+)$/gm;
  let h;
  while ((h = headRe.exec(noCode)) !== null) {
    const title = h[1].trim();
    if (title.length > 4 && title.length < 40) {
      cards.push({ q: `回顾：${title}`, a: '打开文章对应小节，用自己的话复述要点', kind: 'section' });
    }
  }
  return cards;
}

// ---------- 从文章抽取知识自测（Quiz） ----------
// 支持 ```quiz 围栏，块内语法（分隔符宽松）：
//   问题：...            （或 Q: / question:）
//   A. 选项一           （A-H，分隔符 . ) 、 均可）
//   B. 选项二
//   C. 选项三
//   D. 选项四
//   答案：B             （或 answer: / 正确：）
//   解析：...           （或 解释：/ explanation: / 说明：）
// 仅当「问题 + 至少 2 个选项 + 答案」齐全时才收录，避免畸形块破坏渲染。
export function extractQuizzes(body = '') {
  const blocks = body.match(/```quiz\s*\n([\s\S]*?)```/g) || [];
  const out = [];
  for (const blk of blocks) {
    const inner = blk.replace(/```quiz\s*\n/, '').replace(/```$/, '');
    let question = '';
    const options = [];
    let answer = '';
    let explanation = '';
    inner.split('\n').forEach((raw) => {
      const line = raw.trim();
      if (!line) return;
      let m;
      if ((m = line.match(/^(?:问题|Q|question)[:：]\s*(.+)$/i))) {
        question = m[1].trim();
      } else if ((m = line.match(/^([A-H])[.、)]\s+(.+)$/))) {
        options.push({ key: m[1].toUpperCase(), text: m[2].trim() });
      } else if ((m = line.match(/^(?:答案|answer|正确)[:：]\s*([A-H])\s*$/i))) {
        answer = m[1].toUpperCase();
      } else if ((m = line.match(/^(?:解析|解释|explanation|说明)[:：]\s*(.+)$/i))) {
        explanation = m[1].trim();
      }
    });
    if (question && options.length >= 2 && answer) {
      out.push({ question, options, answer, explanation });
    }
  }
  return out;
}

// ---------- 工具：去 HTML 标签 ----------
export function stripHtml(html = '') {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------- 面试题 → 闪卡 ----------
// 面试题答案以 HTML 形式存于 iv.answer；问题作正面、答案纯文本作背面。
export function interviewFlashcards(iv) {
  if (!iv || !iv.question) return [];
  const answer = stripHtml(iv.answer || '');
  return [
    {
      q: iv.question,
      a: answer || '（暂无解析，打开面试题查看完整答案）',
      kind: 'qa',
    },
  ];
}

// ---------- 热力图聚合 ----------
// rows: 兼容两种来源：
//   - progress 表：{ updated_at }（每条记 1 次打卡）
//   - study_log 表：{ day, minutes }（按分钟累加，更细）
// 返回 { 'YYYY-MM-DD': count }
export function heatmapFromProgress(rows = []) {
  const map = {};
  for (const r of rows) {
    const d = (r.day || r.updated_at || '').slice(0, 10);
    if (!d) continue;
    const inc = Number.isFinite(r.minutes) ? r.minutes : 1;
    map[d] = (map[d] || 0) + inc;
  }
  return map;
}

// 最近 N 天日期数组（含今天），用于绘制连续热力图
export function lastNDates(n = 119) {
  const arr = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const dt = new Date(today);
    dt.setDate(dt.getDate() - i);
    arr.push(fmtDateLocal(dt));
  }
  return arr;
}
function fmtDateLocal(dt) {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
