import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Table } from "@/lib/types/database";

// Quy tắc Node.js 16: Bóc tách ID an toàn từ context
export async function GET(request: Request, context: any) {
  try {
    const paramsResolved =
      context.params && typeof context.params.then === "function"
        ? await context.params
        : context.params;
    const tableId = paramsResolved?.id;

    if (!tableId) {
      return NextResponse.json(
        { error: "Thiếu ID bàn cần kiểm tra" },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Lấy trạng thái thực tế mới nhất của bàn từ database
    const { data: table, error } = await supabase
      .from("tables")
      .select("status, name")
      .eq("id", tableId)
      .single();

    if (error || !table) {
      return NextResponse.json(
        { error: "Bàn ăn không tồn tại trên hệ thống" },
        { status: 404 },
      );
    }

    const currentTable = table as Table;

    // 🚨 BIỆN PHÁP BẢO VỆ: Nếu bàn đang có khách hoặc đang dọn dẹp, lập tức CHẶN TRUY CẬP
    if (currentTable.status === "occupied") {
      return NextResponse.json(
        {
          valid: false,
          error: `Mã QR hiện tại không khả dụng. ${currentTable.name} đang có khách đang ngồi ăn!`,
        },
        { status: 400 },
      );
    }

    if (currentTable.status === "cleaning") {
      return NextResponse.json(
        {
          valid: false,
          error: `Mã QR hiện tại không khả dụng. ${currentTable.name} đang trong quá trình dọn dẹp!`,
        },
        { status: 400 },
      );
    }

    // Nếu bàn trống hoặc đặt trước, cho phép khách hàng vào đặt món ăn
    return NextResponse.json({ valid: true, tableName: currentTable.name });
  } catch (error) {
    console.error("Lỗi kiểm tra mã QR bàn:", error);
    return NextResponse.json({ error: "Lỗi máy chủ nội bộ" }, { status: 500 });
  }
}
