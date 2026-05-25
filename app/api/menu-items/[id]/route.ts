// app/api/areas/[id]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server"; // ✅ SỬA DÒNG NÀY

export async function DELETE(request: Request, context: any) {
  try {
    const supabase = await createClient(); // ✅ KHỞI TẠO CÓ QUYỀN COOKIE

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

    const { error } = await supabase.from("areas").delete().eq("id", id);

    if (error) throw error;
    return NextResponse.json(
      { message: "Xóa khu vực thành công" },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
