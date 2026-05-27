import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request, context: any) {
  try {
    // Quy tắc Node.js 16: Bóc tách ID an toàn từ context
    const paramsResolved =
      context.params && typeof context.params.then === "function"
        ? await context.params
        : context.params;
    const itemId = paramsResolved?.id;

    if (!itemId) {
      return NextResponse.json({ error: "Thiếu ID món ăn" }, { status: 400 });
    }

    const body = await request.json();
    const { status } = body; // Trạng thái mới: 'preparing' hoặc 'ready'

    if (!status || !["preparing", "ready", "cancelled"].includes(status)) {
      return NextResponse.json(
        { error: "Trạng thái chuyển đổi không hợp lệ" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Cập nhật trạng thái món ăn trong bảng order_items
    const { data, error } = await supabase
      .from("order_items")
      .update({ status: status, updated_at: new Date().toISOString() })
      .eq("id", itemId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, item: data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Lỗi hệ thống" },
      { status: 500 },
    );
  }
}
