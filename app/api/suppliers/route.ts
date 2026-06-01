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
    const { name, phone, email, address } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Tên nhà cung cấp không được bỏ trống" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("suppliers")
      .insert([
        {
          name: String(name).trim(),
          phone: phone ? String(phone).trim() : null,
          email: email ? String(email).trim() : null,
          address: address ? String(address).trim() : null,
          current_debt: 0.0,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // TODO: Hoàn thiện logic sổ cái công nợ sau
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: "Lỗi hệ thống nội bộ" }, { status: 500 });
  }
}
