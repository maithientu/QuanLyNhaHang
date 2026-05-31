import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Hàm khởi tạo Supabase Client môi trường Route Handler (Server-side)
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
 * 📦 1. POST: Khởi tạo phiếu nhập kho, chia lô hàng, tạo transaction kho, cập nhật stock tổng và ghi nhận công nợ đối tác
 */
export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseClient();
    const body = await request.json();

    const {
      warehouse_id,
      supplier_id,
      total_amount,
      discount,
      final_amount,
      paid_amount,
      note,
      items,
    } = body;

    // Kiểm tra dữ liệu đầu vào bắt buộc từ giao diện gửi lên
    if (
      !warehouse_id ||
      !supplier_id ||
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Thiếu thông tin kho nhận, nhà cung cấp hoặc danh sách mặt hàng!",
        },
        { status: 400 },
      );
    }

    // Ép kiểu số an toàn để tính toán trạng thái thanh toán và công nợ chuẩn xác
    const totalAmt = Number(total_amount) || 0;
    const discountAmt = Number(discount) || 0;
    const finalAmt = Number(final_amount) || 0;
    const paidAmt = Number(paid_amount) || 0;

    let paymentStatus = "UNPAID";
    if (paidAmt >= finalAmt) {
      paymentStatus = "PAID";
    } else if (paidAmt > 0) {
      paymentStatus = "PARTIAL";
    }

    // Tự động tạo Số chứng từ (po_number) khớp logic UI nhận alert
    const generatedPoNumber = `PO-${Date.now().toString().slice(-6)}`;

    // BẢNG 1: Khởi tạo bản ghi vào bảng purchase_orders
    const { data: purchaseOrder, error: poError } = await supabase
      .from("purchase_orders")
      .insert([
        {
          po_number: generatedPoNumber,
          warehouse_id,
          supplier_id,
          total_amount: totalAmt,
          discount: discountAmt,
          final_amount: finalAmt,
          paid_amount: paidAmt,
          payment_status: paymentStatus,
          note: note?.trim() || null,
          status: "COMPLETED",
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (poError || !purchaseOrder) {
      return NextResponse.json(
        {
          success: false,
          error: `Lỗi ghi nhận phiếu nhập gốc: ${poError?.message}`,
        },
        { status: 400 },
      );
    }

    // Bước 2: Duyệt vòng lặp danh sách vật tư nhập kho thô từ biểu mẫu
    for (const item of items) {
      const {
        ingredient_id,
        uom_used,
        quantity_uom,
        price_per_uom,
        expiry_date,
      } = item;

      const qtyUom = Number(quantity_uom) || 0;
      const priceUom = Number(price_per_uom) || 0;

      if (!ingredient_id || qtyUom <= 0) continue;

      const lineTotalPrice = qtyUom * priceUom;

      // BẢNG 2: Ghi nhận chi tiết vào purchase_order_details
      const { data: insertedDetail, error: detailError } = await supabase
        .from("purchase_order_details")
        .insert([
          {
            purchase_order_id: purchaseOrder.id,
            ingredient_id,
            uom_used: uom_used || "đv",
            quantity_uom: qtyUom,
            price_per_uom: priceUom,
            base_quantity: qtyUom,
            base_price: priceUom,
            total_price: lineTotalPrice,
          },
        ])
        .select()
        .single();

      if (detailError || !insertedDetail) {
        console.error(
          "Lỗi nghiêm trọng tại bảng purchase_order_details:",
          detailError?.message,
        );
        continue;
      }

      // Truy vấn lại dòng sau khi Trigger DB đã xử lý quy đổi
      const { data: verifiedDetail } = await supabase
        .from("purchase_order_details")
        .select("base_quantity, base_price")
        .eq("id", insertedDetail.id)
        .single();

      const finalBaseQuantity = verifiedDetail
        ? Number(verifiedDetail.base_quantity)
        : qtyUom;
      const finalCostPrice = verifiedDetail
        ? Number(verifiedDetail.base_price)
        : priceUom;

      let finalExpiryDate = expiry_date;
      if (!finalExpiryDate) {
        const defaultDate = new Date();
        defaultDate.setFullYear(defaultDate.getFullYear() + 1);
        finalExpiryDate = defaultDate.toISOString().split("T");
      }

      // BẢNG 3: Khởi tạo lô hàng lưu kho vào inventory_batches
      const generatedBatchCode = `LOT-${Date.now().toString().slice(-4)}`;
      const { data: insertedBatch, error: batchError } = await supabase
        .from("inventory_batches")
        .insert([
          {
            warehouse_id,
            ingredient_id,
            po_detail_id: insertedDetail.id,
            batch_code: generatedBatchCode,
            initial_quantity: finalBaseQuantity,
            current_quantity: finalBaseQuantity,
            cost_price: finalCostPrice,
            expiry_date: finalExpiryDate,
            received_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (batchError) {
        console.error(
          "Lỗi nghiêm trọng tại bảng inventory_batches:",
          batchError.message,
        );
      }

      // BẢNG 4: Tự động ghi vết lịch sử biến động kho vào inventory_transactions
      const { error: txError } = await supabase
        .from("inventory_transactions")
        .insert([
          {
            warehouse_id,
            ingredient_id,
            batch_id: insertedBatch ? insertedBatch.id : null,
            transaction_type: "IN",
            reference_id: purchaseOrder.id,
            quantity: finalBaseQuantity,
            uom_used: uom_used || "đv",
          },
        ]);

      if (txError) {
        console.error(
          "Lỗi nghiêm trọng tại bảng inventory_transactions:",
          txError.message,
        );
      }

      // BẢNG 5: Đồng bộ tăng số lượng tổng vào bảng tồn kho tổng đa kho (inventory_stock)
      const { data: currentStock } = await supabase
        .from("inventory_stock")
        .select("id, total_inventory")
        .eq("ingredient_id", ingredient_id)
        .eq("warehouse_id", warehouse_id)
        .maybeSingle();

      if (currentStock) {
        const updatedInventory =
          Number(currentStock.total_inventory) + finalBaseQuantity;
        await supabase
          .from("inventory_stock")
          .update({ total_inventory: updatedInventory })
          .eq("id", currentStock.id);
      } else {
        await supabase.from("inventory_stock").insert([
          {
            ingredient_id,
            warehouse_id,
            total_inventory: finalBaseQuantity,
          },
        ]);
      }
    }

    // BẢNG 6: Tự động ghi nhận cộng dồn tiền nợ và ghi Sổ cái chi tiết công nợ NCC
    const remainingDebt = finalAmt - paidAmt;
    if (remainingDebt > 0) {
      const { data: supplierRecord, error: supFetchError } = await supabase
        .from("suppliers")
        .select("current_debt")
        .eq("id", supplier_id)
        .maybeSingle();

      if (supFetchError) {
        console.error("Lỗi tìm thông tin nhà cung cấp:", supFetchError.message);
      }

      if (supplierRecord) {
        const oldDebt = Number(supplierRecord.current_debt) || 0;
        const updatedDebt = oldDebt + remainingDebt;

        // Cập nhật số dư nợ tổng ở bảng suppliers của bạn
        const { error: supUpdateError } = await supabase
          .from("suppliers")
          .update({ current_debt: updatedDebt })
          .eq("id", supplier_id);

        if (supUpdateError) {
          console.error(
            "Lỗi cập nhật số dư bảng suppliers:",
            supUpdateError.message,
          );
        }

        // Sinh lịch sử chi tiết cho cuốn Sổ cái công nợ (supplier_debt_ledger)
        const { error: ledgerError } = await supabase
          .from("supplier_debt_ledger")
          .insert([
            {
              supplier_id,
              transaction_type: "PURCHASE_DEBT",
              reference_id: purchaseOrder.id,
              amount: remainingDebt,
              balance_after: updatedDebt,
              note: `Ghi nợ tự động từ chứng từ nhập kho số ${generatedPoNumber}`,
            },
          ]);

        if (ledgerError) {
          console.error(
            "Lỗi ghi lịch sử bảng supplier_debt_ledger:",
            ledgerError.message,
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      po_number: purchaseOrder.po_number,
    });
  } catch (err: any) {
    console.error("Lỗi hệ thống API POST Receipts:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Lỗi máy chủ nội bộ trong quá trình duyệt kho.",
      },
      { status: 500 },
    );
  }
}

/**
 * 🔍 2. GET: Truy vấn danh sách lịch sử toàn bộ chứng từ phục vụ hiển thị Nhật ký
 */
export async function GET() {
  try {
    const supabase = await getSupabaseClient();
    const { data: receiptsLog, error } = await supabase
      .from("purchase_orders")
      .select(
        `
          id, po_number, total_amount, discount, final_amount, paid_amount, payment_status, note, created_at, created_by,
          suppliers ( name ),
          warehouses ( name ),
          -- ➔ THÊM CỤM NÀY ĐỂ LIÊN KẾT LẤY CHI TIẾT TỪNG MÓN VÀO DRAWER TRƯỢT
          purchase_order_details (
            id, quantity_uom, price_per_uom, uom_used,
            ingredients ( name )
          )
        `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      );
    }
    return NextResponse.json({ success: true, data: receiptsLog });
  } catch (err: any) {
    console.error("Lỗi hệ thống API GET Receipts:", err);
    return NextResponse.json(
      { success: false, error: "Lỗi máy chủ nội bộ." },
      { status: 500 },
    );
  }
}
