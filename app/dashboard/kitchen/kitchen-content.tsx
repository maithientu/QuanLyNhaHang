"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Order, Table, OrderItem, MenuItem } from "@/lib/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Play,
  Check,
} from "lucide-react";

interface KitchenContentProps {
  orders: (Order & {
    table?: Table;
    items?: (OrderItem & { menu_item?: MenuItem })[];
  })[];
}

const itemStatusConfig = {
  pending: { label: "Đang chờ", className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  preparing: { label: "Đang nấu", className: "bg-orange-500/10 text-orange-600 border-orange-500/20 animate-pulse" },
  ready: { label: "Sẵn sàng", className: "bg-green-500/10 text-green-600 border-green-500/20" },
  served: { label: "Đã phục vụ", className: "bg-slate-500/10 text-slate-600 border-slate-500/20" },
  cancelled: { label: "Đã hủy", className: "bg-red-500/10 text-red-600 border-red-500/20" },
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
  const [submittingItemId, setSubmittingItemId] = useState<string | null>(null);
  const [submittingOrderId, setSubmittingOrderId] = useState<string | null>(null);

  useEffect(() => {
    // Chỉ hiển thị các đơn hàng chưa phục vụ xong hoàn toàn tại màn hình bếp chính
    setOrders(initialOrders.filter(o => o.status !== "served"));
  }, [initialOrders]);

  // Tự động Polling làm mới dữ liệu sau 5 giây
  useEffect(() => {
    const autoRefreshTimer = setInterval(() => {
      router.refresh();
    }, 5000);
    return () => clearInterval(autoRefreshTimer);
  }, [router]);

  // Hàm gọi API cập nhật trạng thái món ăn lẻ hoặc phục vụ cả đơn hàng
  const updateStatus = async ({ orderItemId, orderId, nextStatus }: { orderItemId?: string, orderId: string, nextStatus: string }) => {
    try {
      if (orderItemId) setSubmittingItemId(orderItemId);
      else setSubmittingOrderId(orderId);

      const response = await fetch("/api/kitchen", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderItemId, orderId, status: nextStatus }),
      });

      if (!response.ok) throw new Error("Cập nhật trạng thái thất bại");

      router.refresh();
    } catch (error) {
      console.error(error);
      alert("Không thể thực hiện thao tác. Vui lòng kiểm tra lại kết nối!");
    } finally {
      setSubmittingItemId(null);
      setSubmittingOrderId(null);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)]">
        <ChefHat className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Không có đơn hàng</h2>
        <p className="text-muted-foreground">Các món ăn mới được gọi sẽ xuất hiện tại đây</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="flex items-center gap-4 text-sm font-medium">
        <Badge variant="outline" className="gap-2 py-1.5 px-3">
          Tổng số đơn đang chế biến: {orders.length}
        </Badge>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {orders.map((order) => {
          // Kiểm tra xem tất cả các món con trong đơn đã sẵn sàng (ready) hoặc đã phục vụ (served) hết chưa
          const isAllItemsReady = order.items?.every(item => item.status === "ready" || item.status === "served");
          const isOrderLoading = submittingOrderId === order.id;

          return (
            <Card
              key={order.id}
              className={cn(
                "overflow-hidden transition-all border-2 bg-gradient-to-b from-orange-50/50 to-background dark:from-orange-950/10 shadow-md rounded-2xl flex flex-col justify-between h-[420px]",
                isAllItemsReady ? "border-green-500/60 ring-2 ring-green-500/10" : "border-orange-500/20"
              )}
            >
              {/* Header của thẻ đơn hàng */}
              <CardHeader className="p-4 pb-2 bg-orange-500/5 border-b border-orange-500/5 shrink-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xl font-black text-slate-800 dark:text-slate-100">
                        #{order.order_number}
                      </span>
                      <Badge className="font-extrabold bg-orange-500 text-white text-xs px-2 py-0.5">
                        {order.table?.name || "Mang về"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                      <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{formatTime(order.created_at)}</span>
                      <span className={cn("flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded-full bg-background border", getTimeColor(order.created_at))}>
                        <Timer className="h-3 w-3" />{getElapsedTime(order.created_at)}
                      </span>
                    </div>
                  </div>
                  {isAllItemsReady && (
                    <Badge className="bg-green-600 text-white font-bold text-xs animate-bounce">Hoàn thành</Badge>
                  )}
                </div>
              </CardHeader>

              {/* Thân thẻ: Định hình không gian flex để đẩy nút xuống đáy */}
              <CardContent className="p-3 flex-1 flex flex-col justify-between overflow-hidden">
                
                {/* VÙNG CUỘN: Ghim chiều cao cố định cho danh sách món ăn */}
                <div className="flex-1 h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                  <div className="space-y-2.5">
                    {order.items?.map((item) => {
                      const isItemLoading = submittingItemId === item.id;
                      const config = itemStatusConfig[item.status as keyof typeof itemStatusConfig] || itemStatusConfig.pending;

                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "p-2 border rounded-xl transition-all bg-background shadow-3xs flex flex-col gap-2",
                            item.status === "ready" && "border-green-200 bg-green-50/10",
                            item.status === "preparing" && "border-orange-200 bg-orange-50/10"
                          )}
                        >
                          {/* Dòng 1: Số lượng, tên món và Badge trạng thái */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-baseline gap-1.5 min-w-0">
                              <span className={cn("text-lg font-black shrink-0", item.status === "ready" ? "text-slate-400" : "text-orange-600")}>
                                {item.quantity}x
                              </span>
                              <span className={cn("font-bold text-sm text-slate-800 dark:text-slate-200 truncate", item.status === "ready" && "line-through text-slate-400")}>
                                {item.menu_item?.name}
                              </span>
                            </div>
                            <Badge variant="outline" className={cn("text-[10px] px-1.5 font-bold shrink-0", config.className)}>
                              {config.label}
                            </Badge>
                          </div>

                          {/* Ghi chú món ăn nếu có */}
                          {item.note && (
                            <p className="text-[11px] font-bold text-amber-700 bg-amber-500/5 border border-amber-500/10 px-1.5 py-0.5 rounded">
                              ⚠️ {item.note}
                            </p>
                          )}

                          {/* Dòng 2: Các nút bấm hành động */}
                          <div className="flex justify-end pt-1 border-t border-dashed border-slate-100 dark:border-slate-800">
                            {item.status === "pending" && (
                              <Button
                                size="xs"
                                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold text-xs px-2.5 h-7 rounded-lg"
                                disabled={isItemLoading}
                                onClick={() => updateStatus({ orderItemId: item.id, orderId: order.id, nextStatus: "preparing" })}
                              >
                                {isItemLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Play className="h-3 w-3 mr-1 fill-current" />}
                                Nấu món
                              </Button>
                            )}

                            {item.status === "preparing" && (
                              <Button
                                size="xs"
                                className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-2.5 h-7 rounded-lg"
                                disabled={isItemLoading}
                                onClick={() => updateStatus({ orderItemId: item.id, orderId: order.id, nextStatus: "ready" })}
                              >
                                {isItemLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1 stroke-[3]" />}
                                Xong
                              </Button>
                            )}

                            {item.status === "ready" && (
                              <Button
                                size="xs"
                                className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-2.5 h-7 rounded-lg"
                                disabled={isItemLoading}
                                onClick={() => updateStatus({ orderItemId: item.id, orderId: order.id, nextStatus: "served" })}
                              >
                                {isItemLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <UtensilsCrossed className="h-3 w-3 mr-1" />}
                                Đã phục vụ
                              </Button>
                            )}

                            {item.status === "served" && (
                              <span className="text-xs font-semibold text-slate-400 italic py-0.5 px-1">Đã hoàn tất món</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Ghi chú tổng của đơn hàng */}
                {order.note && (
                  <div className="my-1.5 p-1.5 rounded-xl bg-yellow-500/5 text-[11px] font-medium text-yellow-800 border border-dashed border-yellow-500/20 truncate shrink-0">
                    📌 Tổng: {order.note}
                  </div>
                )}

                {/* NÚT LỚN DƯỚI ĐÁY: Luôn luôn được ghim ở đáy thẻ */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0 min-h-[48px] flex items-center justify-center">
                  {isAllItemsReady ? (
                    <Button
                      className="w-full bg-slate-800 hover:bg-slate-900 text-white font-black text-sm h-10 rounded-xl shadow-md"
                      disabled={isOrderLoading}
                      onClick={() => updateStatus({ orderId: order.id, nextStatus: "served" })}
                    >
                      {isOrderLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-400" />
                      )}
                      Xác nhận đã phục vụ
                    </Button>
                  ) : (
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <ChefHat className="h-3.5 w-3.5 text-orange-400 animate-spin [animation-duration:3s]" />
                      Đang xử lý các món ăn lẻ...
                    </p>
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