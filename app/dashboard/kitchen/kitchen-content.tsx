"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Order, Table, OrderItem, MenuItem } from "@/lib/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Clock,
  ChefHat,
  Bell,
  CheckCircle2,
  Timer,
  UtensilsCrossed,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface KitchenContentProps {
  orders: (Order & {
    table?: Table;
    items?: (OrderItem & { menu_item?: MenuItem })[];
  })[];
}

const statusConfig = {
  pending: {
    label: "Chờ xác nhận",
    className:
      "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/50",
    icon: AlertCircle,
  },
  confirmed: {
    label: "Đã xác nhận",
    className:
      "bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/50",
    icon: Clock,
  },
  preparing: {
    label: "Đang nấu",
    className:
      "bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/50",
    icon: ChefHat,
  },
  ready: {
    label: "Sẵn sàng",
    className:
      "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/50",
    icon: Bell,
  },
};

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getElapsedTime(dateString: string) {
  const now = new Date();
  const created = new Date(dateString);
  const diff = Math.floor((now.getTime() - created.getTime()) / 1000 / 60);

  if (diff < 1) return "Vừa xong";
  if (diff < 60) return `${diff} phút`;
  return `${Math.floor(diff / 60)}h ${diff % 60}p`;
}

function getTimeColor(dateString: string) {
  const now = new Date();
  const created = new Date(dateString);
  const diff = Math.floor((now.getTime() - created.getTime()) / 1000 / 60);

  if (diff < 10) return "text-green-600";
  if (diff < 20) return "text-yellow-600";
  return "text-red-600";
}

export function KitchenContent({ orders: initialOrders }: KitchenContentProps) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null); // Lưu ID đơn hàng đang cập nhật trạng thái

  // ĐỒNG BỘ CLIENT PROP: Cập nhật lại State nội bộ khi dữ liệu Server Component thay đổi
  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  // ĐỒNG BỘ DỮ LIỆU TỰ ĐỘNG (POLLING): Cứ sau 5 giây ép Server kiểm tra và làm mới danh sách đơn hàng thực tế
  useEffect(() => {
    const autoRefreshTimer = setInterval(() => {
      router.refresh();
    }, 5000); // 5 giây đồng bộ khớp với revalidate của bạn

    return () => clearInterval(autoRefreshTimer);
  }, [router]);

  // Hàm thực thi gọi API cập nhật trạng thái đơn hàng lên Database khi đầu bếp bấm nút
  const updateOrderStatus = async (orderId: string, nextStatus: string) => {
    try {
      setIsSubmitting(orderId);

      const response = await fetch("/api/kitchen", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: nextStatus }),
      });

      if (!response.ok) throw new Error("Cập nhật trạng thái hóa đơn thất bại");

      // Quy tắc Đồng bộ State kép của dự án:
      // 1. Cập nhật ngay useState cục bộ để giao diện đổi màu hoặc ẩn ngay lập tức tạo cảm giác mượt mà
      setOrders(
        (prev) =>
          prev
            .map((order) =>
              order.id === orderId
                ? { ...order, status: nextStatus as any }
                : order,
            )
            .filter((order) => order.status !== "served"), // Nếu bấm "Đã phục vụ" thì ẩn hoàn toàn khỏi màn hình bếp
      );

      // 2. Gọi router.refresh() đồng bộ lại dữ liệu gốc an toàn từ server ngầm
      router.refresh();
    } catch (error) {
      console.error(error);
      alert(
        "Không thể thực hiện thao tác. Vui lòng kiểm tra lại quyền kết nối!",
      );
    } finally {
      setIsSubmitting(null);
    }
  };

  const toggleItemComplete = (itemId: string) => {
    setCompletedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const preparingOrders = orders.filter(
    (o) => o.status === "confirmed" || o.status === "preparing",
  );
  const readyOrders = orders.filter((o) => o.status === "ready");

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)]">
        <ChefHat className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Không có đơn hàng</h2>
        <p className="text-muted-foreground">
          Các đơn hàng mới sẽ xuất hiện tại đây
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="flex items-center gap-4 text-sm">
        <Badge variant="outline" className="gap-2 py-1.5 px-3 bg-background">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          Chờ xác nhận: {pendingOrders.length}
        </Badge>
        <Badge variant="outline" className="gap-2 py-1.5 px-3 bg-background">
          <ChefHat className="h-4 w-4 text-orange-500" />
          Đang nấu: {preparingOrders.length}
        </Badge>
        <Badge variant="outline" className="gap-2 py-1.5 px-3 bg-background">
          <Bell className="h-4 w-4 text-green-500" />
          Sẵn sàng: {readyOrders.length}
        </Badge>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {orders.map((order) => {
          const StatusIcon =
            statusConfig[order.status as keyof typeof statusConfig]?.icon ||
            Clock;
          const allItemsComplete = order.items?.every((item) =>
            completedItems.has(item.id),
          );
          const isCurrentOrderSubmitting = isSubmitting === order.id;

          return (
            <Card
              key={order.id}
              className={cn(
                "overflow-hidden transition-all border-2 bg-gradient-to-b from-orange-50/90 to-background dark:from-orange-950/20 shadow-md rounded-2xl",
                order.status === "pending" &&
                  "border-yellow-500/40 shadow-yellow-500/5",
                (order.status === "confirmed" ||
                  order.status === "preparing") &&
                  "border-orange-500/40 shadow-orange-500/5",
                order.status === "ready" &&
                  "border-green-500/40 shadow-green-500/5",
                allItemsComplete &&
                  "ring-4 ring-emerald-500 border-emerald-500/50",
              )}
            >
              {/* Header Thẻ: Đã nâng tương phản chữ */}
              <CardHeader className="p-4 pb-2 bg-orange-500/10 border-b border-orange-500/10">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xl font-black text-slate-800 dark:text-slate-100">
                        #{order.order_number}
                      </span>
                      {/* ĐÃ SỬA: Đổi màu chữ tag Bàn ăn thành đen/đậm để đứng xa 2 mét vẫn nhìn rõ số bàn */}
                      <Badge className="font-extrabold bg-orange-500 text-white text-xs px-2 py-0.5 border-none shadow-sm">
                        {order.table?.name || "Mang về"}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />
                        {formatTime(order.created_at)}
                      </span>
                      {/* ĐÃ SỬA: Đổi màu chữ thời gian sang màu Slate đậm đà, dễ nhìn */}
                      <span
                        className={cn(
                          "flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded-full bg-background border shadow-2xs",
                          getTimeColor(order.created_at),
                        )}
                      >
                        <Timer className="h-3 w-3" />
                        {getElapsedTime(order.created_at)}
                      </span>
                    </div>
                  </div>

                  <Badge
                    className={cn(
                      "font-bold px-2 py-1 text-xs shrink-0 border",
                      statusConfig[order.status as keyof typeof statusConfig]
                        ?.className,
                    )}
                  >
                    <StatusIcon className="h-3.5 w-3.5 mr-1" />
                    {
                      statusConfig[order.status as keyof typeof statusConfig]
                        ?.label
                    }
                  </Badge>
                </div>
              </CardHeader>

              {/* Danh sách món ăn bên trong */}
              <CardContent className="p-3 pt-3 flex flex-col justify-between h-[calc(100%-4.5rem)]">
                <ScrollArea className="h-[220px] pr-1">
                  <div className="space-y-2">
                    {order.items?.map((item) => (
                      <div
                        key={item.id}
                        onClick={() =>
                          !isCurrentOrderSubmitting &&
                          toggleItemComplete(item.id)
                        }
                        className={cn(
                          "flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer border select-none",
                          completedItems.has(item.id)
                            ? "bg-emerald-500/10 border-emerald-500/20 line-through opacity-50"
                            : "bg-background hover:bg-orange-500/5 hover:border-orange-500/20 shadow-2xs",
                        )}
                      >
                        <Checkbox
                          checked={completedItems.has(item.id)}
                          onCheckedChange={() => toggleItemComplete(item.id)}
                          disabled={isCurrentOrderSubmitting}
                          className="h-4 w-4 border-slate-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            {/* ĐÃ SỬA: Phóng to số lượng 1x, 2x lên cực đại và bôi đậm để đầu bếp nhìn lướt qua là biết ngay */}
                            <span
                              className={cn(
                                "text-xl font-black shrink-0",
                                completedItems.has(item.id)
                                  ? "text-muted-foreground"
                                  : "text-orange-600",
                              )}
                            >
                              {item.quantity}x
                            </span>
                            <span className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">
                              {item.menu_item?.name}
                            </span>
                          </div>
                          {item.note && (
                            <p className="text-xs font-bold text-amber-700 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-md mt-1.5 flex items-center gap-1">
                              ⚠️ {item.note}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {order.note && (
                  <div className="mt-2 p-2 rounded-xl bg-yellow-500/10 text-xs font-bold text-yellow-800 border border-dashed border-yellow-500/30">
                    📌 Ghi chú tổng: {order.note}
                  </div>
                )}

                {/* Cụm nút bấm hành động: Đã làm to, rộng, không bị tràn chữ */}
                <div className="flex gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {order.status === "pending" && (
                    <Button
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-extrabold text-sm h-10 rounded-xl shadow-xs"
                      size="sm"
                      disabled={isCurrentOrderSubmitting}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateOrderStatus(order.id, "confirmed");
                      }}
                    >
                      {isCurrentOrderSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      )}
                      Xác nhận đơn
                    </Button>
                  )}
                  {(order.status === "confirmed" ||
                    order.status === "preparing") && (
                    <>
                      <Button
                        variant={
                          order.status === "preparing" ? "ghost" : "outline"
                        }
                        className={cn(
                          "flex-1 font-extrabold text-xs h-10 rounded-xl",
                          order.status === "preparing"
                            ? "bg-orange-500/10 text-orange-600 border-none pointer-events-none"
                            : "border-orange-200 text-orange-600 hover:bg-orange-50",
                        )}
                        size="sm"
                        disabled={isCurrentOrderSubmitting}
                        onClick={(e) => {
                          e.stopPropagation();
                          updateOrderStatus(order.id, "preparing");
                        }}
                      >
                        <ChefHat className="h-4 w-4 mr-1.5" />
                        {order.status === "preparing" ? "Đang nấu" : "Nấu món"}
                      </Button>
                      <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs h-10 rounded-xl shadow-xs"
                        size="sm"
                        disabled={!allItemsComplete || isCurrentOrderSubmitting}
                        onClick={(e) => {
                          e.stopPropagation();
                          updateOrderStatus(order.id, "ready");
                        }}
                      >
                        {isCurrentOrderSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                        ) : (
                          <Bell className="h-4 w-4 mr-1.5" />
                        )}
                        Sẵn sàng
                      </Button>
                    </>
                  )}
                  {order.status === "ready" && (
                    <Button
                      className="w-full font-extrabold text-sm h-10 rounded-xl bg-slate-700 hover:bg-slate-800 text-white shadow-xs"
                      size="sm"
                      variant="secondary"
                      disabled={isCurrentOrderSubmitting}
                      onClick={(e) => {
                        e.stopPropagation();
                        updateOrderStatus(order.id, "served");
                      }}
                    >
                      {isCurrentOrderSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <UtensilsCrossed className="h-4 w-4 mr-2" />
                      )}
                      Đã phục vụ
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
