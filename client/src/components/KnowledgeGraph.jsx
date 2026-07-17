import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Share2 } from 'lucide-react';
import { content } from '../content.js';

const CAT_COLORS = {
  java: '#F59E0B',
  python: '#3B6FE0',
  frontend: '#10B981',
  ai: '#8B5CF6',
  system: '#EF4444',
  interview: '#06B6D4',
};
const CAT_NAMES = {
  java: 'Java',
  python: 'Python',
  frontend: '前端',
  ai: 'AI',
  system: '基础',
  interview: '面试题',
};

// 难度着色：文章 level 与面试题 difficulty 统一映射到三档
const LEVEL_COLORS = { beginner: '#10B981', intermediate: '#F59E0B', advanced: '#EF4444' };
const LEVEL_NAMES = { beginner: '入门 / 简单', intermediate: '进阶 / 中等', advanced: '高级 / 困难' };
const DIFF_TO_LEVEL = { easy: 'beginner', middle: 'intermediate', hard: 'advanced' };

// 力导向知识图谱（类 Obsidian）：节点=文章/面试题，边=学习链路 + 共享标签 + 前置依赖。
export default function KnowledgeGraph() {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const [cats, setCats] = useState([]);
  const [filter, setFilter] = useState(null);
  const [colorMode, setColorMode] = useState('category'); // 'category' | 'difficulty'
  const sim = useRef(null);
  const filterRef = useRef(null);
  const colorModeRef = useRef('category');
  const focusRef = useRef(null);
  const [focusedId, setFocusedId] = useState(null);

  // 键盘聚焦节点：同步 ref 并把视图平移到该节点居中
  function setFocus(id) {
    focusRef.current = id;
    setFocusedId(id);
    const s = sim.current;
    if (s && id) {
      const n = s.nodes.find((x) => x.id === id);
      if (n) {
        s.view.tx = -n.x * s.view.scale;
        s.view.ty = -n.y * s.view.scale;
      }
    }
    if (s) ensureLoop();
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      const [arts, ivs] = await Promise.all([content.articles(), content.interviews()]);
      if (!alive) return;

      const nodes = [];
      const idMap = new Map();
      const add = (item, type) => {
        if (idMap.has(item.id)) return;
        const levelBucket =
          type === 'article'
            ? item.level || 'beginner'
            : DIFF_TO_LEVEL[item.difficulty] || 'intermediate';
        const node = {
          id: item.id,
          title: item.title || item.question,
          category: item.category || 'interview',
          type,
          levelBucket,
          tags: item.tags || [],
          prereq: item.prereq || [],
          order: item.order || 0,
          x: (Math.random() - 0.5) * 320,
          y: (Math.random() - 0.5) * 320,
          vx: 0,
          vy: 0,
          fx: null,
          fy: null,
        };
        nodes.push(node);
        idMap.set(item.id, node);
      };
      arts.forEach((a) => add(a, 'article'));
      ivs.forEach((i) => add(i, 'interview'));

      // 边：同分类按 order 连成学习链路
      const byCat = {};
      nodes.forEach((n) => {
        (byCat[n.category] = byCat[n.category] || []).push(n);
      });
      const links = [];
      const seen = new Set();
      const addLink = (sId, tId, kind, w) => {
        if (sId === tId) return;
        // prereq 是有方向的，用带方向 + kind 的 key，避免与无向的 chain/tag 冲突
        const key =
          kind === 'prereq'
            ? `prereq:${sId}->${tId}`
            : sId < tId
            ? `${sId}|${tId}`
            : `${tId}|${sId}`;
        if (seen.has(key)) return;
        seen.add(key);
        links.push({ source: idMap.get(sId), target: idMap.get(tId), kind, w });
      };
      Object.values(byCat).forEach((arr) => {
        arr.sort((a, b) => a.order - b.order);
        for (let i = 0; i < arr.length - 1; i++) addLink(arr[i].id, arr[i + 1].id, 'chain', 2);
      });

      // 边：前置依赖（prereq）——有方向：先学(prereq) → 后学(本文)
      nodes.forEach((n) => {
        (n.prereq || []).forEach((pid) => {
          if (idMap.has(pid)) addLink(pid, n.id, 'prereq', 3);
        });
      });

      // 边：文章之间共享标签（每篇文章最多取关联最强的 3 个，避免变成毛线团）
      const articles = nodes.filter((n) => n.type === 'article');
      articles.forEach((a) => {
        const cand = articles
          .filter((b) => b.id !== a.id)
          .map((b) => ({ b, shared: a.tags.filter((t) => b.tags.includes(t)).length }))
          .filter((c) => c.shared > 0)
          .sort((x, y) => y.shared - x.shared)
          .slice(0, 3);
        cand.forEach((c) => addLink(a.id, c.b.id, 'tag', c.shared));
      });

      // 邻接表（用于悬停高亮）
      const adj = new Map();
      nodes.forEach((n) => adj.set(n.id, new Set()));
      links.forEach((l) => {
        adj.get(l.source.id).add(l.target.id);
        adj.get(l.target.id).add(l.source.id);
      });

      sim.current = {
        nodes,
        links,
        adj,
        view: { scale: 1, tx: 0, ty: 0 },
        hover: null,
        drag: null,
        pan: null,
        moved: false,
        alpha: 1,
        running: false,
        raf: 0,
        touchState: null,
      };

      setCats([...new Set(nodes.map((n) => n.category))]);
      ensureLoop();
    })();

    return () => {
      alive = false;
      if (sim.current?.raf) cancelAnimationFrame(sim.current.raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // filter / colorMode 变化：更新 ref 并重绘
  useEffect(() => {
    filterRef.current = filter;
    if (sim.current) ensureLoop();
  }, [filter]);
  useEffect(() => {
    colorModeRef.current = colorMode;
    if (sim.current) ensureLoop();
  }, [colorMode]);

  function nodeColor(n) {
    if (colorModeRef.current === 'difficulty') return LEVEL_COLORS[n.levelBucket] || '#94a3b8';
    return CAT_COLORS[n.category] || '#7c3aed';
  }

  function ensureLoop() {
    const s = sim.current;
    if (!s || s.running) return;
    s.running = true;
    s.raf = requestAnimationFrame(tick);
  }

  function tick() {
    const s = sim.current;
    if (!s) return;
    if (s.alpha > 0.005) {
      const ns = s.nodes;
      // 斥力（所有节点两两）
      for (let i = 0; i < ns.length; i++) {
        for (let j = i + 1; j < ns.length; j++) {
          const a = ns[i];
          const b = ns[j];
          let dx = a.x - b.x;
          let dy = a.y - b.y;
          let d2 = dx * dx + dy * dy;
          if (d2 < 0.01) {
            dx = (Math.random() - 0.5) * 0.1;
            dy = (Math.random() - 0.5) * 0.1;
            d2 = dx * dx + dy * dy + 0.01;
          }
          const d = Math.sqrt(d2);
          const f = 5200 / d2;
          const fx = (dx / d) * f;
          const fy = (dy / d) * f;
          a.vx += fx;
          a.vy += fy;
          b.vx -= fx;
          b.vy -= fy;
        }
      }
      // 弹簧（边）
      s.links.forEach((l) => {
        const a = l.source;
        const b = l.target;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const L = l.kind === 'chain' ? 120 : l.kind === 'prereq' ? 130 : 160;
        const k = l.kind === 'chain' ? 1.4 : l.kind === 'prereq' ? 1.2 : 1;
        const f = (d - L) * 0.02 * k;
        const fx = (dx / d) * f;
        const fy = (dy / d) * f;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      });
      // 向心 + 积分
      ns.forEach((n) => {
        if (n.fx != null) {
          n.x = n.fx;
          n.y = n.fy;
          n.vx = 0;
          n.vy = 0;
          return;
        }
        n.vx += -n.x * 0.006;
        n.vy += -n.y * 0.006;
        n.vx *= 0.86;
        n.vy *= 0.86;
        n.x += n.vx;
        n.y += n.vy;
      });
      s.alpha *= 0.985;
    }

    draw();

    if (s.alpha > 0.005 || s.drag || s.hover || s.pan) {
      s.raf = requestAnimationFrame(tick);
    } else {
      s.running = false;
    }
  }

  function draw() {
    const s = sim.current;
    const cv = canvasRef.current;
    const wrap = wrapRef.current;
    if (!s || !cv || !wrap) return;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      cv.style.width = w + 'px';
      cv.style.height = h + 'px';
    }
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2 + s.view.tx;
    const cy = h / 2 + s.view.ty;
    const sc = s.view.scale;
    const toScreen = (n) => ({ x: cx + n.x * sc, y: cy + n.y * sc });
    const active = filterRef.current;
    const visible = (n) => !active || n.category === active;
    const hover = s.hover;
    const focus = focusRef.current;
    const activeId = hover || focus;
    const neighbors = activeId ? s.adj.get(activeId) : null;

    // 边
    s.links.forEach((l) => {
      if (!visible(l.source) || !visible(l.target)) return;
      const a = toScreen(l.source);
      const b = toScreen(l.target);
      const isPrereq = l.kind === 'prereq';
      let alpha = isPrereq ? 0.5 : 0.16;
      let color = isPrereq ? '#F59E0B' : '#8B5CF6';
      let width = isPrereq ? 1.6 : 1;
      const related = activeId && (l.source.id === activeId || l.target.id === activeId);
      if (activeId) {
        if (related) {
          alpha = 0.95;
          color = isPrereq ? '#D97706' : nodeColor(l.source);
          width = isPrereq ? 2.2 : 1.8;
        } else {
          alpha = 0.04;
        }
      }
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      // prereq 画箭头（指向"后学"的节点）
      if (isPrereq && (!hover || related)) {
        const ang = Math.atan2(b.y - a.y, b.x - a.x);
        const r = (l.target.type === 'interview' ? 7 : 9) * sc + 3;
        const tipX = b.x - Math.cos(ang) * r;
        const tipY = b.y - Math.sin(ang) * r;
        const ah = 7;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.lineTo(tipX - Math.cos(ang - 0.4) * ah, tipY - Math.sin(ang - 0.4) * ah);
        ctx.lineTo(tipX - Math.cos(ang + 0.4) * ah, tipY - Math.sin(ang + 0.4) * ah);
        ctx.closePath();
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;

    // 节点
    s.nodes.forEach((n) => {
      if (!visible(n)) return;
      const p = toScreen(n);
      const r = n.type === 'interview' ? 7 : 9;
      let alpha = 1;
      if (activeId && activeId !== n.id && !(neighbors && neighbors.has(n.id))) alpha = 0.22;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = nodeColor(n);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      // 键盘聚焦节点：品牌色外环
      if (focus === n.id) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, r + 4, 0, Math.PI * 2);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#3B6FE0';
        ctx.stroke();
      }
      // 标签
      if (!activeId || activeId === n.id || (neighbors && neighbors.has(n.id))) {
        ctx.globalAlpha = alpha;
        ctx.font = '11px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#1A1F2E';
        ctx.textAlign = 'center';
        ctx.fillText(n.title, p.x, p.y + r + 12);
      }
    });
    ctx.globalAlpha = 1;
  }

  function hit(mx, my) {
    const s = sim.current;
    const wrap = wrapRef.current;
    if (!s || !wrap) return null;
    const cx = wrap.clientWidth / 2 + s.view.tx;
    const cy = wrap.clientHeight / 2 + s.view.ty;
    const sc = s.view.scale;
    const wx = (mx - cx) / sc;
    const wy = (my - cy) / sc;
    let best = null;
    let bd = Infinity;
    s.nodes.forEach((n) => {
      if (filterRef.current && n.category !== filterRef.current) return;
      const r = (n.type === 'interview' ? 7 : 9) + 6;
      const d = Math.hypot(n.x - wx, n.y - wy);
      if (d < r && d < bd) {
        bd = d;
        best = n;
      }
    });
    return best;
  }

  function onPointerDown(e) {
    const s = sim.current;
    if (!s) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const n = hit(mx, my);
    if (n) {
      s.drag = n;
      n.fx = n.x;
      n.fy = n.y;
      s.moved = false;
      s.alpha = Math.max(s.alpha, 0.2);
      canvasRef.current.setPointerCapture?.(e.pointerId);
    } else {
      s.pan = { x: mx, y: my, tx: s.view.tx, ty: s.view.ty };
    }
    ensureLoop();
  }

  function onPointerMove(e) {
    const s = sim.current;
    if (!s) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    if (s.drag) {
      const cx = rect.width / 2 + s.view.tx;
      const cy = rect.height / 2 + s.view.ty;
      s.drag.fx = (mx - cx) / s.view.scale;
      s.drag.fy = (my - cy) / s.view.scale;
      s.moved = true;
      s.alpha = Math.max(s.alpha, 0.15);
      ensureLoop();
      return;
    }
    if (s.pan) {
      s.view.tx = s.pan.tx + (mx - s.pan.x);
      s.view.ty = s.pan.ty + (my - s.pan.y);
      draw();
      return;
    }
    const n = hit(mx, my);
    const id = n ? n.id : null;
    if (id !== s.hover) {
      s.hover = id;
      canvasRef.current.style.cursor = id ? 'pointer' : 'grab';
      ensureLoop();
    }
  }

  function onPointerUp() {
    const s = sim.current;
    if (!s) return;
    if (s.drag) {
      const wasClick = !s.moved;
      const n = s.drag;
      n.fx = null;
      n.fy = null;
      s.drag = null;
      if (wasClick) {
        setFocus(n.id);
        navigate(n.type === 'article' ? `/article/${n.id}` : `/interview/${n.id}`);
      }
    }
    if (s.pan) s.pan = null;
    ensureLoop();
  }

  function onPointerLeave() {
    const s = sim.current;
    if (!s) return;
    if (s.hover) {
      s.hover = null;
      ensureLoop();
    }
  }

  // 键盘可访问：方向键浏览节点，回车/空格打开，Esc 取消聚焦
  function onKeyDown(e) {
    const s = sim.current;
    if (!s || s.nodes.length === 0) return;
    const nodes = s.nodes;
    const cur = focusRef.current;
    let idx = nodes.findIndex((n) => n.id === cur);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      idx = idx < 0 ? 0 : (idx + 1) % nodes.length;
      setFocus(nodes[idx].id);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      idx = idx <= 0 ? nodes.length - 1 : idx - 1;
      setFocus(nodes[idx].id);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const target = cur || (nodes[0] && nodes[0].id);
      const n = nodes.find((x) => x.id === target);
      if (n) navigate(n.type === 'article' ? `/article/${n.id}` : `/interview/${n.id}`);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setFocus(null);
    }
  }

  function onWheel(e) {
    e.preventDefault();
    const s = sim.current;
    if (!s) return;
    const factor = e.deltaY < 0 ? 1.12 : 0.89;
    s.view.scale = Math.min(3, Math.max(0.3, s.view.scale * factor));
    draw();
  }

  function onTouchStart(e) {
    const s = sim.current;
    if (!s) return;
    e.preventDefault();
    const touches = e.touches;
    const rect = canvasRef.current.getBoundingClientRect();
    if (touches.length === 1) {
      s.touchState = {
        type: 'pan',
        x: touches[0].clientX - rect.left,
        y: touches[0].clientY - rect.top,
        tx: s.view.tx,
        ty: s.view.ty,
      };
    } else if (touches.length === 2) {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      s.touchState = {
        type: 'pinch',
        dist,
        scale: s.view.scale,
        tx: s.view.tx,
        ty: s.view.ty,
        cx: (touches[0].clientX + touches[1].clientX) / 2 - rect.left,
        cy: (touches[0].clientY + touches[1].clientY) / 2 - rect.top,
      };
    }
    ensureLoop();
  }

  function onTouchMove(e) {
    const s = sim.current;
    if (!s) return;
    e.preventDefault();
    const touches = e.touches;
    const ts = s.touchState;
    if (!ts) return;
    const rect = canvasRef.current.getBoundingClientRect();

    if (touches.length === 1 && ts.type === 'pan') {
      const mx = touches[0].clientX - rect.left;
      const my = touches[0].clientY - rect.top;
      s.view.tx = ts.tx + (mx - ts.x);
      s.view.ty = ts.ty + (my - ts.y);
      draw();
      return;
    }

    if (touches.length === 2) {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const mx = (touches[0].clientX + touches[1].clientX) / 2 - rect.left;
      const my = (touches[0].clientY + touches[1].clientY) / 2 - rect.top;

      if (ts.type === 'pinch' && Math.abs(dist - ts.dist) > 5) {
        const ratio = dist / ts.dist;
        s.view.scale = Math.min(3, Math.max(0.3, ts.scale * ratio));
      }

      s.view.tx = ts.tx + (mx - ts.cx);
      s.view.ty = ts.ty + (my - ts.cy);
      draw();
    }
  }

  function onTouchEnd(e) {
    const s = sim.current;
    if (!s) return;
    s.touchState = null;
    if (e.touches.length === 0) ensureLoop();
  }

  const byDifficulty = colorMode === 'difficulty';

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 p-5 border-b border-border">
        <div className="flex items-center gap-2">
          <Share2 size={20} className="text-brand-500" />
          <h2 className="text-lg font-extrabold text-text-primary">学习知识点地图</h2>
        </div>
        <span className="text-xs text-text-muted">
          拖动节点 · 滚轮缩放 · 拖空白平移 · 悬停高亮关联 · 点击打开
        </span>

        {/* 按难度着色开关 */}
        <button
          onClick={() => setColorMode(byDifficulty ? 'category' : 'difficulty')}
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border transition ${
            byDifficulty
              ? 'bg-brand-600 text-white border-transparent'
              : 'bg-card text-text-secondary border-border hover:border-brand-300'
          }`}
          title="切换节点着色方式"
        >
          <span
            className="w-6 h-3.5 rounded-full relative transition"
            style={{ background: byDifficulty ? '#F59E0B' : '#cbd5e1' }}
          >
            <span
              className="absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all"
              style={{ left: byDifficulty ? '0.85rem' : '0.15rem' }}
            />
          </span>
          按难度着色
        </button>

        <div className="flex flex-wrap gap-1.5 ml-auto">
          {/* 桌面端：分类筛选按钮 */}
          <div className="hidden sm:flex flex-wrap gap-1.5">
            <FilterChip active={filter === null} color="#8B5CF6" label="全部" onClick={() => setFilter(null)} />
            {cats.map((c) => (
              <FilterChip
                key={c}
                active={filter === c}
                color={CAT_COLORS[c] || '#7c3aed'}
                label={CAT_NAMES[c] || c}
                onClick={() => setFilter(filter === c ? null : c)}
              />
            ))}
          </div>
          {/* 移动端：下拉选择 */}
          <select
            className="sm:hidden text-xs bg-card border border-border rounded-lg px-2 py-1.5 text-text-secondary"
            value={filter || ''}
            onChange={(e) => setFilter(e.target.value || null)}
          >
            <option value="">全部方向</option>
            {cats.map((c) => (
              <option key={c} value={c}>{CAT_NAMES[c] || c}</option>
            ))}
          </select>
        </div>
      </div>

      <div ref={wrapRef} className="relative h-[min(540px,60vh)] bg-surface">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 touch-none outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-lg"
          style={{ cursor: 'grab' }}
          tabIndex={0}
          role="application"
          aria-label="学习知识点地图，使用方向键浏览节点，回车或空格打开对应内容"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerLeave}
          onWheel={onWheel}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onKeyDown={onKeyDown}
        />
        {/* 难度着色图例 */}
        {byDifficulty && (
          <div className="absolute top-3 left-3 bg-card/95 backdrop-blur rounded-xl border border-border shadow-card px-3 py-2 text-xs space-y-1">
            <div className="font-semibold text-text-secondary mb-1">难度</div>
            {Object.entries(LEVEL_NAMES).map(([k, name]) => (
              <div key={k} className="flex items-center gap-2 text-text-secondary">
                <span className="w-3 h-3 rounded-full" style={{ background: LEVEL_COLORS[k] }} />
                {name}
              </div>
            ))}
          </div>
        )}
        {cats.length === 0 && (
          <div className="absolute inset-0 grid place-items-center text-text-muted text-sm">
            正在生成知识图谱…
          </div>
        )}
        {/* 键盘聚焦提示（可见）+ 无障碍实时播报（屏幕阅读器） */}
        {focusedId && (
          <div className="absolute bottom-3 left-3 bg-card/95 backdrop-blur rounded-xl border border-border shadow-card px-3 py-2 text-xs text-text-secondary no-print pointer-events-none">
            <span className="font-medium text-text-primary">
              {sim.current?.nodes.find((n) => n.id === focusedId)?.title}
            </span>
            <span className="ml-1">· 方向键浏览，回车打开</span>
          </div>
        )}
        <div className="sr-only" aria-live="polite">
          {focusedId
            ? `已聚焦节点：${sim.current?.nodes.find((n) => n.id === focusedId)?.title}`
            : ''}
        </div>
      </div>

      <div className="px-5 py-3 text-xs text-text-muted border-t border-border">
        连线含义：同方向按学习顺序相连的
        <span className="text-brand-600 font-semibold"> 链路</span>；
        文章间
        <span className="font-semibold" style={{ color: '#8B5CF6' }}> 共享标签 </span>
        的关联；
        <span className="text-warning-600 font-semibold"> 前置依赖 </span>
        （带箭头，先学 → 后学）。节点颜色{byDifficulty ? '对应学习难度' : '对应学习方向'}。
      </div>
    </div>
  );
}

function FilterChip({ active, color, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition ${
        active ? 'text-white border-transparent' : 'bg-card text-text-secondary border-border hover:border-brand-300'
      }`}
      style={active ? { background: color } : undefined}
    >
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
      {label}
    </button>
  );
}
