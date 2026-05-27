// app/dashboard/reports/loading.tsx
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ReportsLoading() {
  return (
    <div className="space-y-6 p-4 md:p-6 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-8 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-1/4" />
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted rounded w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
