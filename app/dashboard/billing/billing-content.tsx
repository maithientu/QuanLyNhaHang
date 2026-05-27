"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
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

  const router = useRouter();

  // Tính toán dữ liệu thống kê thanh toán
  const averageOrderValue =
    orders.length > 0
      ? orders.reduce((sum, o) => sum + (o.total || 0), 0) / orders.length
      : 0;

  const maxOrderValue =
    orders.length > 0 ? Math.max(...orders.map((o) => o.total || 0)) : 0;

  const handlePayment = (order: any) => {
    setSelectedOrder(order);

    const orderTotal = order.total || 0;

    setReceivedAmount(orderTotal.toString());

    setDiscount("");

    setPaymentMethod("cash");
    setIsPaymentDialogOpen(true);
  };

  const handlePrintBill = () => {
    setIsPrinting(true);
    setTimeout(() => setIsPrinting(false), 500);
  };

  const handleConfirmPayment = async () => {
    if (!selectedOrder) return;

    try {
      setIsPrinting(true); // Mượn tạm trạng thái loading hoặc dùng stateisSubmitting

      // Gửi toàn bộ dữ liệu hóa đơn gộp lên API Backend
      const response = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Cực kì quan trọng: Nếu là đơn gộp, truyền mảng order_ids, nếu đơn lẻ truyền [selectedOrder.id]
          order_ids: (selectedOrder as any).order_ids || [selectedOrder.id],
          table_id: selectedOrder.table_id || "takeaway",
          amount: total,
          payment_method: paymentMethod,
          discount: parseFloat(discount) || 0,
          received_amount:
            paymentMethod === "cash" ? parseFloat(receivedAmount) || 0 : total,
          change_amount: paymentMethod === "cash" ? change : 0,
          note: `Thanh toán qua phân hệ Billing hệ thống`,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Thanh toán thất bại");

      // Quy tắc Đồng bộ State kép của dự án:
      setIsPaymentDialogOpen(false); // 1. Tắt hộp thoại Dialog lập tức
      router.refresh(); // 2. Ép Server đồng bộ trạng thái bàn sang "Dọn dẹp" ngầm từ máy chủ

      alert(
        "Hóa đơn đã được chốt thành công! Bàn đã chuyển sang trạng thái chờ dọn dẹp.",
      );
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Không thể chốt thanh toán. Vui lòng thử lại!");
    } finally {
      setIsPrinting(false);
    }
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

  const groupedOrders = useMemo(() => {
    const groups: { [key: string]: any } = {};

    orders.forEach((order) => {
      const tableId = order.table_id || "takeaway";

      if (!groups[tableId]) {
        groups[tableId] = {
          ...order,
          items: [...(order.items || [])],
          subtotal: Number(order.subtotal),
          tax: Number(order.tax),
          total: Number(order.total),
          order_ids: [order.id], // Gom danh sách ID lại để lúc bấm "Chốt" thì Update tất cả các đơn này thành 'paid'
        };
      } else {
        groups[tableId].items = [
          ...groups[tableId].items,
          ...(order.items || []),
        ];
        groups[tableId].subtotal += Number(order.subtotal);
        groups[tableId].tax += Number(order.tax);
        groups[tableId].total += Number(order.total);
        groups[tableId].order_ids.push(order.id);
      }
    });

    return Object.values(groups);
  }, [orders]);

  // 1. Tính số lượng đơn hàng thực tế đang chờ thanh toán (Đếm số thẻ gộp đang hiện)
  const totalPendingBillingCount = groupedOrders.length;

  // 2. Lọc ra danh sách các đơn hàng đã thanh toán thành công (status === 'completed' hoặc 'paid')
  const completedOrders = orders.filter((o) => o.status === "completed");

  // 3. Tính tổng doanh thu hôm nay từ các đơn đã thanh toán thành công
  const todayRevenue = completedOrders.reduce(
    (sum, order) => sum + (Number(order.total) || 0),
    0,
  );

  // 4. Đếm số lượng giao dịch thành công thực tế
  const completedTransactionsCount = completedOrders.length;

  // 5. Tính toán giá trị trung bình trên mỗi đơn hàng đã thanh toán
  const averagePerOrder =
    completedTransactionsCount > 0
      ? todayRevenue / completedTransactionsCount
      : 0;

  // 6. Tìm kiếm hóa đơn có trị giá cao nhất trong ngày
  const highestOrderTotal =
    completedOrders.length > 0
      ? Math.max(...completedOrders.map((o) => Number(o.total) || 0))
      : 0;

  return (
    <div className="space-y-6">
      {/* HÀNG 1: Ba ô tài chính cốt lõi (Cần không gian rộng tối đa để hiển thị tiền lớn) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* THẺ 1: DOANH THU HÔM NAY */}
        <Card className="overflow-hidden border-none bg-rose-500/5 shadow-xs rounded-xl">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-rose-500/10 text-rose-600 shrink-0 text-xl font-bold">
              $
            </div>
            <div className="min-w-0 space-y-0.5">
              <p className="text-[11px] font-black tracking-wider text-muted-foreground uppercase">
                Doanh thu hôm nay
              </p>
              <h3 className="text-2xl font-black tracking-tight text-rose-700">
                {formatCurrency(todayRevenue)}
              </h3>
            </div>
          </CardContent>
        </Card>

        {/* THẺ 2: TRUNG BÌNH / ĐƠN */}
        <Card className="overflow-hidden border-none bg-emerald-500/5 shadow-xs rounded-xl">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0 text-xl font-bold">
              $
            </div>
            <div className="min-w-0 space-y-0.5">
              <p className="text-[11px] font-black tracking-wider text-muted-foreground uppercase">
                Trung bình/Đơn
              </p>
              <h3 className="text-2xl font-black tracking-tight text-emerald-700">
                {formatCurrency(averagePerOrder)}
              </h3>
            </div>
          </CardContent>
        </Card>

        {/* THẺ 3: ĐƠN CAO NHẤT */}
        <Card className="overflow-hidden border-none bg-blue-500/5 shadow-xs rounded-xl">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 shrink-0 text-xl font-bold">
              📈
            </div>
            <div className="min-w-0 space-y-0.5">
              <p className="text-[11px] font-black tracking-wider text-muted-foreground uppercase">
                Đơn cao nhất
              </p>
              <h3 className="text-2xl font-black tracking-tight text-blue-700">
                {formatCurrency(highestOrderTotal)}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* HÀNG 2: Hai ô đếm số lượng vận hành (Nhỏ gọn, tiết kiệm diện tích) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* THẺ 4: SỐ GIAO DỊCH */}
        <Card className="overflow-hidden border-none bg-indigo-500/5 shadow-xs rounded-xl">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-600 shrink-0 text-sm">
              📊
            </div>
            <div className="min-w-0 flex items-baseline gap-2">
              <p className="text-xs font-bold text-muted-foreground uppercase">
                Số giao dịch thành công:
              </p>
              <h4 className="text-xl font-black tracking-tight text-indigo-700">
                {completedTransactionsCount}
              </h4>
            </div>
          </CardContent>
        </Card>

        {/* THẺ 5: CHỜ THANH TOÁN */}
        <Card className="overflow-hidden border-none bg-amber-500/5 shadow-xs rounded-xl">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600 shrink-0 text-sm">
              💵
            </div>
            <div className="min-w-0 flex items-baseline gap-2">
              <p className="text-xs font-bold text-muted-foreground uppercase">
                Đơn hàng chờ thanh toán:
              </p>
              <h4 className="text-xl font-black tracking-tight text-amber-700">
                {totalPendingBillingCount}
              </h4>
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
                Danh sách {groupedOrders.length} đơn hàng đang chờ hoàn tất
                thanh toán.
              </p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-destructive">
                {groupedOrders.length}
              </p>
              <p className="text-xs text-muted-foreground block mt-1">
                đơn hàng
              </p>
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
              {groupedOrders.map((order) => (
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
                        {groupedOrders
                          .flatMap((o) => o.items)
                          .map((item) => (
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
        {/* ĐÃ SỬA: Thêm max-h-[90vh], flex-col và overflow-hidden để khóa khung Dialog cố định */}
        <DialogContent className="max-w-md w-[95vw] max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl shadow-xl">
          {/* Phần Header cố định trên cùng */}
          <DialogHeader className="p-5 pb-4 border-b bg-muted/20 shrink-0">
            <DialogTitle className="text-xl font-black">
              Thanh toán đơn #{selectedOrder?.order_number}
            </DialogTitle>
            {/* Giữ DialogDescription ngắn gọn đúng nghĩa văn bản text để tránh lỗi */}
            <DialogDescription className="text-xs">
              Vui lòng kiểm tra thông tin và hoàn tất thủ tục chốt hóa đơn.
            </DialogDescription>

            {/* ĐÃ SỬA: Tách cụm thông tin phòng bàn ra thành thẻ div độc lập bên dưới Header */}
            <div className="mt-3 space-y-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-semibold">
                  Phòng/Bàn:
                </span>
                <span className="text-foreground">
                  {selectedOrder?.table?.name || "🛍️ Mang về"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-semibold">
                  Khách:
                </span>
                <span className="text-foreground">
                  {selectedOrder?.guest_count} người
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-semibold">
                  Giờ tạo:
                </span>
                <span className="text-foreground">
                  {selectedOrder?.created_at
                    ? formatTime(selectedOrder.created_at)
                    : "-"}
                </span>
              </div>
            </div>
          </DialogHeader>

          {/* ========================================================= */}
          {/* VÙNG TRUNG TÂM CUỘN DỌC: Thêm flex-1 overflow-y-auto p-5 */}
          {/* ========================================================= */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Order Summary */}
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                Chi tiết đơn hàng
              </Label>
              <ScrollArea className="h-[130px] rounded-xl border border-border/60 p-3 bg-muted/10">
                {selectedOrder?.items?.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between py-1 text-sm border-b border-dashed border-border/40 last:border-none"
                  >
                    <div className="truncate pr-2">
                      <span className="font-bold text-orange-600">
                        {item.quantity}x
                      </span>{" "}
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {item.menu_item?.name}
                      </span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-slate-100 shrink-0">
                      {formatCurrency(item.total_price)}
                    </span>
                  </div>
                ))}
              </ScrollArea>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Chọn phương thức thanh toán
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {paymentMethods.map((method) => (
                  <Button
                    key={method.value}
                    type="button"
                    variant={
                      paymentMethod === method.value ? "default" : "outline"
                    }
                    className="flex-col h-auto py-2.5 rounded-xl border transition-all"
                    onClick={() => setPaymentMethod(method.value)}
                  >
                    <method.icon className="h-4 w-4 mb-1" />
                    <span className="text-[11px] font-bold">
                      {method.label}
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Discount */}
            <div className="space-y-1.5">
              <Label
                htmlFor="discount"
                className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                Giảm giá (VND)
              </Label>
              <Input
                id="discount"
                type="number"
                placeholder="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="rounded-xl h-9"
              />
            </div>

            {/* Received Amount (for cash) */}
            {paymentMethod === "cash" && (
              <div className="space-y-1.5">
                <Label
                  htmlFor="received"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Tiền khách đưa (VND)
                </Label>
                <Input
                  id="received"
                  type="number"
                  placeholder="0"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  className="rounded-xl h-10 text-lg font-bold text-primary"
                />
              </div>
            )}

            {/* Summary Block */}
            <div className="space-y-2 pt-3 border-t border-border/80">
              <div className="flex justify-between text-xs font-medium text-muted-foreground">
                <span>Tạm tính</span>
                <span className="font-bold text-slate-800">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-xs bg-green-500/10 border border-green-500/20 px-2 py-1.5 rounded-lg">
                  <span className="text-green-700 dark:text-green-400 font-bold">
                    Giảm giá
                  </span>
                  <span className="text-green-700 dark:text-green-400 font-black">
                    -{formatCurrency(discountAmount)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-xs font-medium text-muted-foreground">
                <span>VAT (10%)</span>
                <span className="font-bold text-slate-800">
                  {formatCurrency(tax)}
                </span>
              </div>

              <Separator className="my-1" />

              <div className="flex justify-between items-center font-black text-base bg-primary/10 px-3 py-2.5 rounded-xl border border-primary/20">
                <span className="text-slate-800">Tổng cộng</span>
                <span className="text-xl text-primary font-black tracking-tight">
                  {formatCurrency(total)}
                </span>
              </div>

              {paymentMethod === "cash" && received > 0 && (
                <div
                  className={`flex justify-between items-center font-bold px-3 py-2 rounded-xl text-xs border ${
                    change >= 0
                      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-700 border-rose-500/20"
                  }`}
                >
                  <span>
                    {change >= 0 ? "Tiền thừa trả khách" : "Khách còn thiếu"}
                  </span>
                  <span className="text-sm font-black">
                    {formatCurrency(Math.abs(change))}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Phần Chân trang cố định dưới cùng - Luôn hiển thị trước mắt thu ngân */}
          <DialogFooter className="p-4 border-t bg-muted/15 flex gap-2 justify-end shrink-0 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPaymentDialogOpen(false)}
              className="font-bold rounded-xl h-9"
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handlePrintBill}
              disabled={isPrinting}
              className="font-bold rounded-xl h-9"
            >
              <Printer className="h-4 w-4 mr-1.5" />
              {isPrinting ? "Đang in..." : "In bill"}
            </Button>
            <Button
              type="button"
              className="font-black rounded-xl h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleConfirmPayment}
              disabled={isPrinting || (paymentMethod === "cash" && change < 0)}
            >
              <CheckCircle className="h-4 w-4 mr-1.5" />
              {isPrinting ? "Đang xử lý..." : "Chốt thanh toán"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
