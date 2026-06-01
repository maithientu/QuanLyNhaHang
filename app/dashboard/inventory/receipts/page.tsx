import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/dashboard/header";
import { ReceiptsContent } from "./receipts-content";
import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/types/database";

export const revalidate = 0;
export const dynamic = "force-dynamic";

async function getInitialReceiptsData() {
  const supabase = await createClient();

  // Kéo dữ liệu mồi song song từ hệ thống đổ vào Form lựa chọn
  const [
    { data: ingredients },
    { data: warehouses },
    { data: suppliers },
    { data: recentReceipts },
  ] = await Promise.all([
    supabase
      .from("ingredients")
      .select(
        `
        id, 
        name, 
        base_uom, 
        code,
        uom_conversions (
          alternative_uom,
          conversion_factor
        )
      `,
      ) // ➔ Đã bổ sung cấu trúc lấy kèm danh sách đơn vị quy đổi của từng vật tư
      .order("name"),
    supabase.from("warehouses").select("id, name").eq("is_active", true),
    supabase
      .from("suppliers")
      .select("id, name, current_debt")
      .eq("is_active", true),
    supabase
      .from("purchase_orders")
      .select(
        `
      id, po_number, final_amount, paid_amount, payment_status, created_at,
      suppliers ( name ),
      warehouses ( name )
    `,
      )
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  return {
    ingredients: ingredients || [],
    warehouses: warehouses || [],
    suppliers: suppliers || [],
    recentReceipts: recentReceipts || [],
  };
}

export default async function ReceiptsPage() {
  // ==================== ⚡ LOGIC BẢO MẬT PHÂN QUYỀN ====================
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const userRole = profile?.role as UserRole;
  if (userRole !== "manager") redirect("/dashboard");
  // =========================================================================

  const data = await getInitialReceiptsData();

  return (
    <>
      <Header title="Nhập kho & Chứng từ" />
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        <ReceiptsContent {...data} />
      </main>
    </>
  );
}
