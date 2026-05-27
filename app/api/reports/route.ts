// app/api/reports/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Mặc định khoảng thời gian 30 ngày nếu không có tham số truyền lên
    const now = new Date();
    const defaultStart = new Date(
      now.setDate(now.getDate() - 30),
    ).toISOString();
    const defaultEnd = new Date().toISOString();

    const startDate = searchParams.get("start_date") || defaultStart;
    const endDate = searchParams.get("end_date") || defaultEnd;

    // 1. Kéo dữ liệu bảng payments (Bọc bảo vệ chống lỗi)
    const { data: payments, error: payError } = await supabase
      .from("payments")
      .select("*, order:orders(*)")
      .eq("status", "completed")
      .gte("created_at", startDate)
      .lte("created_at", endDate);

    if (payError) {
      console.error("Lỗi truy vấn payments API:", payError);
      throw payError;
    }

    // 2. Kéo dữ liệu bảng order_items (Bảo vệ nghiêm ngặt chống bẫy mảng rỗng)
    const completedOrderIds =
      payments?.map((p) => p.order_id).filter(Boolean) || [];
    let orderItems: any[] = [];

    if (completedOrderIds.length > 0) {
      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select("*, menu_item:menu_items(name)")
        .in("order_id", completedOrderIds);

      if (itemsError) {
        console.error("Lỗi truy vấn order_items API:", itemsError);
        throw itemsError;
      }
      orderItems = items || [];
    }

    // 3. Kéo dữ liệu bảng orders (Thêm khối try/catch nhỏ bảo vệ)
    let allOrders: any[] = [];
    try {
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (ordersError) throw ordersError;
      allOrders = orders || [];
    } catch (err) {
      console.error("Lỗi truy vấn orders tổng quát:", err);
      allOrders = []; // Fallback về mảng rỗng thay vì làm crash sập cả API
    }

    // Trả về cục dữ liệu sạch sẽ, chuẩn cấu trúc mảng cho Client
    return NextResponse.json(
      {
        payments: payments || [],
        orderItems: orderItems || [],
        allOrders: allOrders || [],
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Lỗi tổng quát tại API Reports:", error);
    // Trả về dữ liệu trống mặc định an toàn cho Client hiển thị 0đ thay vì bắn lỗi 500
    return NextResponse.json(
      {
        payments: [],
        orderItems: [],
        allOrders: [],
        message: error.message,
      },
      { status: 200 },
    ); // Ép về mã thành công 200 để frontend không nhảy vào khối báo lỗi alert
  }
}
