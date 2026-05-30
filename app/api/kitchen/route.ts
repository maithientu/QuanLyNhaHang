import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    // Nhận thêm orderId để xử lý kiểm tra tự động toàn đơn hàng
    const { orderItemId, orderId, status } = body;

    // TRƯỜNG HỢP 1: Cập nhật nút lớn - Phục vụ toàn bộ đơn hàng
    if (orderId && !orderItemId && status === "served") {
      const { data: updatedOrder, error: orderError } = await supabase
        .from("orders")
        .update({ status: "served", updated_at: new Date().toISOString() })
        .eq("id", orderId)
        .select()
        .single();

      if (orderError) return NextResponse.json({ error: orderError.message }, { status: 400 });

      // Tự động chuyển tất cả các món con của đơn này thành served luôn
      await supabase
        .from("order_items")
        .update({ status: "served" })
        .eq("order_id", orderId);

      return NextResponse.json({ success: true, message: "Đã phục vụ toàn bộ đơn hàng", order: updatedOrder });
    }

    // TRƯỜNG HỢP 2: Cập nhật trạng thái của từng món ăn lẻ
    if (!orderItemId || !status) {
      return NextResponse.json({ error: "Thiếu thông tin cập nhật món ăn" }, { status: 400 });
    }

    // Thanh lọc dữ liệu rác theo đúng kiểu dữ liệu ORDER_ITEM_STATUS bạn đã cung cấp
    const validStatuses = ["pending", "preparing", "ready", "served", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Trạng thái món ăn không hợp lệ" }, { status: 400 });
    }

    // 1. Cập nhật trạng thái món ăn lẻ trong bảng order_items
    const { data: updatedItem, error: itemError } = await supabase
      .from("order_items")
      .update({ status: status })
      .eq("id", orderItemId)
      .select()
      .single();

    if (itemError) return NextResponse.json({ error: itemError.message }, { status: 400 });

    // 2. TỰ ĐỘNG HÓA THÔNG MINH: Nếu món ăn đổi sang 'preparing', tự động chuyển đơn hàng lớn sang 'preparing'
    if (status === "preparing" && orderId) {
      await supabase
        .from("orders")
        .update({ status: "preparing", updated_at: new Date().toISOString() })
        .eq("id", orderId);
    }

    // 3. TỰ ĐỘNG HÓA THÔNG MINH: Kiểm tra xem tất cả các món trong đơn này đã "ready" hoặc "served" hết chưa
    if (orderId) {
      const { data: allItems, error: fetchError } = await supabase
        .from("order_items")
        .select("status")
        .eq("order_id", orderId);

      if (!fetchError && allItems) {
        const isAllReadyOrServed = allItems.every(
          (item) => item.status === "ready" || item.status === "served"
        );

        // Nếu tất cả các món đã xong, tự động đưa đơn hàng lớn lên trạng thái 'ready' (Sẵn sàng)
        if (isAllReadyOrServed) {
          await supabase
            .from("orders")
            .update({ status: "ready", updated_at: new Date().toISOString() })
            .eq("id", orderId);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Cập nhật trạng thái món ăn thành công",
      item: updatedItem,
    });

  } catch (catchError: any) {
    console.error("Lỗi API Nhà bếp:", catchError);
    return NextResponse.json(
      { error: catchError.message || "Lỗi hệ thống nội bộ" },
      { status: 500 }
    );
  }
}