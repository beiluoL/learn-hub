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

// 把正文渲染为安全的 HTML（md 用 marked 解析，html 直接用；统一经 DOMPurify 消毒）
function renderBody(body, type) {
  const html = type === 'html' ? body : marked.parse(body || '');
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
    return { ...meta, tags: splitTags(meta.tags), content: renderBody(body, meta.type) };
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
    const term = (q || '').trim().toLowerCase();
    const m = await loadManifest();
    if (!term) return { articles: [], interviews: [], total: 0 };
    const articles = m.articles
      .filter((a) => {
        const hay = [
          a.title,
          a.summary,
          (a.tags || []).join(' '),
          a.category,
        ]
          .join(' ')
          .toLowerCase();
        return hay.includes(term);
      })
      .map((a) => ({ ...a, tags: splitTags(a.tags) }));
    const interviews = m.interviews
      .filter((i) => {
        const hay = [i.question, (i.tags || []).join(' '), i.category]
          .join(' ')
          .toLowerCase();
        return hay.includes(term);
      })
      .map((i) => ({ ...i, tags: splitTags(i.tags) }));
    return { articles, interviews, total: articles.length + interviews.length };
  },
};
