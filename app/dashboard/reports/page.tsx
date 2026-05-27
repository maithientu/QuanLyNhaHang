// app/dashboard/reports/page.tsx
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/dashboard/header";
import { ReportsContent } from "./reports-content";
import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/types/database";

export const revalidate = 0;
export const dynamic = "force-dynamic";

async function getInitialReportsData() {
  const supabase = await createClient();

  // Mặc định nạp dữ liệu của 7 ngày gần nhất khi vừa tải trang lần đầu tiên
  const now = new Date();
  const startDate = new Date(now.setDate(now.getDate() - 7)).toISOString();
  const endDate = new Date().toISOString();

  const [{ data: payments }, { data: allOrders }] = await Promise.all([
    supabase
      .from("payments")
      .select("*, order:orders(*)")
      .eq("status", "completed")
      .gte("created_at", startDate)
      .lte("created_at", endDate),

    supabase
      .from("orders")
      .select("*")
      .gte("created_at", startDate)
      .lte("created_at", endDate),
  ]);

  const completedOrderIds =
    payments?.map((p) => p.order_id).filter(Boolean) || [];
  let orderItems: any[] = [];

  if (completedOrderIds.length > 0) {
    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("*, menu_item:menu_items(name)")
      .in("order_id", completedOrderIds);

    if (itemsError) {
      console.error("Lỗi lấy dữ liệu order_items ban đầu:", itemsError);
    }
    orderItems = items || [];
  } else {
    orderItems = [];
  }

  return {
    initialData: {
      payments: payments || [],
      orderItems,
      allOrders: allOrders || [],
    },
  };
}

export default async function ReportsPage() {
  // ==================== ⚡LOGIC BẢO MẬT  ====================
  const supabase = await createClient();

  // 1. Lấy thông tin phiên đăng nhập hiện tại
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  // 2. Kiểm tra vai trò thực tế (Role) từ Database
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = profile?.role as UserRole;

  // 3. CHẶN QUYỀN: Nếu không phải Quản lý (manager), đá ngược về trang dashboard ngay lập tức
  if (userRole !== "manager") {
    redirect("/dashboard");
  }
  // =========================================================================

  const data = await getInitialReportsData();

  return (
    <>
      <Header title="Báo cáo doanh thu" />
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        <ReportsContent {...data} />
      </main>
    </>
  );
}
