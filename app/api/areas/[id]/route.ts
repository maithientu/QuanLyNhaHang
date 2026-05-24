// app/api/areas/[id]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(request: Request, context: any) {
  try {
    const supabase = await createClient();

    const paramsResolved =
      context.params && typeof context.params.then === "function"
        ? await context.params
        : context.params;

    const id = paramsResolved?.id;

    if (!id || id === "undefined" || id === "null") {
      return NextResponse.json(
        { error: "Mã định danh khu vực (ID) không hợp lệ" },
        { status: 400 },
      );
    }

    // 🔽 BƯỚC BỔ SUNG: Chủ động đưa area_id của tất cả bàn thuộc khu vực này về null trước
    const { error: deleteTablesError } = await supabase
      .from("tables")
      .delete()
      .eq("area_id", id); // Bàn nào có area_id trùng với phòng sắp xóa -> XÓA LUÔN!

    if (deleteTablesError) {
      console.error("Lỗi xóa sạch bàn thuộc khu vực:", deleteTablesError);
      throw deleteTablesError;
    }

    // 🔽 BƯỚC 2: Sau khi các bàn đã trống lịch, tiến hành xóa hẳn khu vực
    const { error: deleteAreaError } = await supabase
      .from("areas")
      .delete()
      .eq("id", id);

    if (deleteAreaError) {
      console.error("Lỗi Supabase khi xóa khu vực:", deleteAreaError);
      throw deleteAreaError;
    }

    return NextResponse.json(
      { message: "Xóa khu vực thành công" },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
