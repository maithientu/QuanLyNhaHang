// app/api/areas/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server"; // ✅ Gọi client quản lý cookie

// 1. POST: Tạo khu vực / phòng mới
export async function POST(request: Request) {
  try {
    const supabase = await createClient(); // Khởi tạo có token bảo mật
    const body = await request.json();
    const { name, sort_order } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Tên phòng/khu vực không được để trống" },
        { status: 400 },
      );
    }

    // Thực hiện chèn dữ liệu thực tế vào bảng areas trên Supabase
    const { data, error } = await supabase
      .from("areas")
      .insert([
        {
          name: String(name).trim(),
          sort_order: Number(sort_order) || 0,
          is_active: true, // Mặc định phòng mới tạo sẽ ở trạng thái hoạt động
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Lỗi Supabase tạo khu vực:", error);
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
