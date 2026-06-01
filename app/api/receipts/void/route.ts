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
 * 🚨 POST: HỦY CHỨNG TỪ NHẬP KHO (HOÀN KHO & ĐẢO NGƯỢC CÔNG NỢ)
 */
export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseClient();
    const body = await request.json();
    const { purchase_order_id } = body;

    if (!purchase_order_id) {
      return NextResponse.json(
        { success: false, error: "Thiếu ID chứng từ cần hủy!" },
        { status: 400 },
      );
    }

    // 1. Kiểm tra sự tồn tại của phiếu nhập kho và lấy thông tin tài chính
    const { data: po, error: poError } = await supabase
      .from("purchase_orders")
      .select(
        "id, po_number, supplier_id, warehouse_id, final_amount, paid_amount, status",
      )
      .eq("id", purchase_order_id)
      .maybeSingle();

    if (poError || !po) {
      return NextResponse.json(
        { success: false, error: "Không tìm thấy chứng từ trên hệ thống!" },
        { status: 404 },
      );
    }

    if (po.status === "VOIDED") {
      return NextResponse.json(
        { success: false, error: "Chứng từ này đã được hủy trước đó!" },
        { status: 400 },
      );
    }

    // =========================================================================
    // ➔ BƯỚC 2 & 3: ĐỒNG BỘ CHUẨN XÁC ID CHI TIẾT ĐỂ KHẤU TRỪ KHO VÀ LÔ HÀNG
    // =========================================================================
    // 1. Lấy danh sách chi tiết các mặt hàng thực nhập trong phiếu
    const { data: details, error: detailsError } = await supabase
      .from("purchase_order_details")
      .select("id, ingredient_id, base_quantity") // Lấy thêm ID chi tiết (id) để mồi cho bảng lô
      .eq("purchase_order_id", purchase_order_id);

    if (detailsError) {
      console.error(
        "Lỗi lấy chi tiết đơn hàng để hoàn kho:",
        detailsError.message,
      );
    }

    if (details && details.length > 0) {
      for (const item of details) {
        const qtyBase = Number(item.base_quantity) || 0;
        if (qtyBase <= 0) continue;

        // 2.1 Trừ bớt số lượng tổng tồn kho lõi trong bảng inventory_stock
        const { data: currentStock } = await supabase
          .from("inventory_stock")
          .select("id, total_inventory")
          .eq("ingredient_id", item.ingredient_id)
          .eq("warehouse_id", po.warehouse_id)
          .maybeSingle();

        if (currentStock) {
          const newStockQty = Math.max(
            0,
            Number(currentStock.total_inventory) - qtyBase,
          );
          await supabase
            .from("inventory_stock")
            .update({ total_inventory: newStockQty })
            .eq("id", currentStock.id);
        }

        // 2.2 Tạo 1 giao dịch kho xuất hủy ngược (inventory_transactions) để lưu vết lịch sử
        await supabase.from("inventory_transactions").insert([
          {
            warehouse_id: po.warehouse_id,
            ingredient_id: item.ingredient_id,
            transaction_type: "OUT",
            reference_id: po.id,
            quantity: qtyBase,
            uom_used: "Hủy phiếu",
          },
        ]);

        // 2.3 Cập nhật đưa số lượng tồn của Lô hàng phụ thuộc về 0 (Sửa lỗi sai ID)
        // Truyền chính xác item.id (ID chi tiết đơn) vào trường po_detail_id của bảng lô hàng
        const { error: batchVoidError } = await supabase
          .from("inventory_batches")
          .update({ current_quantity: 0 })
          .eq("po_detail_id", item.id); // ➔ KHỚP CHUẨN: item.id thay vì purchase_order_id

        if (batchVoidError) {
          console.error(
            `Lỗi đưa lượng tồn lô thuộc chi tiết ${item.id} về 0:`,
            batchVoidError.message,
          );
        }
      }
    }

    // =========================================================================
    // 🤝 BƯỚC 4: ĐẢO NGƯỢC CÔNG NỢ & TỰ ĐỘNG CHUYỂN THÀNH TIỀN CỌC ÂM (NẾU ĐÃ TRẢ TIỀN)
    // =========================================================================
    const totalPoFinalAmount = Number(po.final_amount) || 0;
    const totalPoPaidAmount = Number(po.paid_amount) || 0;

    // Tính toán khoản nợ gốc của riêng phiếu này
    const orderDebt = totalPoFinalAmount - totalPoPaidAmount;

    // Truy vấn lấy số nợ tổng hiện tại của nhà cung cấp trên hệ thống
    const { data: supplier, error: supFetchError } = await supabase
      .from("suppliers")
      .select("current_debt")
      .eq("id", po.supplier_id)
      .maybeSingle();

    if (supplier) {
      const oldSupplierDebt = Number(supplier.current_debt) || 0;
      let newSupplierDebt = oldSupplierDebt;

      if (orderDebt > 0) {
        // Kịch bản A: Phiếu mua nợ chưa trả tiền -> Trừ bớt số nợ tổng đi
        newSupplierDebt = Math.max(0, oldSupplierDebt - orderDebt);
      } else if (totalPoPaidAmount > 0) {
        // Kịch bản B: Bạn ĐÃ CHUYỂN TIỀN TRẢ NGAY (paid_amount > 0) -> Khi hủy đơn,
        // nhà cung cấp phải nợ lại tiền nhà hàng. Số nợ tổng tự động trừ số tiền đã trả để nhảy sang SỐ ÂM!
        newSupplierDebt = oldSupplierDebt - totalPoPaidAmount;
      }

      // 4.1 Thực hiện cập nhật số dư nợ mới (hoặc số âm đặt cọc) vào bảng suppliers
      await supabase
        .from("suppliers")
        .update({ current_debt: newSupplierDebt })
        .eq("id", po.supplier_id);

      // 4.2 Ghi nhận dòng lịch sử hoàn trả gối đầu rõ ràng vào Sổ cái công nợ (supplier_debt_ledger)
      const ledgerNote =
        `Hủy chứng từ nhập hàng số ${po.po_number}. ` +
        (orderDebt > 0
          ? `Hệ thống tự động xóa khoản nợ chưa thanh toán ${orderDebt.toLocaleString("vi-VN")} đ.`
          : `Nhà hàng đã trả tiền mặt trước đó, tự động chuyển ${totalPoPaidAmount.toLocaleString("vi-VN")} đ thành Tiền đặt cọc hoàn trả.`);

      await supabase.from("supplier_debt_ledger").insert([
        {
          supplier_id: po.supplier_id,
          transaction_type: "PAYMENT", // Ghi nhận dòng giảm trừ/hoàn trả nợ
          reference_id: po.id,
          amount: orderDebt > 0 ? orderDebt : totalPoPaidAmount,
          balance_after: newSupplierDebt, // Lưu số dư âm thể hiện tiền đặt cọc gối đầu
          note: ledgerNote,
        },
      ]);
    }

    // 5. Cập nhật trạng thái phiếu nhập kho gốc sang trạng thái VOIDED (Đã hủy)
    await supabase
      .from("purchase_orders")
      .update({ status: "VOIDED", payment_status: "VOIDED" })
      .eq("id", purchase_order_id);

    return NextResponse.json({
      success: true,
      message: `Đã hủy thành công chứng từ ${po.po_number}`,
    });
  } catch (err: any) {
    console.error("Lỗi hệ thống hủy phiếu kho:", err);
    return NextResponse.json(
      { success: false, error: "Lỗi máy chủ nội bộ." },
      { status: 500 },
    );
  }
}
