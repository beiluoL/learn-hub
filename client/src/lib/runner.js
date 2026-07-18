// 在线运行共享逻辑：文章内联运行器(CodeRunner) 与 独立在线运行页(CodeRun) 复用。
// - JS：原生 <script type="module"> 在沙箱 iframe 中执行；裸模块说明符自动改写为 esm.sh。
// - Python：Pyodide(WASM, CDN 懒加载)。
// - HTML：直接渲染到 iframe。
// 不打包任何重型依赖，运行时按需从 CDN 取 Pyodide / esm.sh。

const ESM_CDN = 'https://esm.sh/';

// 把裸模块说明符（import ... from 'vue' / export ... from 'lodash' / import('react')）
// 改写为 esm.sh 完整地址，使浏览器原生 ESM 能解析（无需打包器或 import map）。
// 相对("./x")、绝对("/x")、带协议("https://x")、data: 的说明符保持原样。
export function rewriteBareImports(code) {
  if (typeof code !== 'string') return code;
  return code.replace(
    /((?:from\s*|import\s*\(\s*|import\s+(?=['"])|export\s+[^'"]*\s*from\s*))(['"])([^'"]+)\2/g,
    (m, prefix, q, spec) => {
      if (/^[\.\/]|^[a-z][a-z0-9+.-]*:\/\//i.test(spec) || spec.startsWith('data:')) return m;
      return `${prefix}${q}${ESM_CDN}${spec}${q}`;
    }
  );
}

// 转义 </script> 防注入（避免用户代码提前闭合脚本块）
function escapeScriptTags(s) {
  return s.replace(/<\/(script)/gi, '<\\/$1');
}

// 构建 JS 沙箱 srcdoc：
// - classic 脚本覆盖 console.* 并把每行输出写进 <pre id="o">（供内联运行器直接展示），
//   同时通过 parent.postMessage 透传给父窗口（供独立页面在控制台面板展示）。
// - module 脚本放用户代码（支持 import / 顶层 await），解析/运行错误由 window error 事件兜底上报。
export function buildJsSrcdoc(code) {
  const rewritten = rewriteBareImports(escapeScriptTags(String(code || '')));
  return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#0b1020;color:#e2e8f0;font:13px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap}pre{margin:0;padding:10px}</style></head><body><pre id="o"></pre><script>
(function(){
  var o=document.getElementById('o');
  function fmt(a){try{return typeof a==='string'?a:JSON.stringify(a,null,2);}catch(e){return String(a);}}
  function emit(level,args){
    var parts=Array.prototype.slice.call(args).map(fmt);
    var text=parts.join(' ');
    if(o) o.textContent+=(o.textContent?'\\n':'')+text;
    try{parent.postMessage({source:'lh-run',level:level,text:text},'*');}catch(e){}
  }
  ['log','info','warn','error','debug'].forEach(function(m){
    var orig=console[m]?console[m].bind(console):function(){};
    console[m]=function(){emit(m,arguments);orig.apply(null,arguments);};
  });
  window.addEventListener('error',function(e){emit('error',['Error: '+(e.message||(e.error&&e.error.message)||e.error||e)]);});
  window.addEventListener('unhandledrejection',function(e){emit('error',['Unhandled rejection: '+((e.reason&&e.reason.message)||e.reason||e)]);});
})();
<\/script><script type="module">
${rewritten}
<\/script></body></html>`;
}

// HTML 直接渲染（用户代码即文档内容）
export function buildHtmlSrcdoc(code) {
  return String(code || '');
}

// ---------- Python via Pyodide ----------
let pyodidePromise = null;
export function getPyodide() {
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

export async function runPython(code) {
  const py = await getPyodide();
  let out = '';
  py.setStdout({ batched: (s) => (out += s + '\n') });
  py.setStderr({ batched: (s) => (out += s + '\n') });
  await py.runPythonAsync(String(code || ''));
  return out || '(无输出)';
}

// 语言 -> 运行分组
export function langGroup(lang) {
  const l = (lang || '').toLowerCase();
  if (['python', 'py'].includes(l)) return 'py';
  if (['javascript', 'js', 'node'].includes(l)) return 'js';
  if (['html', 'xml'].includes(l)) return 'html';
  return null;
}
