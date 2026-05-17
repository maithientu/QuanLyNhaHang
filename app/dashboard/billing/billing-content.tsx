"use client";

import { useState } from "react";
import { Order, Table, OrderItem, MenuItem } from "@/lib/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Receipt,
  CreditCard,
  Banknote,
  QrCode,
  Building2,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Printer,
} from "lucide-react";

interface BillingContentProps {
  orders: (Order & {
    table?: Table;
    items?: (OrderItem & { menu_item?: MenuItem })[];
  })[];
  stats: {
    todayRevenue: number;
    todayTransactions: number;
  };
}

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

const paymentMethods = [
  { value: "cash", label: "Tiền mặt", icon: Banknote },
  { value: "card", label: "Thẻ", icon: CreditCard },
  { value: "transfer", label: "Chuyển khoản", icon: Building2 },
  { value: "qr", label: "QR Code", icon: QrCode },
];

export function BillingContent({ orders, stats }: BillingContentProps) {
  const [selectedOrder, setSelectedOrder] = useState<
    | (Order & {
        table?: Table;
        items?: (OrderItem & { menu_item?: MenuItem })[];
      })
    | null
  >(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [discount, setDiscount] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);

  // Tính toán dữ liệu thống kê thanh toán
  const averageOrderValue =
    orders.length > 0
      ? orders.reduce((sum, o) => sum + (o.total || 0), 0) / orders.length
      : 0;

  const maxOrderValue =
    orders.length > 0 ? Math.max(...orders.map((o) => o.total || 0)) : 0;

  const handlePayment = (order: typeof selectedOrder) => {
    setSelectedOrder(order);
    setReceivedAmount("");
    setDiscount("");
    setPaymentMethod("cash");
    setIsPaymentDialogOpen(true);
  };

  const handlePrintBill = () => {
    setIsPrinting(true);
    setTimeout(() => setIsPrinting(false), 500);
  };

  const calculateTotal = () => {
    if (!selectedOrder)
      return { subtotal: 0, discountAmount: 0, tax: 0, total: 0 };

    const subtotal = selectedOrder.subtotal || 0;
    const discountAmount = parseFloat(discount) || 0;
    const taxableAmount = subtotal - discountAmount;
    const tax = taxableAmount * 0.1;
    const total = taxableAmount + tax;

    return { subtotal, discountAmount, tax, total };
  };

  const { subtotal, discountAmount, tax, total } = calculateTotal();
  const received = parseFloat(receivedAmount) || 0;
  const change = received - total;

  return (
    <div className="space-y-6">
      {/* Stats: Hiển thị 5 chỉ số quan trọng về thanh toán trong ngày */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-primary/20">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Doanh thu hôm nay
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(stats.todayRevenue)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-chart-1/5 to-chart-1/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-chart-1/20">
              <TrendingUp className="h-6 w-6 text-chart-1" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Số giao dịch
              </p>
              <p className="text-2xl font-bold">{stats.todayTransactions}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-chart-2/5 to-chart-2/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-chart-2/20">
              <Receipt className="h-6 w-6 text-chart-2" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Chờ thanh toán
              </p>
              <p className="text-2xl font-bold">{orders.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-chart-3/5 to-chart-3/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-chart-3/20">
              <DollarSign className="h-6 w-6 text-chart-3" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Trung bình/Đơn
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(averageOrderValue)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-chart-4/5 to-chart-4/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-chart-4/20">
              <TrendingUp className="h-6 w-6 text-chart-4" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Đơn cao nhất
              </p>
              <p className="text-2xl font-bold">
                {formatCurrency(maxOrderValue)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">
                Đơn hàng chờ thanh toán
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Danh sách {orders.length} đơn hàng đang chờ hoàn tất thanh toán.
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">{orders.length}</p>
              <p className="text-xs text-muted-foreground">đơn hàng</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Receipt className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">
                Không có đơn hàng chờ thanh toán
              </p>
              <p className="text-sm">
                Tất cả đơn hàng đã được hoàn tất thanh toán.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map((order) => (
                <Card
                  key={order.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="p-4 pb-3 bg-muted/50">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg">
                          #{order.order_number}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTime(order.created_at)}
                        </p>
                      </div>
                      <Badge variant="secondary" className="whitespace-nowrap">
                        {order.table?.name || "🛍️ Mang về"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="mb-3 text-xs text-muted-foreground">
                      <span className="font-medium">
                        👥 {order.guest_count} khách
                      </span>
                    </div>

                    <ScrollArea className="h-[100px] mb-4 rounded-lg border border-border/50 p-3">
                      <div className="space-y-2 text-sm">
                        {order.items?.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-start gap-2"
                          >
                            <span className="text-muted-foreground flex-1">
                              <span className="font-medium text-foreground">
                                {item.quantity}x
                              </span>{" "}
                              {item.menu_item?.name}
                            </span>
                            <span className="font-medium whitespace-nowrap">
                              {formatCurrency(item.total_price)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    <Separator className="my-3" />

                    <div className="flex items-center justify-between mb-4 bg-primary/5 p-3 rounded-lg">
                      <span className="text-sm font-medium">Tổng cộng</span>
                      <span className="text-xl font-bold text-primary">
                        {formatCurrency(order.total)}
                      </span>
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => handlePayment(order)}
                    >
                      <Receipt className="h-4 w-4 mr-2" />
                      Thanh toán ngay
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-2xl">
              Thanh toán đơn #{selectedOrder?.order_number}
            </DialogTitle>
            <DialogDescription className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Phòng/Bàn:</span>
                <span className="font-medium text-foreground">
                  {selectedOrder?.table?.name || "🛍️ Mang về"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Khách:</span>
                <span className="font-medium text-foreground">
                  {selectedOrder?.guest_count} người
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Giờ tạo:</span>
                <span className="font-medium text-foreground">
                  {selectedOrder?.created_at
                    ? formatTime(selectedOrder.created_at)
                    : "-"}
                </span>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Order Summary */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">
                Chi tiết đơn hàng
              </Label>
              <ScrollArea className="h-[140px] rounded-2xl border border-border/50 p-4 bg-muted/20">
                {selectedOrder?.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between py-1.5 text-sm"
                  >
                    <div>
                      <span className="font-medium">{item.quantity}x</span>{" "}
                      {item.menu_item?.name}
                    </div>
                    <span className="font-medium text-foreground">
                      {formatCurrency(item.total_price)}
                    </span>
                  </div>
                ))}
              </ScrollArea>
            </div>

            {/* Payment Method */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">
                Chọn phương thức thanh toán
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {paymentMethods.map((method) => (
                  <Button
                    key={method.value}
                    variant={
                      paymentMethod === method.value ? "default" : "outline"
                    }
                    className="flex-col h-auto py-3 rounded-2xl"
                    onClick={() => setPaymentMethod(method.value)}
                  >
                    <method.icon className="h-5 w-5 mb-1" />
                    <span className="text-xs">{method.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Discount */}
            <div className="space-y-2">
              <Label htmlFor="discount" className="text-sm font-medium">
                Giảm giá (VND)
              </Label>
              <Input
                id="discount"
                type="number"
                placeholder="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="rounded-xl"
              />
            </div>

            {/* Received Amount (for cash) */}
            {paymentMethod === "cash" && (
              <div className="space-y-2">
                <Label htmlFor="received" className="text-sm font-medium">
                  Tiền khách đưa (VND)
                </Label>
                <Input
                  id="received"
                  type="number"
                  placeholder="0"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  className="rounded-xl text-lg font-semibold"
                />
              </div>
            )}

            {/* Summary */}
            <div className="space-y-2 pt-4 border-t-2 border-muted">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tạm tính</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm bg-green-100/50 dark:bg-green-900/20 p-2 rounded-lg">
                  <span className="text-green-700 dark:text-green-400 font-medium">
                    Giảm giá
                  </span>
                  <span className="text-green-700 dark:text-green-400 font-semibold">
                    -{formatCurrency(discountAmount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">VAT (10%)</span>
                <span className="font-medium">{formatCurrency(tax)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold text-lg bg-primary/10 p-3 rounded-xl">
                <span>Tổng cộng</span>
                <span className="text-primary">{formatCurrency(total)}</span>
              </div>
              {paymentMethod === "cash" && received > 0 && (
                <div
                  className={`flex justify-between font-semibold p-3 rounded-xl ${change >= 0 ? "bg-green-100/50 dark:bg-green-900/20" : "bg-red-100/50 dark:bg-red-900/20"}`}
                >
                  <span
                    className={
                      change >= 0
                        ? "text-green-700 dark:text-green-400"
                        : "text-red-700 dark:text-red-400"
                    }
                  >
                    {change >= 0 ? "Tiền thừa" : "Thiếu"}
                  </span>
                  <span
                    className={
                      change >= 0
                        ? "text-green-700 dark:text-green-400"
                        : "text-red-700 dark:text-red-400"
                    }
                  >
                    {formatCurrency(Math.abs(change))}
                  </span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsPaymentDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant="secondary"
              onClick={handlePrintBill}
              disabled={isPrinting}
            >
              <Printer className="h-4 w-4 mr-2" />
              {isPrinting ? "Đang in..." : "In hóa đơn"}
            </Button>
            <Button
              onClick={() => setIsPaymentDialogOpen(false)}
              disabled={paymentMethod === "cash" && change < 0}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Hoàn tất thanh toán
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
