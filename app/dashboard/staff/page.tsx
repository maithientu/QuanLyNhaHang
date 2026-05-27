// app/dashboard/staff/page.tsx
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/dashboard/header";
import { StaffContent } from "./staff-content";
import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/types/database";

export const revalidate = 0;
export const dynamic = "force-dynamic";

async function getStaffData() {
  const supabase = await createClient();

  // Lấy toàn bộ danh sách hồ sơ nhân viên trong hệ thống
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Lỗi khi lấy danh sách nhân viên:", error);
  }

  return {
    profiles: profiles || [],
  };
}

export default async function StaffPage() {
  // ==================== ⚡LOGIC BẢO MẬT  ====================
  const supabase = await createClient();

  // 1. Lấy thông tin phiên đăng nhập hiện tại
  const { data: { user } } = await supabase.auth.getUser();
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

  const data = await getStaffData();

  return (
    <>
      <Header title="Quản lý nhân viên" />
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        <StaffContent {...data} />
      </main>
    </>
  );
}
