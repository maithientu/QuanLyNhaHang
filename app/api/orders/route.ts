import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MenuItem } from "@/lib/types/database";

export async function POST(request: Request) {
  try {
    // 1. Quy tắc Bảo mật RLS: Khởi tạo Supabase Server Client bắt buộc có await
    const supabase = await createClient();

    // Lấy thông tin tài khoản nhân viên phục vụ đăng nhập hệ thống (nếu có)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const waiterId = user ? user.id : null;

    // Đọc dữ liệu giỏ hàng POS gửi lên
    const body = await request.json();
    const { table_id, guest_count, items, note, action_type, is_customer } =
      body;

    // 2. Thanh lọc dữ liệu rác đầu vào an toàn
    if (
      !table_id ||
      table_id === "none" ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        { error: "Dữ liệu giỏ hàng trống hoặc không hợp lệ" },
        { status: 400 },
      );
    }

    // Lấy danh sách ID món ăn có trong giỏ để truy vấn đơn giá thực tế trong Database
    const menuItemIds = items.map((i: any) => i.menu_item_id);
    const { data: dbMenuItems, error: menuError } = await supabase
      .from("menu_items")
      .select("id, price")
      .in("id", menuItemIds);

    if (menuError || !dbMenuItems) {
      return NextResponse.json(
        { error: "Không thể xác thực danh sách món ăn từ hệ thống" },
        { status: 400 },
      );
    }

    // Khởi tạo biến tính tổng tiền tạm tính độc lập tại Backend cho lượt gọi này
    let calculatedSubtotal = 0;

    // Chuẩn bị mảng dữ liệu sạch cho bảng order_items sau khi đã xác thực đơn giá
    const sanitizedOrderItems = items.map((item: any) => {
      const matchedDbItem = (dbMenuItems as MenuItem[]).find(
        (dbItem) => dbItem.id === item.menu_item_id,
      );

      if (!matchedDbItem) {
        throw new Error(
          `Món ăn có ID ${item.menu_item_id} không tồn tại trên hệ thống`,
        );
      }

      const quantity = Math.max(1, parseInt(item.quantity) || 1);
      const unitPrice = matchedDbItem.price;
      const itemTotalPrice = unitPrice * quantity;

      // Cộng dồn tổng tiền tạm tính của riêng lượt gọi món này
      calculatedSubtotal += itemTotalPrice;

      return {
        menu_item_id: item.menu_item_id,
        quantity: quantity,
        unit_price: unitPrice,
        total_price: itemTotalPrice,
        note: item.note && item.note.trim() !== "" ? item.note.trim() : null,
        status: "pending", // Mặc định món ăn mới gửi xuống sẽ chờ bếp duyệt nấu
      };
    });

    // Tính toán Thuế VAT 10% và Tổng tiền cuối cùng khớp với cấu trúc schema numeric(12,2)
    const calculatedTax = calculatedSubtotal * 0.1;
    const calculatedTotal = calculatedSubtotal + calculatedTax;

    // Định nghĩa trạng thái đơn dựa trên đối tượng đặt món: Khách đặt -> pending, Nhân viên -> confirmed
    const defaultStatus = is_customer ? "pending" : "confirmed";
    const finalStatus =
      action_type === "immediate_pay" ? "paid" : defaultStatus;

    // 🌟 THỰC THI Ý TƯỞNG: Luôn tạo một bản ghi hóa đơn mới hoàn toàn cho mỗi lần gọi món
    // để giao diện nhà bếp (KDS) hiển thị tách biệt theo từng block, không gộp chung gây sót đồ
    const { data: newOrder, error: orderError } = await supabase
      .from("orders")
      .insert({
        table_id: table_id,
        waiter_id: waiterId, // ID nhân viên hoặc null nếu khách tự quét mã QR đặt món
        status: finalStatus,
        subtotal: calculatedSubtotal,
        discount: 0,
        tax: calculatedTax,
        total: calculatedTotal,
        note: note && note.trim() !== "" ? note.trim() : null,
        guest_count: Math.max(1, parseInt(guest_count) || 1),
        is_takeaway: false,
      })
      .select("id, order_number")
      .single();

    if (orderError || !newOrder) {
      return NextResponse.json(
        { error: `Lỗi khởi tạo đơn hàng mới: ${orderError.message}` },
        { status: 400 },
      );
    }

    // Bổ sung khóa ngoại `order_id` vừa sinh ra cho danh sách chi tiết món ăn con
    const finalOrderItems = sanitizedOrderItems.map((item) => ({
      ...item,
      order_id: newOrder.id,
    }));

    // Thêm danh sách món ăn hàng loạt vào bảng chi tiết `order_items` (Bulk Insert)
    const { error: itemsInsertError } = await supabase
      .from("order_items")
      .insert(finalOrderItems);

    if (itemsInsertError) {
      return NextResponse.json(
        {
          error: `Lỗi lưu danh sách món ăn chi tiết: ${itemsInsertError.message}`,
        },
        { status: 400 },
      );
    }

    // Tự động chuyển trạng thái phòng bàn sang 'occupied' (Có khách) để đồng bộ sơ đồ bàn
    await supabase
      .from("tables")
      .update({ status: "occupied" })
      .eq("id", table_id);

    // Trả kết quả thành công mỹ mãn về cho phía Client giao diện
    return NextResponse.json(
      {
        success: true,
        message:
          "Đơn đặt món mới đã được khởi tạo độc lập thành công trên hệ thống",
        orderId: newOrder.id,
        orderNumber: newOrder.order_number,
      },
      { status: 201 },
    );
  } catch (catchError: any) {
    console.error("Lỗi hệ thống xử lý đặt món:", catchError);
    return NextResponse.json(
      { error: catchError.message || "Lỗi hệ thống nội bộ" },
      { status: 500 },
    );
  }
}
