"use client";

import { DollarSign, ShoppingCart, Clock, Grid3X3 } from "lucide-react";
import {
  StatCard,
  TableOverview,
  RecentOrders,
  TopSellingItems,
  RevenueChart,
} from "@/components/dashboard";
import { Table, Area, Order, MenuItem } from "@/lib/types/database";

interface DashboardContentProps {
  tables: (Table & { area?: Area })[];
  areas: Area[];
  recentOrders: (Order & { table?: Table })[];
  topSellingItems: (MenuItem & { total_sold: number })[];
  revenueData: { name: string; revenue: number }[];
  stats: {
    todayRevenue: number;
    todayOrders: number;
    activeOrders: number;
    occupiedTables: number;
    totalTables: number;
    availableTables: number;
    reservedTables: number;
  };
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

export function DashboardContent({
  tables,
  areas,
  recentOrders,
  topSellingItems,
  revenueData,
  stats,
}: DashboardContentProps) {
  return (
    <div className="space-y-6">
      {/* Intro banner: tạo cảm giác dashboard chuyên nghiệp hơn */}
      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
              Tổng quan quản lý
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">
              Bảng điều khiển nhà hàng
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Xem nhanh tình trạng bàn, doanh thu và đơn hàng trong ngày ngay
              trên giao diện trực quan.
            </p>
          </div>
          <div className="rounded-3xl bg-primary/10 px-4 py-3 text-sm font-semibold text-primary shadow-sm">
            Cập nhật mới nhất
          </div>
        </div>
      </section>

      {/* Stats grid: 4 chỉ số chính giúp người dùng nắm bắt nhanh */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Doanh thu hôm nay"
          value={formatCurrency(stats.todayRevenue)}
          icon={DollarSign}
          trend={{ value: 12.5, isPositive: true }}
          description="so với hôm qua"
          iconClassName="bg-primary/10 text-primary"
        />
        <StatCard
          title="Đơn hàng hôm nay"
          value={stats.todayOrders}
          icon={ShoppingCart}
          trend={{ value: 8, isPositive: true }}
          description="so với hôm qua"
          iconClassName="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
        />
        <StatCard
          title="Đơn đang xử lý"
          value={stats.activeOrders}
          icon={Clock}
          description="đang chờ phục vụ"
          iconClassName="bg-chart-4/20 text-chart-4"
        />
        <StatCard
          title="Bàn trống"
          value={`${stats.availableTables}/${stats.totalTables}`}
          icon={Grid3X3}
          description={`${stats.occupiedTables} có khách, ${stats.reservedTables} đã đặt`}
          iconClassName="bg-chart-2/20 text-chart-2"
        />
      </div>

      {/* Table overview cho phép nhìn tổng quan số bàn theo từng khu vực */}
      <TableOverview tables={tables} areas={areas} />

      {/* Biểu đồ doanh thu và danh sách bán chạy */}
      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <RevenueChart data={revenueData} />
        <TopSellingItems items={topSellingItems} />
      </div>

      {/* Danh sách đơn hàng gần đây để dễ theo dõi hoạt động */}
      <RecentOrders orders={recentOrders} />
    </div>
  );
}
