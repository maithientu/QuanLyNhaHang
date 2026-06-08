// app/dashboard/reports/reports-content.tsx
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportsContentProps {
  initialData: {
    payments: any[];
    orderItems: any[];
    allOrders: any[];
  };
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

export function ReportsContent({ initialData }: ReportsContentProps) {
  const [data, setData] = useState(initialData);
  const [timeRange, setTimeRange] = useState("7_days");
  const [isLoading, setIsLoading] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const handleTimeRangeChange = async (value: string) => {
    setTimeRange(value);
    setIsLoading(true);

    const targetEndDate = new Date();
    let targetStartDate = new Date();

    if (value === "today") {
      targetStartDate.setHours(0, 0, 0, 0);
    } else if (value === "7_days") {
      targetStartDate.setDate(targetStartDate.getDate() - 7);
    } else if (value === "30_days") {
      targetStartDate.setDate(targetStartDate.getDate() - 30);
    }

    try {
      const response = await fetch(
        `/api/reports?start_date=${targetStartDate.toISOString()}&end_date=${targetEndDate.toISOString()}`,
      );
      if (!response.ok) throw new Error("Không thể tải dữ liệu báo cáo");
      const result = await response.json();
      setData(result);
    } catch (error: any) {
      alert(error.message || "Đã xảy ra lỗi trong quá trình đồng bộ báo cáo.");
    } finally {
      setIsLoading(false);
    }
  };

  const totalRevenue = (data.payments || []).reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0,
  );
  const totalCompletedOrders = (data.payments || []).length;
  const averageOrderValue =
    totalCompletedOrders > 0 ? totalRevenue / totalCompletedOrders : 0;
  const cancelledOrders = (data.allOrders || []).filter(
    (o) => o.status === "cancelled",
  ).length;
  const cancellationRate =
    (data.allOrders || []).length > 0
      ? (cancelledOrders / data.allOrders.length) * 100
      : 0;

  const revenueChartData = Object.values(
    (data.payments || []).reduce((acc: any, p) => {
      // 1. Lấy mốc ngày thuần túy (YYYY-MM-DD) làm Key định danh duy nhất để gom nhóm ổn định
      const rawDate = new Date(p.created_at).toISOString().split("T")[0];

      // 2. Tạo nhãn hiển thị thân thiện trên biểu đồ (DD/MM)
      const dateLabel = new Date(p.created_at).toLocaleDateString("vi-VN", {
        month: "2-digit",
        day: "2-digit",
      });

      if (!acc[rawDate]) {
        acc[rawDate] = {
          rawDate: rawDate, // Lưu mốc thời gian nguyên bản để phục vụ việc sắp xếp
          date: dateLabel,
          "Doanh thu": 0,
          "Đơn hàng": 0,
        };
      }
      acc[rawDate]["Doanh thu"] += Number(p.amount || 0);
      acc[rawDate]["Đơn hàng"] += 1;
      return acc;
    }, {}),
  )
    // Đmanager CHỈNH: Sắp xếp dựa trên chuỗi thời gian nguyên bản YYYY-MM-DD, đảm bảo tính tuyến tính chính xác 100%
    .sort((a: any, b: any) => a.rawDate.localeCompare(b.rawDate));

  const paymentMethodData = Object.values(
    (data.payments || []).reduce((acc: any, p) => {
      let method = "Khác";
      if (p.payment_method === "cash") method = "Tiền mặt";
      else if (p.payment_method === "card") method = "Quẹt thẻ";
      else if (
        p.payment_method === "transfer" ||
        p.payment_method === "bank_transfer"
      )
        method = "Chuyển khoản";
      else if (p.payment_method === "qr") method = "QR Code";

      if (!acc[method]) acc[method] = { name: method, value: 0 };
      acc[method].value += Number(p.amount || 0);
      return acc;
    }, {}),
  );

  const topSellingItems = Object.values(
    (data.orderItems || []).reduce((acc: any, item) => {
      const itemName = item.menu_item?.name || "Món ăn ẩn/Đã xóa";
      if (!acc[itemName]) {
        acc[itemName] = { name: itemName, quantity: 0, revenue: 0 };
      }
      acc[itemName].quantity += item.quantity || 0;
      acc[itemName].revenue += Number(item.total_price || 0);
      return acc;
    }, {}),
  )
    .sort((a: any, b: any) => b.quantity - a.quantity)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border/60 shadow-xs">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">Khoảng thời gian thống kê</h3>
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          )}
        </div>
        <Select
          value={timeRange}
          onValueChange={handleTimeRangeChange}
          disabled={isLoading}
        >
          <SelectTrigger className="w-[180px] rounded-xl">
            <SelectValue placeholder="Chọn thời gian" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="today">Hôm nay</SelectItem>
            <SelectItem value="7_days">7 ngày qua</SelectItem>
            <SelectItem value="30_days">30 ngày qua</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div
        className={cn(
          "space-y-6 transition-all duration-300",
          isLoading && "opacity-40 pointer-events-none",
        )}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-none bg-emerald-500/5 shadow-xs rounded-xl">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl font-bold">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Tổng doanh thu
                </div>
                <div className="text-xl font-black tracking-tight text-emerald-600 mt-0.5">
                  {formatCurrency(totalRevenue)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none bg-blue-500/5 shadow-xs rounded-xl">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Đơn hoàn thành
                </div>
                <div className="text-xl font-black tracking-tight text-blue-600 mt-0.5">
                  {totalCompletedOrders} đơn
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none bg-amber-500/5 shadow-xs rounded-xl">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Giá trị đơn TB
                </div>
                <div className="text-xl font-black tracking-tight text-amber-600 mt-0.5">
                  {formatCurrency(averageOrderValue)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none bg-rose-500/5 shadow-xs rounded-xl">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-rose-500/10 text-rose-600 rounded-xl">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Tỷ lệ hủy đơn
                </div>
                <div className="text-xl font-black tracking-tight text-rose-600 mt-0.5">
                  {cancellationRate.toFixed(1)}%
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-xl overflow-hidden shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-bold">
              Biểu đồ xu hướng Doanh thu & Lượng đơn
            </CardTitle>
            <CardDescription>
              Theo dõi biến động dòng tiền thực thu của nhà hàng qua các mốc
              ngày.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-72 w-full">
              {revenueChartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  Không có dữ liệu dòng tiền trong khoảng thời gian này.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={revenueChartData}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      stroke="#94a3b8"
                    />
                    <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <Tooltip
                      formatter={(value: any) =>
                        typeof value === "number" && value > 1000
                          ? formatCurrency(value)
                          : value
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="Doanh thu"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorRev)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 rounded-xl overflow-hidden shadow-xs flex flex-col justify-between">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold">
                Top 5 món ăn bán chạy nhất
              </CardTitle>
              <CardDescription>
                Danh sách các món ăn mang lại khối lượng tiêu thụ cao nhất quán.
              </CardDescription>
            </CardHeader>
            <div className="p-0 border-t border-border/60 flex-1">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="pl-6">Tên món ăn</TableHead>
                    <TableHead className="text-center">
                      Số lượng đã bán
                    </TableHead>
                    <TableHead className="text-right pr-6">
                      Doanh thu mang lại
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topSellingItems.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center py-12 text-muted-foreground text-sm"
                      >
                        Chưa có dữ liệu thống kê tiêu thụ món ăn.
                      </TableCell>
                    </TableRow>
                  ) : (
                    topSellingItems.map((item: any, idx) => (
                      <TableRow key={idx} className="hover:bg-muted/20">
                        <TableCell className="font-bold pl-6 text-slate-700 dark:text-slate-200">
                          {item.name}
                        </TableCell>
                        <TableCell className="text-center font-black text-blue-600">
                          {item.quantity} phần
                        </TableCell>
                        <TableCell className="text-right pr-6 font-black text-emerald-600">
                          {formatCurrency(item.revenue)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          <Card className="rounded-xl overflow-hidden shadow-xs flex flex-col">
            <CardHeader>
              <CardTitle className="text-base font-bold">
                Cơ cấu hình thức thanh toán
              </CardTitle>
              <CardDescription>
                Tỷ trọng phân bổ dòng tiền thực thu.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col items-center justify-center p-6 pt-0">
              <div className="h-52 w-full flex items-center justify-center">
                {paymentMethodData.length === 0 ? (
                  <div className="text-muted-foreground text-sm">
                    Chưa phát sinh giao dịch tài chính
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethodData}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {paymentMethodData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => formatCurrency(value)}
                      />
                      {/* ĐÃ SỬA: Thay thế wrapperClassName bằng wrapperStyle để dập tắt gạch đỏ */}
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        wrapperStyle={{ fontSize: "12px", fontWeight: "600" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
