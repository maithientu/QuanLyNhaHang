export default function TablesLoading() {
    return (
      <div className="p-6 space-y-4">
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-8 w-24 bg-muted rounded animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }