// app/dashboard/reports/page.tsx
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/dashboard/header";
import { ReportsContent } from "./reports-content";
import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/types/database";

export const revalidate = 0;
export const dynamic = "force-dynamic";

// Hàm xử lý lấy dữ liệu báo cáo ban đầu phía Server (Mặc định 7 ngày gần nhất)
async function getInitialReportsData() {
  const supabase = await createClient();

  // Khởi tạo khoảng thời gian độc lập một cách an toàn
  const now = new Date();
  const endDate = new Date().toISOString();
  
  // Tránh lỗi tham chiếu vùng nhớ bằng cách khởi tạo đối tượng Date mới hoàn toàn
  const pastDate = new Date();
  pastDate.setDate(now.getDate() - 7);
  const startDate = pastDate.toISOString();

  // Chạy song song 2 câu query tối ưu hóa tốc độ tải trang
  const [{ data: payments }, { data: allOrders }] = await Promise.all([
    supabase
      .from("payments")
      .select("*, order:orders(*)")
      // ĐÃ SỬA: Chuyển đổi trạng thái từ 'completed' thành 'paid' theo đúng cấu trúc thực tế của bảng payments
      .eq("status", "paid")
      .gte("created_at", startDate)
      .lte("created_at", endDate),

    supabase
      .from("orders")
      .select("*")
      .gte("created_at", startDate)
      .lte("created_at", endDate),
  ]);

  // Trích xuất danh sách ID của các đơn hàng đã được đối soát thanh toán thành công
  const completedOrderIds = payments?.map((p) => p.order_id).filter(Boolean) || [];
  let orderItems: any[] = [];

  // Chỉ tiến hành query bảng order_items nếu có đơn hàng hoàn thành để tránh lỗi syntax SQL
  if (completedOrderIds.length > 0) {
    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("*, menu_item:menu_items(name)")
      .in("order_id", completedOrderIds);

    if (itemsError) {
      console.error("Lỗi lấy dữ liệu order_items ban đầu:", itemsError);
    }
    orderItems = items || [];
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
  // ==================== ⚡ LOGIC BẢO MẬT & PHÂN QUYỀN ====================
  const supabase = await createClient();

  // 1. Kiểm tra xác thực phiên đăng nhập của người dùng
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

  // 2. Truy vấn phân hệ quyền hạn (Role) từ bảng profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = profile?.role as UserRole;

  // 3. CHẶN QUYỀN NGHIÊM NGẶT: Nếu không phải Quản lý (manager), đá văng về màn hình chính
  if (userRole !== "manager") {
    redirect("/dashboard");
  }
  // =========================================================================

  // Nạp dữ liệu báo cáo tầng server
  const data = await getInitialReportsData();

  return (
    <>
      {/* ĐÃ SỬA: Giữ lại cấu trúc Header gọn gàng không lỗi thuộc tính */}
      <Header title="Báo cáo doanh thu" />
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        {/* Khởi tạo phân hệ hiển thị báo cáo phía Client */}
        <ReportsContent {...data} />
      </main>
    </>
  );
}