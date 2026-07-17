import { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Check, Circle, Sparkles } from 'lucide-react';
import Markdown from './Markdown.jsx';

// 把一段 markdown 渲染为已消毒 HTML（仅用于时间轴里的「其他说明」文本块，
// 与 content.js 的渲染策略保持一致）。
function md2html(md) {
  const html = marked.parse(md || '', { gfm: true, breaks: false });
  return DOMPurify.sanitize(html, {
    ADD_ATTR: ['target', 'rel'],
    FORBID_TAGS: ['style', 'iframe', 'form', 'input', 'button'],
  });
}

// 解析学习路线 markdown：
// 前置段落（首个 ## 之前）作为 intro；
// 每个 ## 段落是一个阶段：标题（可能含「N. 」前缀）、勾选清单、其余说明。
function parseRoadmap(md) {
  if (!md) return { intro: '', sections: [] };
  const raw = String(md).replace(/^---[\s\S]*?---/, '').trim();
  const parts = raw.split(/^##\s+/m);
  const intro = (parts.shift() || '').trim();
  const sections = parts
    .map((p) => {
      const nl = p.indexOf('\n');
      const title = (nl === -1 ? p : p.slice(0, nl)).trim();
      const rest = nl === -1 ? '' : p.slice(nl + 1);
      const items = [];
      const otherLines = [];
      rest.split('\n').forEach((line) => {
        const cb = line.match(/^\s*-\s*\[([ xX])\]\s+(.*)$/);
        if (cb) {
          items.push({ done: cb[1].toLowerCase() === 'x', text: cb[2].trim() });
        } else if (line.trim() !== '') {
          otherLines.push(line);
        }
      });
      return { title, items, other: otherLines.join('\n').trim() };
    })
    .filter((s) => s.title);
  return { intro, sections };
}

export default function Timeline({ markdown }) {
  const { intro, sections } = useMemo(() => parseRoadmap(markdown), [markdown]);

  return (
    <div>
      {intro && (
        <div className="article-content mb-8 text-text-secondary leading-relaxed">
          <Markdown html={md2html(intro)} />
        </div>
      )}

      <ol className="relative">
        {/* 竖向时间线 */}
        <span
          aria-hidden="true"
          className="absolute left-4 top-3 bottom-3 w-0.5 bg-gradient-to-b from-brand-300 via-brand-200 to-brand-100"
        />
        {sections.map((s, i) => {
          const num = s.title.match(/^(\d+)\.\s*(.*)$/);
          const stageNum = num ? num[1] : null;
          const stageName = num ? num[2] : s.title;
          return (
            <li key={i} className="relative pl-12 pb-8 last:pb-0">
              {/* 节点徽标 */}
              <span className="absolute left-0 top-0 w-8 h-8 rounded-full grid place-items-center bg-brand-500 text-white text-sm font-bold shadow-soft ring-4 ring-white dark:ring-slate-900">
                {stageNum ?? <Sparkles size={16} />}
              </span>

              <div className="bg-card border border-border rounded-2xl p-5 shadow-card">
                <h3 className="font-bold text-text-primary text-lg flex items-center gap-2">
                  {stageNum && (
                    <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                      阶段 {stageNum}
                    </span>
                  )}
                  {stageName}
                </h3>

                {s.items.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {s.items.map((it, j) => (
                      <li
                        key={j}
                        className="flex items-start gap-2 text-sm text-text-secondary"
                      >
                        {it.done ? (
                          <Check size={16} className="mt-0.5 text-green-500 shrink-0" />
                        ) : (
                          <Circle size={16} className="mt-0.5 text-text-muted shrink-0" />
                        )}
                        <span className={it.done ? 'line-through text-text-muted' : ''}>
                          {it.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {s.other && (
                  <div className="mt-3 article-content text-sm text-text-secondary">
                    <Markdown html={md2html(s.other)} />
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
