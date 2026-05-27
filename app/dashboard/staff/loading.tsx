// app/dashboard/staff/loading.tsx
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function StaffLoading() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-10 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/4" />
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-muted rounded w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
