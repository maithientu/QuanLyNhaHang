export default function KitchenLoading() {
    return (
      <div className="p-6 grid grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-64 bg-muted rounded animate-pulse" />
        ))}
      </div>
    )
  }