export default function BillingLoading() {
    return (
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-muted rounded animate-pulse" />
      </div>
    )
  }