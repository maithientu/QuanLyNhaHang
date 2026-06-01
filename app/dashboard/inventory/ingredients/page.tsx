import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/dashboard/header";
import { IngredientsContent } from "./ingredients-content";
import { redirect } from "next/navigation";
import type { UserRole } from "@/lib/types/database";

export const revalidate = 0;
export const dynamic = "force-dynamic";

async function getInitialIngredientsData() {
  const supabase = await createClient();

  // 🛠️ TÁCH TRUY VẤN: Kéo dữ liệu từ 4 bảng riêng biệt song song để tránh lỗi cú pháp JOIN của Supabase
  const [
    { data: categories, error: catError },
    { data: ingredients, error: ingError },
    { data: stocks, error: stockError },
    { data: batches, error: batchError },
  ] = await Promise.all([
    supabase
      .from("ingredient_categories")
      .select("id, name, description")
      .order("name"),
    supabase
      .from("ingredients")
      .select(
        `
        id, code, name, base_uom, min_stock_level, category_id,
        ingredient_categories ( name )
      `,
      )
      .order("name"),
    supabase
      .from("inventory_stock")
      .select("ingredient_id, total_inventory, warehouse_id"),
    supabase
      .from("inventory_batches")
      .select(
        "id, ingredient_id, batch_code, received_at, current_quantity, expiry_date",
      ),
  ]);

  if (catError) console.error("Lỗi lấy danh mục:", catError);
  if (ingError) console.error("Lỗi lấy nguyên liệu gốc:", ingError);
  if (stockError) console.error("Lỗi lấy tồn kho tổng:", stockError);
  if (batchError) console.error("Lỗi lấy lô hàng:", batchError);

  // 🧠 ENGINE ĐỒNG BỘ DỮ LIỆU LÕI (Client-side Data Aggregation)
  const formattedIngredients = (ingredients || []).map((ing: any) => {
    let catInfo = null;

    // Giữ nguyên 100% logic xử lý ép kiểu danh mục mượt mà cũ của bạn
    if (Array.isArray(ing.ingredient_categories)) {
      catInfo = ing.ingredient_categories[0]
        ? { name: String(ing.ingredient_categories[0].name) }
        : null;
    } else if (ing.ingredient_categories) {
      catInfo = { name: String(ing.ingredient_categories.name) };
    }

    // 1. Tự động lọc và tính tổng số lượng tồn của vật tư này từ bảng stock
    const matchingStocks = (stocks || []).filter(
      (s) => s.ingredient_id === ing.id,
    );
    const totalStock = matchingStocks.reduce(
      (sum, s) => sum + (Number(s.total_inventory) || 0),
      0,
    );
    const firstWarehouseId =
      matchingStocks.length > 0 ? matchingStocks[0].warehouse_id : null;

    // 2. Tự động lọc ra danh sách các lô hàng đang tồn của vật tư này từ bảng batches
    const matchingBatches = (batches || [])
      .filter((b) => b.ingredient_id === ing.id)
      .map((b) => ({
        id: b.id,
        batch_code: b.batch_code,
        received_at: b.received_at,
        current_quantity: Number(b.current_quantity) || 0,
        expiry_date: b.expiry_date,
      }));

    return {
      id: ing.id,
      code: ing.code,
      name: ing.name,
      base_uom: ing.base_uom,
      min_stock_level: ing.min_stock_level,
      category_id: ing.category_id,
      ingredient_categories: catInfo,

      // Khai báo các thuộc tính mở rộng đồng bộ chuẩn chỉnh phục vụ giao diện
      total_inventory: totalStock,
      warehouse_id: firstWarehouseId,
      inventory_batches: matchingBatches,
    };
  });

  return {
    initialCategories: categories || [],
    initialIngredients: formattedIngredients,
  };
}

export default async function IngredientsPage() {
  // ==================== ⚡ LOGIC BẢO MẬT PHÂN QUYỀN ====================
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth/login");
  }

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

  const data = await getInitialIngredientsData();

  return (
    <>
      <Header title="Danh mục nguyên liệu" />
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        <IngredientsContent
          initialCategories={data.initialCategories}
          initialIngredients={data.initialIngredients}
        />
      </main>
    </>
  );
}
