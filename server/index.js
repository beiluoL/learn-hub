import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import {
  categories,
  getAllArticles,
  getArticlesByCategory,
  getArticleById,
  getInterviews,
  getInterviewsByCategory,
  search,
  getStats,
} from './data/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ---------- API ----------
const api = express.Router();

api.get('/stats', (req, res) => res.json(getStats()));

api.get('/categories', (req, res) => {
  const withCounts = categories.map((c) => {
    if (c.id === 'interview') {
      return { ...c, count: getInterviews().length };
    }
    return { ...c, count: getArticlesByCategory(c.id).length };
  });
  res.json(withCounts);
});

// 文章（可按 ?category= 过滤）
api.get('/articles', (req, res) => {
  const { category } = req.query;
  res.json(category ? getArticlesByCategory(category) : getAllArticles());
});

api.get('/articles/:id', (req, res) => {
  const article = getArticleById(req.params.id);
  if (!article) return res.status(404).json({ error: '文章不存在' });
  res.json(article);
});

// 面试题（可按 ?category= 过滤；all 或空返回全部）
api.get('/interviews', (req, res) => {
  const { category } = req.query;
  res.json(getInterviewsByCategory(category));
});

// 搜索：?q=
api.get('/search', (req, res) => {
  const q = req.query.q || '';
  const result = search(q);
  res.json({
    query: q,
    total: result.articles.length + result.interviews.length,
    ...result,
  });
});

app.use('/api', api);

// ---------- 静态前端（生产构建产物） ----------
const clientDist = path.resolve(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // SPA 兜底：非 /api 的请求都返回 index.html
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res
      .status(200)
      .send(
        '<h1>LearnHub API 已启动</h1><p>前端尚未构建。请先 <code>npm run build</code> 构建 client，再访问站点。</p><p>API 示例：<a href="/api/categories">/api/categories</a></p>'
      );
  });
}

app.listen(PORT, () => {
  console.log(`✅ LearnHub 服务已启动: http://localhost:${PORT}`);
  console.log(`   API 前缀: /api`);
  if (!fs.existsSync(clientDist)) {
    console.log('⚠️  未检测到 client/dist，当前仅提供 API。');
  }
});
