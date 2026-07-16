// 骨架屏组件 — 页面 loading 占位
export function CardSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-5 w-12 rounded-full bg-surface" />
        <div className="h-4 w-16 rounded bg-surface ml-auto" />
      </div>
      <div className="h-5 w-3/4 rounded bg-surface mb-2" />
      <div className="h-4 w-full rounded bg-surface mb-1" />
      <div className="h-4 w-2/3 rounded bg-surface mb-3" />
      <div className="flex gap-2">
        <div className="h-5 w-14 rounded-full bg-surface" />
        <div className="h-5 w-14 rounded-full bg-surface" />
      </div>
    </div>
  );
}

export function ArticleDetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 animate-pulse">
      <div className="h-4 w-24 rounded bg-surface mb-6" />
      <div className="h-8 w-2/3 rounded bg-surface mb-4" />
      <div className="h-5 w-full rounded bg-surface mb-2" />
      <div className="h-5 w-3/4 rounded bg-surface mb-8" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-4 rounded bg-surface" style={{ width: `${100 - i * 15}%` }} />
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
