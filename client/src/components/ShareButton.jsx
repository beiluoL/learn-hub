import { useState } from 'react';
import { Link2 } from 'lucide-react';

export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-brand-600 transition"
    >
      <Link2 size={14} />
      {copied ? '已复制' : '复制链接'}
    </button>
  );
}
