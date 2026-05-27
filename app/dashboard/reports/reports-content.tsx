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
} from "lucide-react";

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

  // Định dạng tiền tệ VND
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Xử lý gọi API lấy dữ liệu động khi người quản trị thay đổi ô Select khoảng thời gian
  const handleTimeRangeChange = async (value: string) => {
    setTimeRange(value);
    const now = new Date();
    let startDate = new Date();

    if (value === "today") startDate = new Date(now.setHours(0, 0, 0, 0));
    else if (value === "7_days")
      startDate = new Date(now.setDate(now.getDate() - 7));
    else if (value === "30_days")
      startDate = new Date(now.setDate(now.getDate() - 30));

    try {
      const response = await fetch(
        `/api/reports?start_date=${startDate.toISOString()}&end_date=${new Date().toISOString()}`,
      );
      if (!response.ok) throw new Error("Không thể tải dữ liệu báo cáo");
      const result = await response.json();
      setData(result);
    } catch (error: any) {
      alert(error.message);
    }
  };

  // --- LOGIC 1: TÍNH TOÁN CÁC CHỈ SỐ KPI CHÍNH ---
  const totalRevenue = (data.payments || []).reduce(
    (sum, p) => sum + Number(p.amount),
    0,
  );
  const totalCompletedOrders = (data.payments || []).length;
  const averageOrderValue =
    totalCompletedOrders > 0 ? totalRevenue / totalCompletedOrders : 0;
  const cancelledOrders = data.allOrders.filter(
    (o) => o.status === "cancelled",
  ).length;
  const cancellationRate =
    data.allOrders.length > 0
      ? (cancelledOrders / data.allOrders.length) * 100
      : 0;

  // --- LOGIC 2: XỬ LÝ DỮ LIỆU BIỂU ĐỒ DOANH THU THEO NGÀY ---
  const revenueChartData = Object.values(
    data.payments.reduce((acc: any, p) => {
      const dateLabel = new Date(p.created_at).toLocaleDateString("vi-VN", {
        month: "2-digit",
        day: "2-digit",
      });
      if (!acc[dateLabel]) {
        acc[dateLabel] = { date: dateLabel, "Doanh thu": 0, "Đơn hàng": 0 };
      }
      acc[dateLabel]["Doanh thu"] += Number(p.amount);
      acc[dateLabel]["Đơn hàng"] += 1;
      return acc;
    }, {}),
  ).sort((a: any, b: any) => a.date.localeCompare(b.date));

  // --- LOGIC 3: XỬ LÝ DỮ LIỆU PHƯƠNG THỨC THANH TOÁN (PIE CHART) ---
  const paymentMethodData = Object.values(
    data.payments.reduce((acc: any, p) => {
      const method =
        p.payment_method === "cash"
          ? "Tiền mặt"
          : p.payment_method === "bank_transfer"
            ? "Chuyển khoản"
            : "Khác";
      if (!acc[method]) acc[method] = { name: method, value: 0 };
      acc[method].value += Number(p.amount);
      return acc;
    }, {}),
  );

  // --- LOGIC 4: TÍNH TOÁN DANH SÁCH TOP MÓN ĂN BÁN CHẠY ---
  const topSellingItems = Object.values(
    (data.orderItems || []).reduce((acc: any, item) => {
      const itemName = item.menu_item?.name || "Món ăn đã bị xóa";
      if (!acc[itemName]) {
        acc[itemName] = { name: itemName, quantity: 0, revenue: 0 };
      }
      acc[itemName].quantity += item.quantity;
      acc[itemName].revenue += Number(item.total_price);
      return acc;
    }, {}),
  )
    .sort((a: any, b: any) => b.quantity - a.quantity)
    .slice(0, 5); // Chỉ lấy đúng Top 5 món đứng đầu

  return (
    <div className="space-y-6">
      {/* Ô lọc thời gian cấu trúc Flexbox chuẩn */}
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-border/60">
        <div>
          <h3 className="font-semibold text-lg">Khoảng thời gian thống kê</h3>
        </div>
        <Select value={timeRange} onValueChange={handleTimeRangeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Chọn thời gian" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hôm nay</SelectItem>
            <SelectItem value="7_days">7 ngày qua</SelectItem>
            <SelectItem value="30_days">30 ngày qua</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 1. Hàng Thống kê Chỉ số chính (KPI Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-emerald-500/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                Tổng doanh thu
              </div>
              <div className="text-xl font-bold tracking-tight text-emerald-600">
                {formatCurrency(totalRevenue)}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-500/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                Đơn hoàn thành
              </div>
              <div className="text-xl font-bold tracking-tight text-blue-600">
                {totalCompletedOrders} đơn
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                Giá trị đơn trung bình
              </div>
              <div className="text-xl font-bold tracking-tight text-amber-600">
                {formatCurrency(averageOrderValue)}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-500/30">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-red-500/10 text-red-600 rounded-xl">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Tỷ lệ hủy đơn</div>
              <div className="text-xl font-bold tracking-tight text-red-600">
                {cancellationRate.toFixed(1)}%
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Biểu đồ xu hướng Doanh thu (Area Chart) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">
            Biểu đồ xu hướng Doanh thu & Lượng khách
          </CardTitle>
          <CardDescription>
            Theo dõi biến động dòng tiền thực thu của nhà hàng qua các mốc ngày.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-72 w-full">
            {revenueChartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Không có dữ liệu trong khoảng thời gian này.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={revenueChartData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cột trái: Top 5 món bán chạy nhất */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base font-bold">
            Top 5 món ăn bán chạy nhất
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 border-t border-border/60">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="pl-6">Tên món ăn</TableHead>
                <TableHead className="text-center">Số lượng đã bán</TableHead>
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
                    className="text-center py-6 text-muted-foreground"
                  >
                    Chưa có dữ liệu tiêu thụ món ăn.
                  </TableCell>
                </TableRow>
              ) : (
                topSellingItems.map((item: any, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium pl-6">
                      {item.name}
                    </TableCell>
                    <TableCell className="text-center font-semibold text-blue-600">
                      {item.quantity} phần
                    </TableCell>
                    <TableCell className="text-right pr-6 font-medium text-emerald-600">
                      {formatCurrency(item.revenue)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cột phải: Cơ cấu nguồn tiền thanh toán */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">
            Cơ cấu hình thức thanh toán
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6 pt-0">
          <div className="h-48 w-full flex items-center justify-center">
            {paymentMethodData.length === 0 ? (
              <div className="text-muted-foreground text-sm">
                Chưa phát sinh giao dịch
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {paymentMethodData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
