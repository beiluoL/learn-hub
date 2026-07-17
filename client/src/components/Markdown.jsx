import { useEffect, useRef } from 'react';
import hljs from 'highlight.js/lib/core';

// 仅注册内容中实际用到的语言，避免引入 highlight.js 全量语言包（~940KB）
import bash from 'highlight.js/lib/languages/bash';
import css from 'highlight.js/lib/languages/css';
import django from 'highlight.js/lib/languages/django';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import http from 'highlight.js/lib/languages/http';
import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import lua from 'highlight.js/lib/languages/lua';
import markdown from 'highlight.js/lib/languages/markdown';
import nginx from 'highlight.js/lib/languages/nginx';
import properties from 'highlight.js/lib/languages/properties';
import protobuf from 'highlight.js/lib/languages/protobuf';
import python from 'highlight.js/lib/languages/python';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';
import plaintext from 'highlight.js/lib/languages/plaintext';

hljs.registerLanguage('bash', bash);
hljs.registerLanguage('css', css);
hljs.registerLanguage('django', django);
hljs.registerLanguage('dockerfile', dockerfile);
hljs.registerLanguage('http', http);
hljs.registerLanguage('java', java);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('lua', lua);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('nginx', nginx);
hljs.registerLanguage('properties', properties);
hljs.registerLanguage('protobuf', protobuf);
hljs.registerLanguage('python', python);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('plaintext', plaintext);

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
