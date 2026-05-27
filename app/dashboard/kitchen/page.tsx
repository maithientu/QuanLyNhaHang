import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/dashboard/header";
import { KitchenContent } from "./kitchen-content";
import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/types/database";

export const revalidate = 5;

async function getKitchenData() {
  const supabase = await createClient();

  const { data: orders } = await supabase
    .from("orders")
    .select(
      `
      *,
      table:tables(*),
      items:order_items(*, menu_item:menu_items(*))
    `,
    )
    .in("status", ["pending", "confirmed", "preparing", "ready"])
    .order("created_at", { ascending: true });

  return {
    orders: orders || [],
  };
}

export default async function KitchenPage() {
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

  // 3. CHẶN QUYỀN: Nếu không phải Quản lý (manager) hoặc bếp (kitchen), đá ngược về trang dashboard ngay lập tức
  if (userRole !== "manager" && userRole !== "kitchen") {
    redirect("/dashboard");
  }
  // =========================================================================

  const data = await getKitchenData();

  return (
    <>
      <Header title="Màn hình bếp (KDS)" />
      <main className="flex-1 p-4 md:p-6 overflow-auto bg-muted/30">
        <KitchenContent {...data} />
      </main>
    </>
  );
}
