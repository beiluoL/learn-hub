import { Code, Terminal, Globe, Brain, Server, Layers, HelpCircle, BookOpen } from 'lucide-react';

const MAP = {
  java: Code,
  python: Terminal,
  frontend: Globe,
  ai: Brain,
  system: Server,
  interview: HelpCircle,
  category: Layers,
};

export default function CatIcon({ catId, size = 24, ...rest }) {
  const Icon = MAP[catId] || BookOpen;
  return <Icon size={size} {...rest} />;
}
