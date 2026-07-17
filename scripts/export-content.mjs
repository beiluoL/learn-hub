// 内容导出脚本（构建期运行，Node 环境）
// 作用：
//   1. 把 server/data 里的结构化种子内容转成 Markdown 文件，写入 client/public/content/
//   2. 扫描 client/public/content 下所有 .md / .html 文件，生成 manifest.json
// 这样网站就是一个纯静态站点：内容就是仓库里的文件，新增/修改文章只需增删文件后重新 build。
import { categories, getAllArticles, getInterviews } from '../server/data/index.js';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.resolve(__dirname, '../client/public/content');
const CATEGORIES_FILE = path.join(CONTENT_DIR, 'categories.json');
const MANIFEST_FILE = path.join(CONTENT_DIR, 'manifest.json');

const td = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '*',
});
td.use(gfm);
// 让代码块保留语言信息（若存在 class="language-xxx"）
td.addRule('fencedCodeWithLang', {
  filter: (node) =>
    node.nodeName === 'PRE' &&
    node.firstChild &&
    node.firstChild.nodeName === 'CODE' &&
    node.firstChild.getAttribute('class'),
  replacement: (_content, node) => {
    const code = node.firstChild;
    const cls = code.getAttribute('class') || '';
    const lang = (cls.match(/language-(\w+)/) || [])[1] || '';
    return '```' + lang + '\n' + code.textContent + '\n```\n\n';
  },
});

// ---------- 工具 ----------
function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function escapeFrontmatterValue(v) {
  const s = String(v ?? '');
  return /[:#\-{}\[\],"]/.test(s) ? `"${s.replace(/"/g, '\\"')}"` : s;
}

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

// ---------- 1. 写出 categories.json（若已存在则保留用户编辑） ----------
ensureDir(CONTENT_DIR);
if (!fs.existsSync(CATEGORIES_FILE)) {
  fs.writeFileSync(
    CATEGORIES_FILE,
    JSON.stringify(categories, null, 2) + '\n',
    'utf8'
  );
  console.log('✅ 已生成 categories.json（分类元数据，可手动编辑）');
} else {
  console.log('ℹ️  categories.json 已存在，保留现有内容');
}

// ---------- 2. 写出种子 Markdown 文件 ----------
function writeArticleFile(catId, article, order) {
  const dir = path.join(CONTENT_DIR, catId);
  ensureDir(dir);
  const file = path.join(dir, `${article.id}.md`);
  const tags = (article.tags || []).join(', ');
  const fm = [
    '---',
    `title: ${escapeFrontmatterValue(article.title)}`,
    `category: ${catId}`,
    `level: ${article.level || 'beginner'}`,
    `readMinutes: ${article.readMinutes || 10}`,
    `tags: ${escapeFrontmatterValue(tags)}`,
    `summary: ${escapeFrontmatterValue(article.summary || '')}`,
    `order: ${order}`,
    '---',
    '',
    td.turndown(article.content || ''),
  ].join('\n');
  fs.writeFileSync(file, fm + '\n', 'utf8');
}

function writeInterviewFile(iv, order) {
  const dir = path.join(CONTENT_DIR, 'interviews');
  ensureDir(dir);
  const file = path.join(dir, `${iv.id}.md`);
  const tags = (iv.tags || []).join(', ');
  const fm = [
    '---',
    `question: ${escapeFrontmatterValue(iv.question)}`,
    `category: ${iv.category}`,
    `difficulty: ${iv.difficulty || 'middle'}`,
    `tags: ${escapeFrontmatterValue(tags)}`,
    `order: ${order}`,
    '---',
    '',
    td.turndown(iv.answer || ''),
  ].join('\n');
  fs.writeFileSync(file, fm + '\n', 'utf8');
}

const articles = getAllArticles();
const byCat = {};
articles.forEach((a) => {
  byCat[a.category] = byCat[a.category] || [];
  byCat[a.category].push(a);
});
for (const [catId, list] of Object.entries(byCat)) {
  list.forEach((a, i) => writeArticleFile(catId, a, i + 1));
}
console.log(`✅ 已写出 ${articles.length} 篇种子文章`);

const interviews = getInterviews();
interviews.forEach((iv, i) => writeInterviewFile(iv, i + 1));
console.log(`✅ 已写出 ${interviews.length} 道种子面试题`);

// ---------- 3. 扫描目录生成 manifest.json ----------
const found = [];
function walk(dir, base) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;
    const full = path.join(dir, entry.name);
    const rel = base ? path.join(base, entry.name) : entry.name;
    if (entry.isDirectory()) {
      walk(full, rel);
    } else if (/\.(md|html?)$/i.test(entry.name)) {
      found.push({ full, rel: rel.split(path.sep).join('/') });
    }
  }
}
walk(CONTENT_DIR, '');

const manifestCats = JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf8'));
const manifestArticles = [];
const manifestInterviews = [];

for (const { full, rel } of found) {
  if (rel === 'categories.json' || rel === 'manifest.json') continue;
  const raw = fs.readFileSync(full, 'utf8');
  const { data, body } = parseFrontmatter(raw);
  const isInterview =
    data.category === 'interviews' || typeof data.question === 'string';
  const type = rel.toLowerCase().endsWith('.html') ? 'html' : 'md';
  if (isInterview) {
    manifestInterviews.push({
      id: rel.replace(/\.(md|html?)$/i, ''),
      question: data.question || rel,
      category: data.category || (rel.split('/')[0] === 'interviews' ? 'interview' : rel.split('/')[0]),
      difficulty: data.difficulty || 'middle',
      tags: (data.tags || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      order: Number(data.order) || 999,
      file: rel,
      type,
    });
  } else {
    manifestArticles.push({
      id: rel.replace(/\.(md|html?)$/i, ''),
      title: data.title || rel,
      category: data.category || rel.split('/')[0],
      // 前端子模块：module=子模块 id（如 vue），subcat=roadmap(学习路线)/cases(项目案例)/general(通用)
      module: (data.module || '').trim(),
      subcat: (data.subcat || 'general').trim(),
      // 重要度/层级：基础(basic)/核心(core)/重点(key)/拓展(extend)，默认核心
      tier: (data.tier || 'core').trim(),
      // 难度/复杂度：简单(easy)/中等(medium)/复杂(complex)
      level: data.level || 'easy',
      readMinutes: Number(data.readMinutes) || 10,
      tags: (data.tags || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      // 前置知识：frontmatter 里写 prereq: id1, id2（前置文章的完整 id），
      // 知识图谱据此画“先学 → 后学”的依赖连线。
      prereq: (data.prereq || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      summary: data.summary || '',
      // 是否为「总览路线图」：详情页据此用时间轴渲染，普通章节用普通文章渲染
      timeline: data.timeline === 'true',
      order: Number(data.order) || 999,
      file: rel,
      type,
    });
  }
}

const manifest = {
  generatedAt: new Date().toISOString(),
  categories: manifestCats,
  articles: manifestArticles,
  interviews: manifestInterviews,
};
fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
console.log(
  `✅ 已生成 manifest.json：分类 ${manifest.categories.length} / 文章 ${manifest.articles.length} / 面试题 ${manifest.interviews.length}`
);
