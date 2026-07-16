// 数据聚合层：把各分类内容汇总为统一结构，供 API 使用。
import { javaArticles } from './java.js';
import { pythonArticles } from './python.js';
import { frontendArticles } from './frontend.js';
import { aiArticles } from './ai.js';
import { interviews } from './interviews.js';

// 分类定义（含图标与主题色，供前端展示）
export const categories = [
  {
    id: 'java',
    name: 'Java 学习',
    icon: '☕',
    color: '#f89820',
    desc: '从基础语法到 JVM、并发编程，系统掌握 Java 生态。',
  },
  {
    id: 'python',
    name: 'Python 学习',
    icon: '🐍',
    color: '#3776ab',
    desc: '语法简洁、生态丰富，覆盖脚本、数据、异步与 Web 开发。',
  },
  {
    id: 'frontend',
    name: '前端学习',
    icon: '🎨',
    color: '#61dafb',
    desc: 'HTML/CSS/JS 核心，框架工程化与现代前端体系。',
  },
  {
    id: 'ai',
    name: 'AI 应用开发',
    icon: '🤖',
    color: '#7c5cff',
    desc: 'LLM、RAG、Agent、向量库与推理部署的完整链路。',
  },
  {
    id: 'interview',
    name: '面试题',
    icon: '💡',
    color: '#22c55e',
    desc: '近期高频面试题与答案要点，覆盖主流方向。',
  },
];

// 文章（不含面试题），每个分类一组
const articleMap = {
  java: javaArticles,
  python: pythonArticles,
  frontend: frontendArticles,
  ai: aiArticles,
};

// 统一扁平化文章列表，带 category 字段
export function getAllArticles() {
  const result = [];
  for (const [catId, list] of Object.entries(articleMap)) {
    for (const a of list) {
      result.push({ ...a, category: catId });
    }
  }
  return result;
}

export function getArticlesByCategory(catId) {
  return getAllArticles().filter((a) => a.category === catId);
}

export function getArticleById(id) {
  return getAllArticles().find((a) => a.id === id) || null;
}

export function getInterviews() {
  return interviews;
}

export function getInterviewsByCategory(catId) {
  if (!catId || catId === 'all') return interviews;
  return interviews.filter((i) => i.category === catId);
}

// 简单全文搜索：标题 + 摘要 + 标签 + 正文
export function search(query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return { articles: [], interviews: [] };
  const articles = getAllArticles().filter((a) => {
    const hay = [a.title, a.summary, (a.tags || []).join(' '), a.content]
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });
  const matchedInterviews = interviews.filter((i) => {
    const hay = [i.question, i.answer, (i.tags || []).join(' ')]
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });
  return { articles, interviews: matchedInterviews };
}

// 首页统计信息
export function getStats() {
  return {
    categories: categories.length,
    articles: getAllArticles().length,
    interviews: interviews.length,
  };
}
