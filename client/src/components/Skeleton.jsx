// 骨架屏组件 — 页面 loading 占位
export function CardSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-5 w-12 rounded-full skeleton" />
        <div className="h-4 w-16 rounded skeleton ml-auto" />
      </div>
      <div className="h-5 w-3/4 rounded skeleton mb-2" />
      <div className="h-4 w-full rounded skeleton mb-1" />
      <div className="h-4 w-2/3 rounded skeleton mb-3" />
      <div className="flex gap-2">
        <div className="h-5 w-14 rounded-full skeleton" />
        <div className="h-5 w-14 rounded-full skeleton" />
      </div>
    </div>
  );
}

export function ArticleDetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="h-4 w-24 rounded skeleton mb-6" />
      <div className="h-8 w-2/3 rounded skeleton mb-4" />
      <div className="h-5 w-full rounded skeleton mb-2" />
      <div className="h-5 w-3/4 rounded skeleton mb-8" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-4 rounded skeleton" style={{ width: `${100 - i * 15}%` }} />
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 4 }) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

// 面试题详情页骨架（与文章详情风格统一）
export function InterviewDetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="h-4 w-24 rounded skeleton mb-6" />
      <div className="flex items-center gap-2 mb-3">
        <div className="h-5 w-12 rounded-full skeleton" />
        <div className="h-4 w-16 rounded skeleton" />
      </div>
      <div className="h-8 w-3/4 rounded skeleton mb-4" />
      <div className="flex gap-2 mb-6">
        <div className="h-5 w-14 rounded-full skeleton" />
        <div className="h-5 w-14 rounded-full skeleton" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-4 rounded skeleton" style={{ width: `${100 - i * 12}%` }} />
        ))}
      </div>
    </div>
  );
}

// 搜索结果骨架（全宽卡片列表）
export function SearchResultSkeleton({ count = 5 }) {
  return (
    <div className="mt-6 space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card rounded-2xl p-5 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-5 w-12 rounded-full skeleton" />
            <div className="h-4 w-16 rounded skeleton" />
          </div>
          <div className="h-5 w-2/3 rounded skeleton mb-2" />
          <div className="h-4 w-full rounded skeleton" />
        </div>
      ))}
    </div>
  );
}

// 路由懒加载兜底（Suspense fallback）
export function PageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="h-4 w-24 rounded skeleton mb-6" />
      <div className="h-9 w-1/2 rounded skeleton mb-4" />
      <div className="h-5 w-full rounded skeleton mb-2" />
      <div className="h-5 w-3/4 rounded skeleton mb-8" />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-40 rounded-2xl bg-card border border-border" />
        ))}
      </div>
    </div>
  );
}
