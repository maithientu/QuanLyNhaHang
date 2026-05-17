"use client";

import { MenuItem } from "@/lib/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface TopSellingItemsProps {
  items: (MenuItem & { total_sold: number })[];
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

export function TopSellingItems({ items }: TopSellingItemsProps) {
  const maxSold = Math.max(...items.map((item) => item.total_sold), 1);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Món bán chạy</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="flex min-h-[220px] items-center justify-center rounded-3xl border border-dashed border-muted/40 bg-muted/5 text-muted-foreground">
              Chưa có dữ liệu
            </div>
          ) : (
            items.map((item, index) => (
              <div key={item.id} className="space-y-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(item.price)}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-foreground">
                    {item.total_sold} phần
                  </span>
                </div>
                <Progress
                  value={(item.total_sold / maxSold) * 100}
                  className="h-2 rounded-full"
                />
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
