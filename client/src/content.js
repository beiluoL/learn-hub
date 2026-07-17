// 静态内容加载层：从 public/content 读取 manifest.json 与各 .md/.html 文件。
// 无需后端：所有内容都是仓库里的文件，新增文章只需放一个文件 + 重新构建。
import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.setOptions({ gfm: true, breaks: false });

// 内容根目录：基于 Vite 的 BASE_URL + 'content/'，配合 hash 路由可稳定解析到站点根下的 content。
const CONTENT_BASE = new URL(
  import.meta.env.BASE_URL + 'content/',
  document.baseURI
).href;

function fileUrl(file) {
  return CONTENT_BASE + file;
}

// 解析 Markdown 文件头部的 YAML frontmatter（--- ... ---）
function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { data: {}, body: raw };
  const data = {};
  m[1].split('\n').forEach((line) => {
    const i = line.indexOf(':');
    if (i < 0) return;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1).replace(/\\"/g, '"');
    }
    if (k) data[k] = v;
  });
  return { data, body: raw.slice(m[0].length) };
}

// 修复 CJK（中文）+ Markdown 强调语法的经典 bug：
// CommonMark 规则下，强调闭合符号(** / * / __ / _)紧贴中文、且其内侧是全角标点时，
// 该符号不满足“右侧闭合”条件，导致 **回流：**几何 里的星号原样显示、加粗失效。
// 策略：把紧贴在闭合符号内侧的中日韩标点移到强调外侧（**回流：** -> **回流**：）。
const CJK_PUNCT = '：:，,。.、；;！!？?）)】》”’…—·';
function fixCjkEmphasis(md) {
  // ** 文字：** / __文字：__（双符号，先处理，避免与单符号冲突）
  let out = md.replace(
    new RegExp(`(\\*\\*|__)([^\\n*_]*?)([${CJK_PUNCT}]+)\\1`, 'g'),
    '$1$2$1$3'
  );
  // *文字：* / _文字：_（单符号，避开 ** 残留）
  out = out.replace(
    new RegExp(`(^|[^*_])([*_])([^\\n*_]+?)([${CJK_PUNCT}]+)\\2(?![*_])`, 'g'),
    '$1$2$3$2$4'
  );
  return out;
}

// 把正文渲染为安全的 HTML（md 用 marked 解析，html 直接用；统一经 DOMPurify 消毒）
function renderBody(body, type) {
  const html = type === 'html' ? body : marked.parse(fixCjkEmphasis(body || ''));
  return DOMPurify.sanitize(html, {
    ADD_ATTR: ['target', 'rel'],
    FORBID_TAGS: ['style', 'iframe', 'form', 'input', 'button'],
  });
}

function splitTags(tags) {
  if (Array.isArray(tags)) return tags;
  return String(tags || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

let _manifest = null;
async function loadManifest() {
  if (_manifest) return _manifest;
  const res = await fetch(fileUrl('manifest.json'), { cache: 'no-cache' });
  if (!res.ok) throw new Error('无法加载 content/manifest.json');
  _manifest = await res.json();
  return _manifest;
}

// 搜索评分：对每个关键词，命中 title/question 加 5 分、summary 加 3 分、tags 加 2 分、category 加 1 分
function matchScore(item, keywords) {
  let score = 0;
  const title = (item.title || item.question || '').toLowerCase();
  const summary = (item.summary || '').toLowerCase();
  const tags = Array.isArray(item.tags)
    ? item.tags.join(' ').toLowerCase()
    : String(item.tags || '').toLowerCase();
  const cat = (item.category || '').toLowerCase();

  for (const kw of keywords) {
    if (title.includes(kw)) score += 5;
    if (summary.includes(kw)) score += 3;
    if (tags.includes(kw)) score += 2;
    if (cat.includes(kw)) score += 1;
  }
  return score;
}

// 提取包含关键词的文本片段（前后各 20 字），没有 body/answer 则回退到 summary
function snippet(item, keywords) {
  const bodyText = item.body || item.answer || item.summary || '';
  if (!bodyText) return '';

  // 去 HTML 标签
  const text = bodyText.replace(/<[^>]*>/g, '');
  const lower = text.toLowerCase();

  for (const kw of keywords) {
    const idx = lower.indexOf(kw);
    if (idx >= 0) {
      const start = Math.max(0, idx - 20);
      const end = Math.min(text.length, idx + kw.length + 20);
      let s = text.slice(start, end);
      if (start > 0) s = '…' + s;
      if (end < text.length) s = s + '…';
      return s;
    }
  }

  return text.slice(0, 100) + (text.length > 100 ? '…' : '');
}

export const content = {
  url: fileUrl,

  async manifest() {
    return loadManifest();
  },

  async stats() {
    const m = await loadManifest();
    return {
      categories: m.categories.length,
      articles: m.articles.length,
      interviews: m.interviews.length,
    };
  },

  async categories() {
    const m = await loadManifest();
    const counts = {};
    m.articles.forEach((a) => {
      counts[a.category] = (counts[a.category] || 0) + 1;
    });
    const ivCount = m.interviews.length;
    return m.categories.map((c) =>
      c.id === 'interview'
        ? { ...c, count: ivCount }
        : { ...c, count: counts[c.id] || 0 }
    );
  },

  async articles(category) {
    const m = await loadManifest();
    let list = m.articles.map((a) => ({ ...a, tags: splitTags(a.tags) }));
    if (category) list = list.filter((a) => a.category === category);
    return [...list].sort((a, b) => (a.order || 0) - (b.order || 0));
  },

  async article(id) {
    const m = await loadManifest();
    const meta = m.articles.find((a) => a.id === id);
    if (!meta) return null;
    const raw = await fetch(fileUrl(meta.file)).then((r) => r.text());
    const { body } = parseFrontmatter(raw);
    return { ...meta, tags: splitTags(meta.tags), content: renderBody(body, meta.type), body };
  },

  async interviews(category) {
    const m = await loadManifest();
    let list = m.interviews.map((i) => ({ ...i, tags: splitTags(i.tags) }));
    if (category && category !== 'all')
      list = list.filter((i) => i.category === category);
    return [...list].sort((a, b) => (a.order || 0) - (b.order || 0));
  },

  async interview(id) {
    const m = await loadManifest();
    const meta = m.interviews.find((i) => i.id === id);
    if (!meta) return null;
    const raw = await fetch(fileUrl(meta.file)).then((r) => r.text());
    const { body } = parseFrontmatter(raw);
    return { ...meta, tags: splitTags(meta.tags), answer: renderBody(body, meta.type) };
  },

  async search(q) {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    const data = await loadManifest();
    const keywords = term.split(/[\s,，、]+/).filter(Boolean);

    const results = [];
    // 搜索文章
    for (const a of data.articles) {
      const score = matchScore(a, keywords);
      if (score > 0) results.push({ ...a, tags: splitTags(a.tags), _type: 'article', _score: score, _snippet: snippet(a, keywords) });
    }
    // 搜索面试题
    for (const iv of data.interviews) {
      const score = matchScore(iv, keywords);
      if (score > 0) results.push({ ...iv, tags: splitTags(iv.tags), _type: 'interview', _score: score, _snippet: snippet(iv, keywords) });
    }
    // 按分数降序
    results.sort((a, b) => b._score - a._score);
    return results;
  },
};
