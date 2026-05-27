import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    // 1. Quy tắc Bảo mật RLS: Khởi tạo Supabase Server Client bắt buộc có await
    const supabase = await createClient();

    // Đọc dữ liệu gửi lên từ Form Client Component
    const body = await request.json();
    const {
      customer_name,
      customer_phone,
      guest_count,
      reservation_time,
      table_id,
      note,
    } = body;

    // 2. Thanh lọc dữ liệu rác đầu vào an toàn
    if (!customer_name || !customer_phone || !reservation_time) {
      return NextResponse.json(
        { error: "Vui lòng điền đầy đủ các thông tin bắt buộc (*)" },
        { status: 400 },
      );
    }

    // Chuẩn bị dữ liệu sạch để insert vào Database
    const targetTableId = table_id === "none" || !table_id ? null : table_id;

    // Nếu có gán bàn trước, lịch hẹn sẽ mặc định trạng thái 'confirmed', ngược lại là 'pending'
    const initialStatus = targetTableId ? "confirmed" : "pending";

    // Thực hiện chèn bản ghi mới vào bảng `reservations`
    const { data: newReservation, error: insertError } = await supabase
      .from("reservations")
      .insert({
        customer_name: customer_name.trim(),
        customer_phone: customer_phone.trim(),
        guest_count: Math.max(1, parseInt(guest_count) || 2),
        reservation_time: new Date(reservation_time).toISOString(),
        table_id: targetTableId,
        note: note && note.trim() !== "" ? note.trim() : null,
        status: initialStatus,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: `Lỗi lưu lịch đặt bàn: ${insertError.message}` },
        { status: 400 },
      );
    }

    // ĐỒNG BỘ NGHIỆP VỤ: Nếu gán bàn ngay từ đầu, tự động chuyển trạng thái bàn ăn sang 'reserved' (Đã đặt trước)
    if (targetTableId) {
      await supabase
        .from("tables")
        .update({ status: "reserved" })
        .eq("id", targetTableId);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Lịch đặt bàn đã được tiếp nhận thành công trên hệ thống",
        reservation: newReservation,
      },
      { status: 201 },
    );
  } catch (catchError: any) {
    console.error("Lỗi API nhận đặt bàn:", catchError);
    return NextResponse.json(
      { error: catchError.message || "Lỗi hệ thống nội bộ" },
      { status: 500 },
    );
  }
}
