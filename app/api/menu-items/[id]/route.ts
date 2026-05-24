import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// 1. API: CHỈNH SỬA MÓN (Dành cho nút Chỉnh sửa)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { id } = await params;

  try {
    const body = await request.json();

    // 1. Chỉ lọc ra các trường dữ liệu text/số cơ bản an toàn để đưa vào database
    const updateData: any = {};

    if (body.name) updateData.name = String(body.name);
    if (body.description) updateData.description = String(body.description);
    if (body.price) updateData.price = Number(body.price);
    if (body.preparation_time)
      updateData.preparation_time = Number(body.preparation_time);

    // 2. ÉP KIỂU BẢO VỆ CHO CỘT TRẠNG THÁI (is_available hoặc available)
    // Nếu giá trị gửi lên bị biến thành chữ "undefined" (string), ta gán cứng về true/false dựa theo logic
    if (body.is_available !== undefined) {
      if (body.is_available === "undefined" || body.is_available === null) {
        updateData.is_available = true; // Giá trị mặc định an toàn nếu lỗi giao diện
      } else {
        updateData.is_available = Boolean(body.is_available); // Ép về kiểu true/false chuẩn
      }
    }

    // 3. ÉP KIỂU BẢO VỆ CHO KHÓA NGOẠI CATEGORY_ID
    // Tuyệt đối không cho phép chuỗi chữ "undefined" lọt vào database
    if (
      body.category_id &&
      String(body.category_id) !== "undefined" &&
      String(body.category_id) !== "null"
    ) {
      updateData.category_id = String(body.category_id).trim();
    }

    // 4. Tiến hành cập nhật cục dữ liệu siêu sạch đã được thanh lọc
    const { data: updatedItem, error } = await supabase
      .from("menu_items")
      .update(updateData)
      .eq("id", id)
      .select(); // Bỏ hoàn toàn .single() để tránh bẫy lỗi mảng rỗng

    if (error) {
      // Nếu Supabase vẫn chê dữ liệu lỗi, ta in hẳn lỗi gốc của nó ra terminal máy tính để xem
      console.error("Lỗi Supabase nhận được:", error);
      throw error;
    }

    return NextResponse.json(updatedItem ? updatedItem : null);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 2. API: XÓA MÓN (Dành cho nút Hủy món)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { id } = await params;

  try {
    const { error } = await supabase.from("menu_items").delete().eq("id", id); // Tìm đúng món có id này để xóa

    if (error) throw error;

    return NextResponse.json(
      { message: "Xóa món ăn thành công" },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
