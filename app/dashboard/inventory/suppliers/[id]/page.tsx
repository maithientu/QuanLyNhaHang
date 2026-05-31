import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/dashboard/header";
import { SupplierDetailContent } from "./supplier-detail-content";
import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/types/database";

export const revalidate = 0;
export const dynamic = "force-dynamic";

async function getSupplierLedgerData(supplierId: string) {
  const supabase = await createClient();

  // Kéo song song: Thông tin hồ sơ NCC, lịch sử sổ cái công nợ, và nhật ký các phiếu nhập hàng thật của NCC đó
  const [{ data: supplier }, { data: ledger }, { data: purchaseOrders }] =
    await Promise.all([
      supabase.from("suppliers").select("*").eq("id", supplierId).single(),
      supabase
        .from("supplier_debt_ledger")
        .select("*")
        .eq("supplier_id", supplierId)
        .order("created_at", { ascending: false }),
      supabase
        .from("purchase_orders")
        .select(
          "id, po_number, final_amount, paid_amount, payment_status, status, created_at",
        )
        .eq("supplier_id", supplierId)
        .order("created_at", { ascending: false }),
    ]);

  return {
    supplier: supplier || null,
    ledger: ledger || [],
    purchaseOrders: purchaseOrders || [], // Nạp mảng phiếu nhập thật vào cổng trả dữ liệu
  };
}

export default async function SupplierDetailPage(context: any) {
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
  if (profile?.role !== "manager") redirect("/dashboard");
  // =========================================================================

  // 🛠️ Quy tắc Node.js 16: Giải quyết context params an toàn không dùng await trực tiếp
  const paramsResolved =
    context.params && typeof context.params.then === "function"
      ? await context.params
      : context.params;
  const id = paramsResolved?.id;

  if (!id) redirect("/dashboard/inventory/suppliers");

  const data = await getSupplierLedgerData(id);

  if (!data.supplier) {
    redirect("/dashboard/inventory/suppliers"); // Nếu ID bừa bãi không có thực, đá về trang danh sách
  }

  return (
    <>
      <Header title={`Hồ sơ: ${data.supplier.name}`} />
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        {/* Đổ kèm mảng purchaseOrders thật thu được xuống Client Component */}
        <SupplierDetailContent
          supplier={data.supplier}
          ledger={data.ledger}
          purchaseOrders={data.purchaseOrders}
        />
      </main>
    </>
  );
}
