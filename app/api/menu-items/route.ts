import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// 1. HÀM GET: Lấy danh sách toàn bộ món ăn (Đã gộp)
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: menuItems, error } = await supabase
    .from("menu_items")
    .select("*, category:menu_categories(*)")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(menuItems);
}

// 2. HÀM POST: Thêm món ăn mới (Đã gộp đầy đủ các cột)
export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    const body = await request.json();
    const {
      name,
      description,
      price,
      category_id,
      image_url,
      is_available,
      preparation_time, // Lấy thêm cột thời gian từ file dưới lên
    } = body;

    // Kiểm tra thông tin bắt buộc
    if (!name || !price || !category_id) {
      return NextResponse.json(
        { error: "Tên món, Giá bán và Danh mục là bắt buộc!" },
        { status: 400 },
      );
    }

    // Tiến hành lưu vào database Supabase
    const { data: newMenuItem, error } = await supabase
      .from("menu_items")
      .insert([
        {
          name,
          description,
          price,
          category_id,
          image_url,
          is_available: is_available !== undefined ? is_available : true,
          preparation_time: preparation_time || 15, // Mặc định 15 phút nếu form không nhập
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(newMenuItem, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
