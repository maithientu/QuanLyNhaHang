// app/Inventory/suppliers/page.tsx
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/dashboard/header";
import { SuppliersContent } from "./suppliers-content";
import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/types/database";

export const revalidate = 0;
export const dynamic = "force-dynamic";

async function getInitialSuppliersData() {
  const supabase = await createClient();

  const { data: suppliers, error } = await supabase
    .from("suppliers")
    .select("id, name, phone, email, address, current_debt, is_active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Lỗi lấy danh sách nhà cung cấp ban đầu:", error);
  }

  return {
    initialSuppliers: suppliers || [],
  };
}

export default async function SuppliersPage() {
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

  if (userRole !== "manager") {
    redirect("/dashboard");
  }
  // =========================================================================

  const data = await getInitialSuppliersData();

  return (
    <>
      <Header title="Quản lý nhà cung cấp" />
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        <SuppliersContent initialSuppliers={data.initialSuppliers} />
      </main>
    </>
  );
}
