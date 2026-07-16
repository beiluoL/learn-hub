import { Link } from 'react-router-dom';
import { ArrowLeft, Share2 } from 'lucide-react';
import KnowledgeGraph from '../components/KnowledgeGraph.jsx';

export default function KnowledgeMap() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-brand-600">
        <ArrowLeft size={14} />
        返回首页
      </Link>
      <div className="flex items-center gap-4 mt-4 mb-6">
        <div className="w-14 h-14 rounded-2xl grid place-items-center text-3xl bg-brand-50">
          <Share2 size={28} className="text-brand-500" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary">学习知识点地图</h1>
          <p className="text-text-secondary text-sm">
            像 Obsidian 关系图谱一样，把所有文章与面试题连成一张知识网。
          </p>
        </div>
      </div>

      <KnowledgeGraph />

      <p className="text-sm text-text-muted mt-6 leading-relaxed">
        提示：节点代表一篇内容，连线代表它们之间的关联。悬停某个节点会高亮它的相邻知识点；
        点击节点直接打开对应内容；右上角可按学习方向筛选。图谱布局每次进入会重新计算，
        拖动节点即可手动调整。
      </p>
    </div>
  );
}
