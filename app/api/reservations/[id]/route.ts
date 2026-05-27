import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Quy tắc Node.js 16: Sử dụng cấu trúc xử lý context适应 bóc tách ID an toàn thay vì await params trực tiếp
export async function PATCH(request: Request, context: any) {
  try {
    const paramsResolved =
      context.params && typeof context.params.then === "function"
        ? await context.params
        : context.params;
    const reservationId = paramsResolved?.id;

    if (!reservationId) {
      return NextResponse.json(
        { error: "Thiếu mã ID của lịch hẹn cần xử lý" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { status, table_id } = body; // Trạng thái nhận: 'confirmed' | 'seated' | 'cancelled'

    if (!status) {
      return NextResponse.json(
        { error: "Thiếu thông tin hành động trạng thái cập nhật" },
        { status: 400 },
      );
    }

    // Quy tắc Bảo mật RLS: Khởi tạo kết nối Supabase Server Client bắt buộc có await
    const supabase = await createClient();

    // Chuẩn bị object cập nhật động dựa theo tham số truyền lên
    const updatePayload: any = { status: status };
    if (table_id && table_id !== "none") {
      updatePayload.table_id = table_id;
    }

    // Thực hiện cập nhật trạng thái của đơn đặt bàn
    const { data: updatedRes, error: resError } = await supabase
      .from("reservations")
      .update(updatePayload)
      .eq("id", reservationId)
      .select()
      .single();

    if (resError || !updatedRes) {
      return NextResponse.json(
        { error: `Lỗi cập nhật lịch hẹn: ${(resError as any)?.message}` },
        { status: 400 },
      );
    }

    // =========================================================
    // ĐỒNG BỘ SƠ ĐỒ PHÒNG BÀN THEO QUY TRÌNH CHUẨN NHÀ HÀNG
    // =========================================================
    const finalTableId = table_id || updatedRes.table_id;

    if (finalTableId) {
      if (status === "confirmed") {
        // Nghiệp vụ A: Khi nhân viên Xếp bàn -> Chuyển trạng thái bàn đó sang 'reserved' (Đã đặt trước)
        await supabase
          .from("tables")
          .update({ status: "reserved" })
          .eq("id", finalTableId);
      } else if (status === "seated") {
        // Nghiệp vụ B: Khi khách đến Nhận bàn -> Chuyển trạng thái bàn đó sang 'occupied' (Có khách ăn uống)
        await supabase
          .from("tables")
          .update({ status: "occupied" })
          .eq("id", finalTableId);
      } else if (status === "cancelled") {
        // Nghiệp vụ C: Khi Huỷ lịch hẹn -> Trả trạng thái bàn về lại 'available' (Bàn trống) để đón khách khác
        await supabase
          .from("tables")
          .update({ status: "available" })
          .eq("id", finalTableId);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Cập nhật tiến độ điều phối lịch đặt bàn thành công",
        reservation: updatedRes,
      },
      { status: 200 },
    );
  } catch (catchError: any) {
    console.error("Lỗi hệ thống điều phối đặt bàn:", catchError);
    return NextResponse.json(
      { error: catchError.message || "Lỗi hệ thống nội bộ" },
      { status: 500 },
    );
  }
}
