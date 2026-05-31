import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { UserRole } from "@/lib/types/database";

export async function POST(request: Request) {
  const supabase = await createClient();

  // ==================== ⚡ LOGIC BẢO MẬT PHÂN QUYỀN ====================
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Chưa đăng nhập hệ thống" },
      { status: 401 },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = profile?.role as UserRole;
  if (userRole !== "manager") {
    return NextResponse.json(
      { error: "Không có quyền truy cập chức năng này" },
      { status: 403 },
    );
  }
  // =========================================================================

  try {
    const body = await request.json();
    const { code, name, base_uom, min_stock_level, category_id } = body;

    if (!name || !base_uom || !category_id) {
      return NextResponse.json(
        { error: "Thiếu thông tin bắt buộc (Tên, Đơn vị gốc, Nhóm)" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("ingredients")
      .insert([
        {
          code: code ? String(code).trim() : null,
          name: String(name).trim(),
          base_uom: String(base_uom).trim(),
          min_stock_level: Number(min_stock_level) || 0,
          category_id: category_id,
        },
      ])
      .select(
        `
        id, code, name, base_uom, min_stock_level, category_id,
        ingredient_categories ( name )
      `,
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // TODO: Hoàn thiện logic xử lý kho phụ trợ sau
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: "Lỗi hệ thống nội bộ" }, { status: 500 });
  }
}
