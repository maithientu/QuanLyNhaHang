// app/api/tables/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server"; // ✅ Sử dụng cookie client chính chủ

// 1. POST: Tạo bàn mới (+ Thêm bàn)
export async function POST(request: Request) {
  try {
    const supabase = await createClient(); // Khởi tạo có token đăng nhập
    const body = await request.json();
    const { name, area_id, capacity } = body;

    if (!name || !area_id) {
      return NextResponse.json(
        { error: "Thiếu thông tin tên bàn hoặc mã khu vực" },
        { status: 400 },
      );
    }

    // Tiến hành chèn dữ liệu vào bảng tables trên Supabase
    const { data, error } = await supabase
      .from("tables")
      .insert([
        {
          name: String(name).trim(),
          area_id: String(area_id),
          capacity: Number(capacity) || 4,
          status: "available", // Mặc định bàn mới tạo sẽ ở trạng thái Trống
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Lỗi Supabase tạo bàn:", error);
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
