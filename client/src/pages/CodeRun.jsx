import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Loader2, Trash2, FileCode, Code2 } from 'lucide-react';
import {
  buildJsSrcdoc,
  buildHtmlSrcdoc,
  runPython,
  langGroup,
} from '../lib/runner.js';

const LANGS = [
  { id: 'js', label: 'JavaScript', hint: '原生 ESM，import 自动走 esm.sh' },
  { id: 'py', label: 'Python', hint: 'Pyodide(WASM) 运行' },
  { id: 'html', label: 'HTML', hint: '直接渲染' },
];

const SAMPLES = {
  js: `// 欢迎使用在线运行（类似 LeetCode / 菜鸟教程）
console.log('Hello, LearnHub!');

const sum = (a, b) => a + b;
console.log('1 + 2 =', sum(1, 2));

// 支持 import：裸模块说明符会自动改为 esm.sh 地址
import _ from 'lodash';
console.log('shuffle:', _.shuffle([1, 2, 3, 4, 5]));

// 顶层 await 也可用
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
await wait(100);
console.log('done');
`,
  py: `# 欢迎使用在线运行（Python via Pyodide）
print("Hello, LearnHub!")

x = 42
print("x =", x)

for i in range(3):
    print("i =", i)

def fib(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a

print("fib(10) =", fib(10))
`,
  html: `<h1 style="font-family:system-ui">Hello LearnHub 👋</h1>
<p>这是一个可直接渲染的 HTML 片段。</p>
<button onclick="alert('点到了！')" style="padding:6px 12px;cursor:pointer">
  点我
</button>
`,
};

export default function CodeRun() {
  const [lang, setLang] = useState('js');
  const [code, setCode] = useState(SAMPLES.js);
  const [output, setOutput] = useState([]); // {level, text}
  const [running, setRunning] = useState(false);
  const [pyLoading, setPyLoading] = useState(false);
  const [execSrc, setExecSrc] = useState(''); // iframe srcDoc（JS 隐藏执行 / HTML 渲染）
  const iframeKey = useRef(0);
  const taRef = useRef(null);
  const gutterRef = useRef(null);

  // 切换语言时载入对应示例
  const switchLang = (id) => {
    setLang(id);
    setCode(SAMPLES[id]);
    setOutput([]);
    setExecSrc('');
  };

  const loadSample = () => {
    setCode(SAMPLES[lang]);
    setOutput([]);
  };

  const clearOutput = () => setOutput([]);

  const append = useCallback((level, text) => {
    setOutput((o) => [...o, { level, text }]);
  }, []);

  // JS 执行结果经 iframe postMessage 回传
  useEffect(() => {
    const handler = (e) => {
      const d = e.data;
      if (!d || d.source !== 'lh-run') return;
      append(d.level || 'log', d.text || '');
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [append]);

  const run = async () => {
    setOutput([]);
    setExecSrc('');
    setRunning(true);
    try {
      const g = langGroup(lang);
      if (g === 'py') {
        setPyLoading(true);
        const out = await runPython(code);
        setPyLoading(false);
        append('log', out);
      } else if (g === 'js') {
        iframeKey.current += 1;
        // 隐藏 iframe 执行，结果经 postMessage 回传；强制换 key 重新加载
        setExecSrc(buildJsSrcdoc(code));
      } else if (g === 'html') {
        iframeKey.current += 1;
        setExecSrc(buildHtmlSrcdoc(code));
      } else {
        append('error', `暂不支持的语言：${lang}`);
      }
    } catch (e) {
      append('error', e?.message || String(e));
    } finally {
      setRunning(false);
    }
  };

  // 行号 gutter 与编辑器滚动同步
  const onScroll = () => {
    if (gutterRef.current && taRef.current) {
      gutterRef.current.scrollTop = taRef.current.scrollTop;
    }
  };
  const lineCount = code.split('\n').length;

  const group = langGroup(lang);
  const isHtml = group === 'html';
  const showIframe = (group === 'js' || isHtml) && execSrc;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <header className="mb-4">
        <h1 className="text-2xl font-extrabold flex items-center gap-2">
          <Code2 size={22} className="text-brand-600" /> 在线运行
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          在浏览器里直接运行简单代码 —— 学一点、跑一点。JS 支持 <code className="px-1 rounded bg-card">import</code>（自动走 esm.sh），Python 由 Pyodide(WASM) 执行。
        </p>
      </header>

      {/* 语言切换 */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {LANGS.map((l) => (
          <button
            key={l.id}
            onClick={() => switchLang(l.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
              lang === l.id
                ? 'bg-brand-500 text-white border-brand-500'
                : 'bg-card text-text-secondary border-border hover:border-brand-300'
            }`}
          >
            {l.label}
          </button>
        ))}
        <span className="text-xs text-text-muted ml-1">{LANGS.find((l) => l.id === lang)?.hint}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 编辑器 */}
        <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary">
              <FileCode size={14} /> 编辑器
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={loadSample}
                className="text-xs px-2.5 py-1 rounded-lg border border-border text-text-secondary hover:border-brand-300"
              >
                载入示例
              </button>
              <button
                onClick={() => setCode('')}
                className="text-xs px-2.5 py-1 rounded-lg border border-border text-text-secondary hover:border-brand-300 inline-flex items-center gap-1"
              >
                <Trash2 size={12} /> 清空
              </button>
              <button
                onClick={run}
                disabled={running}
                className="text-xs px-3 py-1.5 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 disabled:opacity-60 inline-flex items-center gap-1.5"
              >
                {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                {running ? '运行中…' : '运行'}
              </button>
            </div>
          </div>
          <div className="flex flex-1 min-h-[360px] bg-[#0b1020] text-[#e2e8f0] font-mono text-[13px] leading-6">
            <div
              ref={gutterRef}
              aria-hidden="true"
              className="select-none text-right px-2 py-3 text-text-muted/60 overflow-hidden bg-[#0b1020] border-r border-white/5"
            >
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <textarea
              ref={taRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onScroll={onScroll}
              spellCheck={false}
              wrap="off"
              className="flex-1 resize-none bg-transparent outline-none px-3 py-3 text-[#e2e8f0] caret-brand-400 whitespace-pre tab-size-2"
              placeholder="在这里写代码…"
            />
          </div>
        </div>

        {/* 输出 */}
        <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col min-h-[360px]">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="text-xs font-medium text-text-secondary">输出</span>
            <button
              onClick={clearOutput}
              className="text-xs px-2.5 py-1 rounded-lg border border-border text-text-secondary hover:border-brand-300"
            >
              清空
            </button>
          </div>

          {isHtml && showIframe ? (
            <iframe
              title="HTML 运行结果"
              sandbox="allow-scripts"
              srcDoc={execSrc}
              className="flex-1 w-full bg-white"
            />
          ) : group === 'js' && showIframe ? (
            <>
              {/* JS 经隐藏 iframe 执行，结果在下方控制台；iframe 仅作运行时，不可见 */}
              <iframe
                title="JS 运行时"
                sandbox="allow-scripts"
                srcDoc={execSrc}
                className="absolute h-0 w-0 opacity-0 pointer-events-none"
                style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
              />
              <ConsolePanel output={output} loading={running} pyLoading={false} />
            </>
          ) : (
            <ConsolePanel output={output} loading={running} pyLoading={pyLoading} />
          )}
        </div>
      </div>

      {group === 'js' && (
        <p className="text-xs text-text-muted mt-3">
          提示：<code className="px-1 rounded bg-card">import x from 'vue'</code> 这类裸包会经 esm.sh 加载；相对路径 <code className="px-1 rounded bg-card">./x</code> 或本地文件（如 <code className="px-1 rounded bg-card">.vue</code>）无法在沙箱内解析。
        </p>
      )}
    </div>
  );
}

function ConsolePanel({ output, loading, pyLoading }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [output]);
  return (
    <pre
      ref={ref}
      className="flex-1 m-0 p-3 text-[13px] leading-6 font-mono whitespace-pre-wrap overflow-auto bg-[#0b1020] text-[#e2e8f0]"
    >
      {output.length === 0 ? (
        <span className="text-text-muted">{loading || pyLoading ? '运行中…' : '点击「运行」查看输出'}</span>
      ) : (
        output.map((o, i) => (
          <div
            key={i}
            className={
              o.level === 'error'
                ? 'text-red-400'
                : o.level === 'warn'
                ? 'text-amber-300'
                : o.level === 'info'
                ? 'text-sky-300'
                : 'text-[#e2e8f0]'
            }
          >
            {o.text}
          </div>
        ))
      )}
    </pre>
  );
}
