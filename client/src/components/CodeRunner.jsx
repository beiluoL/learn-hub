import { useState } from 'react';
import { Play, Loader2, Terminal } from 'lucide-react';

// 在线运行代码片段：Python 用 Pyodide(WASM, CDN 懒加载)；JS 用沙箱 iframe；HTML 直接渲染。
// 不打包任何重型依赖，运行时按需从 CDN 取 Pyodide。

let pyodidePromise = null;
function loadPyodide() {
  if (pyodidePromise) return pyodidePromise;
  pyodidePromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js';
    s.onload = async () => {
      try {
        const py = await window.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/',
        });
        resolve(py);
      } catch (e) {
        reject(e);
      }
    };
    s.onerror = () => reject(new Error('Pyodide 脚本加载失败（需要联网）'));
    document.head.appendChild(s);
  });
  return pyodidePromise;
}

const PY_LANGS = ['python', 'py'];
const JS_LANGS = ['javascript', 'js', 'node'];
const HTML_LANGS = ['html', 'xml'];

function langGroup(lang) {
  const l = (lang || '').toLowerCase();
  if (PY_LANGS.includes(l)) return 'py';
  if (JS_LANGS.includes(l)) return 'js';
  if (HTML_LANGS.includes(l)) return 'html';
  return null;
}

export default function CodeRunner({ code = '', lang = '' }) {
  const group = langGroup(lang);
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [iframeSrc, setIframeSrc] = useState('');
  const [error, setError] = useState('');

  if (!group) return null; // 该语言不支持在线运行（如 java/sql），不显示按钮

  const run = async () => {
    setError('');
    setRunning(true);
    try {
      if (group === 'py') {
        setIframeSrc('');
        const py = await loadPyodide();
        let out = '';
        py.setStdout({ batched: (s) => (out += s + '\n') });
        py.setStderr({ batched: (s) => (out += s + '\n') });
        await py.runPythonAsync(code);
        setOutput(out || '(无输出)');
      } else if (group === 'js') {
        setOutput('');
        const safe = JSON.stringify(code);
        const srcdoc = `<!doctype html><html><head><style>body{font:13px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;padding:10px;background:#0b1020;color:#e2e8f0;margin:0;white-space:pre-wrap}</style></head><body><pre id="o"></pre><script>var o=document.getElementById('o');console.log=function(){for(var i=0;i<arguments.length;i++){var x=arguments[i];try{o.textContent+=(typeof x==='object'?JSON.stringify(x):String(x));}catch(e){o.textContent+=String(x);}o.textContent+=' ';}o.textContent+='\\n';};try{eval(${safe});}catch(e){o.textContent+='Error: '+e.message;}<\/script></body></html>`;
        setIframeSrc(srcdoc);
      } else {
        setOutput('');
        setIframeSrc(code);
      }
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setRunning(false);
    }
  };

  const badge = group === 'py' ? 'Python' : group === 'js' ? 'JavaScript' : 'HTML';

  return (
    <div className="my-3 rounded-xl border border-border bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-card border-b border-border">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary">
          <Terminal size={14} /> 在线运行 · {badge}
        </span>
        <button
          onClick={run}
          disabled={running}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-semibold hover:bg-brand-600 disabled:opacity-60"
        >
          {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          {running ? '运行中…' : '运行'}
        </button>
      </div>
      {group === 'html' && iframeSrc ? (
        <iframe
          title="运行结果"
          sandbox="allow-scripts"
          srcDoc={iframeSrc}
          className="w-full h-64 bg-white"
        />
      ) : group === 'js' && iframeSrc ? (
        <iframe
          title="运行结果"
          sandbox="allow-scripts"
          srcDoc={iframeSrc}
          className="w-full h-48 bg-[#0b1020]"
        />
      ) : (
        <pre className="text-sm text-text-primary px-3 py-2.5 whitespace-pre-wrap max-h-64 overflow-auto">
          {error ? `⚠️ ${error}` : output || '点击「运行」查看输出'}
        </pre>
      )}
    </div>
  );
}
