import { useState } from 'react';
import { Play, Loader2, Terminal } from 'lucide-react';
import { buildJsSrcdoc, buildHtmlSrcdoc, runPython, langGroup } from '../lib/runner.js';

// 文章内联「在线运行」按钮：复用 lib/runner.js 的执行逻辑。
// JS 用沙箱 iframe（原生 module + esm.sh 裸 import 改写）；Python 用 Pyodide；HTML 直接渲染。

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
        const out = await runPython(code);
        setOutput(out);
      } else if (group === 'js') {
        setOutput('');
        // 沙箱 iframe 内用原生 module 执行；控制台输出渲染在 iframe 内 <pre>，
        // 裸 import 已改写为 esm.sh 完整地址，故 'vue' 等可解析。
        setIframeSrc(buildJsSrcdoc(code));
      } else {
        setOutput('');
        setIframeSrc(buildHtmlSrcdoc(code));
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
