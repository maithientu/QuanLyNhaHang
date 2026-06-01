import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {}
        },
      },
    },
  );
}

/**
 * ⚡ API POST: Xử lý trả nợ và TỰ ĐỘNG CẬP NHẬT TRẠNG THÁI PHIẾU NHẬP KHO (Cuốn chiếu)
 */
export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseClient();
    const body = await request.json();

    const { supplier_id, amount, payment_method, note } = body;
    let remainPayAmount = Number(amount) || 0; // Số tiền quỹ chi ra để đi trừ nợ

    if (!supplier_id || remainPayAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Dữ liệu không hợp lệ!" },
        { status: 400 },
      );
    }

    // 1. Lấy số nợ tổng hiện tại của nhà cung cấp
    const { data: supplier, error: fetchError } = await supabase
      .from("suppliers")
      .select("current_debt")
      .eq("id", supplier_id)
      .maybeSingle();

    if (fetchError || !supplier) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy nhà cung cấp!" },
        { status: 404 },
      );
    }

    // =========================================================================
    // 🧠 THUẬT TOÁN ĐỐI SOÁT CUỐN CHIẾU & XỬ LÝ TIỀN TRẢ THỪA (SỬA TẠI ĐÂY)
    // =========================================================================
    const oldDebt = Number(supplier.current_debt) || 0;

    // Tính toán số nợ mới: Cho phép ra giá trị ÂM (Số âm đại diện cho Tiền đặt cọc trước)
    const newDebt = oldDebt - remainPayAmount;

    // Cập nhật số dư nợ mới (hoặc số tiền dư âm) vào bảng suppliers
    const { error: updateError } = await supabase
      .from("suppliers")
      .update({ current_debt: newDebt })
      .eq("id", supplier_id);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 400 },
      );
    }

    // 2. Đi quét tìm các hóa đơn cũ còn nợ để xóa nợ cuốn chiếu gối đầu
    const { data: unpaidOrders } = await supabase
      .from("purchase_orders")
      .select("id, final_amount, paid_amount")
      .eq("supplier_id", supplier_id)
      .in("payment_status", ["UNPAID", "PARTIAL"])
      .order("created_at", { ascending: true });

    if (unpaidOrders && unpaidOrders.length > 0) {
      for (const order of unpaidOrders) {
        if (remainPayAmount <= 0) break; // Hết quỹ tiền chi ra thì dừng vòng lặp

        const currentPaid = Number(order.paid_amount) || 0;
        const currentFinal = Number(order.final_amount) || 0;
        const currentDebtOfOrder = currentFinal - currentPaid; // Số tiền còn thiếu của riêng phiếu này

        if (currentDebtOfOrder <= 0) continue;

        let allocation = 0;
        let newStatus = "PARTIAL";

        if (remainPayAmount >= currentDebtOfOrder) {
          // Tiền chi ra đủ hoặc dư để đóng hoàn toàn phiếu này
          allocation = currentDebtOfOrder;
          remainPayAmount -= currentDebtOfOrder; // Giảm quỹ tiền thừa để đi tiếp phiếu sau
          newStatus = "PAID"; // Đổi trạng thái sang Đã thanh toán xong
        } else {
          // Tiền chi ra chỉ đủ thấm một phần nhỏ của phiếu này rồi hết sạch quỹ
          allocation = remainPayAmount;
          remainPayAmount = 0; // Hết tiền quỹ
          newStatus = "PARTIAL";
        }

        // Cập nhật trực tiếp vào bảng purchase_orders để đồng bộ hiển thị sang trang chứng từ
        await supabase
          .from("purchase_orders")
          .update({
            paid_amount: currentPaid + allocation,
            payment_status: newStatus,
          })
          .eq("id", order.id);
      }
    }

    // Xử lý ghi chú bổ sung: Nếu sau khi xóa hết nợ hóa đơn mà vẫn thừa tiền quỹ
    const generatedPoNumber = `PO-${Date.now().toString().slice(-6)}`;
    let finalNote = `Chi trả nợ (${payment_method === "CASH" ? "Tiền mặt" : "Chuyển khoản"}). ${note?.trim() || ""}`;
    if (remainPayAmount > 0) {
      finalNote += ` (Lưu ý: Trả thừa ${remainPayAmount.toLocaleString("vi-VN")} đ chuyển thành Tiền đặt cọc).`;
    }

    // 3. Ghi vết lịch sử dòng tiền gối đầu vào bảng Sổ cái công nợ (supplier_debt_ledger)
    const { data: newLedger, error: ledgerError } = await supabase
      .from("supplier_debt_ledger")
      .insert([
        {
          supplier_id,
          transaction_type: "PAYMENT",
          amount: Number(amount),
          balance_after: newDebt, // Lưu số dư âm thể hiện tiền gối đầu đặt cọc
          note: finalNote,
        },
      ])
      .select()
      .single();

    if (ledgerError) {
      return NextResponse.json(
        { success: false, error: ledgerError.message },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, newDebt, newLedger });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Lỗi máy chủ nội bộ." },
      { status: 500 },
    );
  }
}
