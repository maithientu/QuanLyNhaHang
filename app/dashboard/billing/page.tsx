// app/dashboard/billing/page.tsx
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/dashboard/header";
import { BillingContent } from "./billing-content";

export const revalidate = 10;

async function getBillingData() {
  const supabase = await createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [{ data: orders }, { data: todayPayments }] = await Promise.all([
    supabase
      .from("orders")
      .select(
        `
        *,
        table:tables(*),
        items:order_items(*, menu_item:menu_items(*))
      `,
      )
      .gte("created_at", today.toISOString()) // Lấy mọi đơn trong ngày bao gồm cả 'completed'
      .order("created_at", { ascending: false }),

    supabase
      .from("payments")
      .select("*")
      .eq("status", "paid")
      .gte("created_at", today.toISOString()),
  ]);

  const todayRevenue =
    todayPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
  const todayTransactions = todayPayments?.length || 0;

  return {
    orders: orders || [],
    stats: {
      todayRevenue,
      todayTransactions,
    },
  };
}

export default async function BillingPage() {
  const { orders, stats } = await getBillingData();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      {/* ĐÃ SỬA: Xóa bỏ thuộc tính description ở đây để hết hoàn toàn gạch đỏ */}
      <Header title="Thanh toán & Hóa đơn" />

      {/* Truyền dữ liệu xuống component con kèm ép kiểu cô lập an toàn */}
      <BillingContent orders={orders as any} stats={stats} />
    </div>
  );
}
