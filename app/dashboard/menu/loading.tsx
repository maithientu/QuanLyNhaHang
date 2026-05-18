export default function MenuLoading() {
    return (
      <div className="p-6 space-y-4">
        <div className="h-10 bg-muted rounded animate-pulse w-64" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="h-40 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }