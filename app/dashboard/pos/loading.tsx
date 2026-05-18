export default function POSLoading() {
    return (
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Menu skeleton */}
        <div className="flex-1 p-4 space-y-4">
          <div className="h-10 bg-muted rounded animate-pulse w-full" />
          <div className="flex gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 w-20 bg-muted rounded animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
        {/* Cart skeleton */}
        <div className="w-[380px] border-l p-4 space-y-4">
          <div className="h-10 bg-muted rounded animate-pulse" />
          <div className="h-full bg-muted rounded animate-pulse" />
        </div>
      </div>
    )
  }