import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  try {
    // 1. Quy tắc Bảo mật RLS: Khởi tạo Supabase Server Client bắt buộc có await
    const supabase = await createClient();

    // Đọc thông tin đơn hàng và trạng thái cần chuyển đổi
    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: "Thiếu thông tin ID đơn hàng hoặc trạng thái cập nhật" },
        { status: 400 },
      );
    }

    // 2. Thanh lọc dữ liệu rác đầu vào an toàn theo tệp kiểu dữ liệu của bạn
    const validStatuses = [
      "pending",
      "confirmed",
      "preparing",
      "ready",
      "served",
      "completed",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Trạng thái đơn hàng không hợp lệ" },
        { status: 400 },
      );
    }

    // Tiến hành cập nhật trạng thái đơn hàng trong database Supabase
    const { data, error } = await supabase
      .from("orders")
      .update({ status: status, updated_at: new Date().toISOString() })
      .eq("id", orderId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Nếu đơn hàng chuyển sang trạng thái "Sẵn sàng" (ready), tự động cập nhật tất cả món ăn con thành "ready"
    if (status === "ready") {
      await supabase
        .from("order_items")
        .update({ status: "ready" })
        .eq("order_id", orderId);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Cập nhật trạng thái đơn hàng thành công",
        order: data,
      },
      { status: 200 },
    );
  } catch (catchError: any) {
    console.error("Lỗi API Nhà bếp:", catchError);
    return NextResponse.json(
      { error: catchError.message || "Lỗi hệ thống nội bộ" },
      { status: 500 },
    );
  }
}
