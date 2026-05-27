import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Quy tắc Node.js 16: Sử dụng cấu trúc xử lý context để bóc tách ID an toàn thay vì await params trực tiếp
export async function PATCH(request: Request, context: any) {
  try {
    const paramsResolved =
      context.params && typeof context.params.then === "function"
        ? await context.params
        : context.params;
    const tableId = paramsResolved?.id;

    if (!tableId) {
      return NextResponse.json(
        { error: "Thiếu ID bàn cần cập nhật trạng thái" },
        { status: 400 },
      );
    }

    // Đọc dữ liệu trạng thái mới gửi lên từ phía Client
    const body = await request.json();
    const { status } = body;

    // Lọc dữ liệu rác đầu vào an toàn
    if (!status) {
      return NextResponse.json(
        { error: "Dữ liệu trạng thái không được để trống" },
        { status: 400 },
      );
    }

    // Danh sách các trạng thái hợp lệ dựa theo file types/database.ts của bạn
    const validStatuses = ["available", "occupied", "reserved", "cleaning"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Trạng thái bàn không hợp lệ" },
        { status: 400 },
      );
    }
    // Quy tắc Bảo mật RLS: Khởi tạo Supabase Server Client (Bắt buộc phải có await)
    const supabase = await createClient();

    // Thực hiện cập nhật trạng thái mới của bàn ăn trong Database Supabase
    const { data, error } = await supabase
      .from("tables")
      .update({
        status: status,
      })
      .eq("id", tableId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: `Lỗi cập nhật Supabase: ${error.message}` },
        { status: 400 },
      );
    }

    // Trả lời kết quả thành công về cho phía Client giao diện
    return NextResponse.json(
      {
        success: true,
        message: "Trạng thái bàn ăn đã được đồng bộ thành công",
        table: data,
      },
      { status: 200 },
    );
  } catch (catchError: any) {
    console.error("Lỗi hệ thống khi cập nhật trạng thái bàn:", catchError);
    return NextResponse.json(
      { error: catchError.message || "Lỗi hệ thống nội bộ" },
      { status: 500 },
    );
  }
}
