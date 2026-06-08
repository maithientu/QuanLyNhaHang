// app/api/reports/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Trích xuất các tham số khoảng thời gian từ URL query string
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Thiếu tham số dữ liệu start_date hoặc end_date" },
        { status: 400 },
      );
    }

    // Chạy song song truy vấn dữ liệu từ bảng payments và orders
    const [
      { data: payments, error: paymentsError },
      { data: allOrders, error: ordersError },
    ] = await Promise.all([
      supabase
        .from("payments")
        .select("*, order:orders(*)")
        // ĐÃ SỬA CHÍNH XÁC: Đổi trạng thái từ 'completed' sang 'paid' để đồng bộ với Database thực tế của bạn
        .eq("status", "paid")
        .gte("created_at", startDate)
        .lte("created_at", endDate),

      supabase
        .from("orders")
        .select("*")
        .gte("created_at", startDate)
        .lte("created_at", endDate),
    ]);

    if (paymentsError) throw paymentsError;
    if (ordersError) throw ordersError;

    // Trích xuất danh sách ID của các đơn hàng đã thanh toán thành công
    const completedOrderIds =
      payments?.map((p) => p.order_id).filter(Boolean) || [];
    let orderItems: any[] = [];

    // Chỉ truy vấn bảng chi tiết món ăn nếu có tồn tại đơn hàng hoàn tất
    if (completedOrderIds.length > 0) {
      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select("*, menu_item:menu_items(name)")
        .in("order_id", completedOrderIds);

      if (itemsError) throw itemsError;
      orderItems = items || [];
    }

    // Trả về cấu trúc JSON đồng bộ hoàn chỉnh cho phía Client nhận diện
    return NextResponse.json({
      payments: payments || [],
      orderItems,
      allOrders: allOrders || [],
    });
  } catch (error: any) {
    console.error("Lỗi xử lý API API_Reports_Route:", error);
    return NextResponse.json(
      { error: error.message || "Đã xảy ra lỗi hệ thống nội bộ." },
      { status: 500 },
    );
  }
}
