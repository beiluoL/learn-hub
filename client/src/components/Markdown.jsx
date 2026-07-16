import { useEffect, useRef } from 'react';
import hljs from 'highlight.js';

// 渲染已消毒的 HTML（来自 content.js 的 marked 输出），
// 并在挂载后对代码块做语法高亮。
export default function Markdown({ html, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.querySelectorAll('pre code').forEach((block) => {
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
