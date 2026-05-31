import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function ReceiptsLoading() {
  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-10 w-40" />
      </div>
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
