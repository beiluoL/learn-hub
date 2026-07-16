import { useEffect, useState } from 'react';

export default function ReadingProgress() {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = scrollHeight > 0 ? Math.min(100, (scrollY / scrollHeight) * 100) : 0;
      setWidth(pct);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="fixed top-16 left-0 right-0 z-40 h-1 bg-border no-print">
      <div
        className="h-full bg-brand-500 transition-all duration-150"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
