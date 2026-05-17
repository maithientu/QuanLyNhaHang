"use client";

import { Order, Table } from "@/lib/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

interface RecentOrdersProps {
  orders: (Order & { table?: Table })[];
}

const statusConfig = {
  pending: {
    label: "Chờ xác nhận",
    className: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  },
  confirmed: {
    label: "Đã xác nhận",
    className: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  },
  preparing: {
    label: "Đang nấu",
    className: "bg-orange-500/20 text-orange-700 dark:text-orange-400",
  },
  ready: {
    label: "Sẵn sàng",
    className: "bg-green-500/20 text-green-700 dark:text-green-400",
  },
  served: { label: "Đã phục vụ", className: "bg-primary/20 text-primary" },
  completed: {
    label: "Hoàn thành",
    className: "bg-muted text-muted-foreground",
  },
  cancelled: {
    label: "Đã hủy",
    className: "bg-destructive/20 text-destructive",
  },
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-lg">Đơn hàng gần đây</CardTitle>
          <p className="text-sm text-muted-foreground">
            Theo dõi nhanh đơn hàng mới nhất trong ngày.
          </p>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/pos" className="flex items-center gap-1">
            Xem tất cả
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[320px] pr-4">
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="flex min-h-[220px] items-center justify-center rounded-3xl border border-dashed border-muted/40 bg-muted/5 text-muted-foreground">
                Chưa có đơn hàng nào trong ngày
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between gap-4 rounded-3xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-sm cursor-pointer"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">
                        #{order.order_number}
                      </span>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-xs",
                          statusConfig[order.status].className,
                        )}
                      >
                        {statusConfig[order.status].label}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span>{order.table?.name || "Mang về"}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(order.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold">
                      {formatCurrency(order.total)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {order.guest_count || 0} khách
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
