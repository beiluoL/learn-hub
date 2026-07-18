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

    // 代码块「复制」按钮：通过 DOM 注入（此组件用 innerHTML 渲染，按钮不参与 React 调和）
    container.querySelectorAll('pre').forEach((pre) => {
      if (pre.querySelector('.code-copy-btn')) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'code-copy-btn no-print';
      btn.textContent = '复制';
      btn.setAttribute('aria-label', '复制代码');
      Object.assign(btn.style, {
        position: 'absolute',
        top: '8px',
        right: '8px',
        zIndex: '5',
        fontSize: '12px',
        lineHeight: '1',
        padding: '4px 9px',
        borderRadius: '6px',
        border: '1px solid rgba(127,127,127,0.35)',
        background: 'rgba(127,127,127,0.14)',
        color: 'inherit',
        cursor: 'pointer',
        opacity: '0',
        transition: 'opacity .15s ease',
      });
      pre.style.position = 'relative';
      pre.appendChild(btn);
      const code = pre.querySelector('code');
      btn.addEventListener('click', () => {
        const text = (code ? code.textContent : pre.textContent) || '';
        const done = () => {
          btn.textContent = '已复制';
          setTimeout(() => (btn.textContent = '复制'), 1500);
        };
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
        } else {
          fallbackCopy(text, done);
        }
      });
      const show = () => (btn.style.opacity = '1');
      const hide = () => (btn.style.opacity = '0');
      pre.addEventListener('mouseenter', show);
      pre.addEventListener('mouseleave', hide);
      // 触屏无 hover：代码块聚焦时也显示
      pre.addEventListener('focusin', show);
      pre.tabIndex = -1;
    });

    function fallbackCopy(text, done) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        done();
      } catch {
        btn.textContent = '复制失败';
        setTimeout(() => (btn.textContent = '复制'), 1500);
      }
      document.body.removeChild(ta);
    }
  }, [html]);

  return (
    <div
      ref={ref}
      className={`article-content ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
