// app/api/tables/[id]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server"; // ✅ ĐỔI THÀNH IMPORT FILE NÀY CỦA BẠN

// API: CẬP NHẬT TRẠNG THÁI / THÔNG TIN BÀN
export async function PATCH(request: Request, context: any) {
  try {
    // 1. Khởi tạo Supabase Client có quyền Authenticated từ Cookie Store
    const supabase = await createClient();

    // 2. Bóc tách params an toàn theo cơ chế thích ứng phiên bản
    const paramsResolved =
      context.params && typeof context.params.then === "function"
        ? await context.params
        : context.params;

    const id = paramsResolved?.id;

    if (!id || id === "undefined" || id === "null") {
      return NextResponse.json(
        { error: "Mã định danh bàn (ID) không hợp lệ hoặc bị thiếu" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const updateData: any = {};

    // 3. Thanh lọc dữ liệu sạch
    if (body.name) updateData.name = String(body.name).trim();
    if (body.capacity) updateData.capacity = Number(body.capacity);

    if (
      body.status &&
      String(body.status) !== "undefined" &&
      String(body.status) !== "null"
    ) {
      updateData.status = String(body.status);
    }

    if (
      body.area_id &&
      String(body.area_id) !== "undefined" &&
      String(body.area_id) !== "null"
    ) {
      updateData.area_id = String(body.area_id);
    }

    if (body.is_active !== undefined) {
      updateData.is_active =
        body.is_active === "undefined" || body.is_active === null
          ? true
          : Boolean(body.is_active);
    }

    // 4. Tiến hành cập nhật vào Database (Lúc này có token đăng nhập nên RLS sẽ cho qua)
    const { data: updatedTable, error } = await supabase
      .from("tables")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) {
      console.error("Lỗi Supabase nhận được:", error);
      throw error;
    }

    return NextResponse.json(
      updatedTable && updatedTable.length > 0 ? updatedTable[0] : null,
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// API: XÓA BÀN
export async function DELETE(request: Request, context: any) {
  try {
    const supabase = await createClient(); // ✅ ĐỔI ĐỒNG BỘ Ở ĐÂY

    const paramsResolved =
      context.params && typeof context.params.then === "function"
        ? await context.params
        : context.params;

    const id = paramsResolved?.id;

    if (!id || id === "undefined" || id === "null") {
      return NextResponse.json(
        { error: "Mã định danh bàn (ID) không hợp lệ" },
        { status: 400 },
      );
    }

    const { error } = await supabase.from("tables").delete().eq("id", id);

    if (error) throw error;
    return NextResponse.json(
      { message: "Xóa bàn thành công" },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
