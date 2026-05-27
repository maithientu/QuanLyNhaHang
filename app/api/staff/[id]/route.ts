// app/api/staff/[id]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// API: CẬP NHẬT CHỨC VỤ HOẶC TRẠNG THÁI TÀI KHOẢN NHÂN VIÊN
export async function PATCH(
  request: Request,
  context: any, // Sử dụng cấu trúc context để tương thích an toàn với Node.js 16
) {
  try {
    // 1. Khởi tạo Supabase Client từ Cookie Store (Có token đăng nhập để RLS cho qua quyền UPDATE)
    const supabase = await createClient();

    // 2. Cơ chế bóc tách params thích ứng linh hoạt phiên bản Next.js trên máy bạn
    const paramsResolved =
      context.params && typeof context.params.then === "function"
        ? await context.params
        : context.params;

    const id = paramsResolved?.id;

    // Chặn rác dữ liệu truyền từ Frontend
    if (!id || id === "undefined" || id === "null") {
      return NextResponse.json(
        { error: "Mã định danh nhân viên (ID) không hợp lệ hoặc bị thiếu" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const updateData: any = {};

    // 3. Ép kiểu bảo vệ và dọn sạch dữ liệu trước khi chèn vào database
    if (
      body.role &&
      ["manager", "cashier", "waiter", "kitchen"].includes(body.role)
    ) {
      updateData.role = String(body.role);
    }

    if (body.is_active !== undefined) {
      updateData.is_active =
        body.is_active === "undefined" || body.is_active === null
          ? true
          : Boolean(body.is_active);
    }

    updateData.updated_at = new Date().toISOString();

    // 4. Tiến hành cập nhật dữ liệu vào bảng public.profiles trên Supabase
    const { data: updatedProfile, error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) {
      console.error("Lỗi Supabase khi cập nhật thông tin nhân viên:", error);
      throw error;
    }

    // Bóc tách lấy object đầu tiên của mảng trả về
    return NextResponse.json(
      updatedProfile && updatedProfile.length > 0 ? updatedProfile[0] : null,
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
