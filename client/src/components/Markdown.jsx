import { useEffect, useRef } from 'react';
import hljs from 'highlight.js';

// 渲染已消毒的 HTML（来自 content.js 的 marked 输出），
// 并在挂载后对代码块做语法高亮。
export default function Markdown({ html, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const container = ref.current;

    // 给 h2/h3 添加 id（用于 ToC 锚点定位）
    container.querySelectorAll('h2, h3').forEach((el, i) => {
      if (!el.id) {
        el.id =
          'h-' +
          i +
          '-' +
          el.textContent
            .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '')
            .slice(0, 20);
      }
    });

    // 代码块语法高亮
    container.querySelectorAll('pre code').forEach((block) => {
      try {
        hljs.highlightElement(block);
      } catch {
        /* 忽略个别无法高亮的片段 */
      }
    });
  }, [html]);

  return (
    <div
      ref={ref}
      className={`article-content ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
