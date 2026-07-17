import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// 路由切换时把窗口滚动回顶部，避免从首页/列表点进新页面时仍停留在旧滚动位置。
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    // rAF 确保在内容绘制之后再滚动，规避懒加载页面挂载时序导致的不生效
    const id = window.requestAnimationFrame(() => window.scrollTo(0, 0));
    return () => window.cancelAnimationFrame(id);
  }, [pathname]);
  return null;
}
