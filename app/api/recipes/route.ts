import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const revalidate = 0;
export const dynamic = "force-dynamic";

// Cấu trúc interface nhận dữ liệu sạch gửi lên từ Frontend định lượng
interface RecipePayloadItem {
  ingredient_id: string;
  quantity_required: number;
  note: string | null;
}

interface RecipePayload {
  menu_item_id: string;
  cost_price: number;
  recipes: RecipePayloadItem[];
}

export async function POST(request: Request) {
  try {
    // Quy tắc Bảo mật RLS: Khởi tạo client mang theo Cookie Store đăng nhập của tài khoản
    const supabase = await createClient();

    // Kiểm tra quyền truy cập của tài khoản người dùng
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!",
        },
        { status: 401 },
      );
    }

    // Đọc dữ liệu Payload gửi lên từ phía giao diện màn hình Định lượng
    const body: RecipePayload = await request.json();
    const { menu_item_id, cost_price, recipes } = body;

    // ⚡ BƯỚC 1: VALIDATE THANH LỌC DỮ LIỆU ĐẦU VÀO (CHỐNG CHUỖI RÁC TRÁNH NULL/UNDEFINED)
    if (
      !menu_item_id ||
      !recipes ||
      !Array.isArray(recipes) ||
      recipes.length === 0
    ) {
      return NextResponse.json(
        { success: false, error: "Dữ liệu cấu thành món ăn không hợp lệ!" },
        { status: 400 },
      );
    }

    // Kiểm tra định mức tiêu hao bắt buộc phải là số thực dương > 0
    const hasInvalidNumber = recipes.some(
      (item) =>
        !item.ingredient_id ||
        typeof item.quantity_required !== "number" ||
        item.quantity_required <= 0,
    );
    if (hasInvalidNumber) {
      return NextResponse.json(
        {
          success: false,
          error: "Hàm lượng định mức tiêu hao của nguyên liệu phải lớn hơn 0!",
        },
        { status: 400 },
      );
    }

    // Chuẩn bị mảng dữ liệu sạch để chuẩn bị ghi nhận vào cơ sở dữ liệu
    const cleanRecipesData = recipes.map((item) => ({
      menu_item_id: menu_item_id,
      ingredient_id: item.ingredient_id,
      quantity_required: item.quantity_required,
      note: item.note ? String(item.note).trim() : null,
    }));

    // ⚡ BƯỚC 2 & 3: THỰC HIỆN CƠ CHẾ "XÓA CŨ - GHI MỚI" LIÊN HOÀN TRÊN DATABASE
    // Đầu tiên: Dọn dẹp sạch sẽ toàn bộ các dòng cấu hình định lượng cũ của món ăn hiện tại
    const { error: deleteError } = await supabase
      .from("recipes")
      .delete()
      .eq("menu_item_id", menu_item_id);

    if (deleteError) {
      console.error("Lỗi xóa định lượng cũ:", deleteError);
      return NextResponse.json(
        {
          success: false,
          error: `Lỗi dọn dẹp dữ liệu cũ: ${deleteError.message}`,
        },
        { status: 500 },
      );
    }

    // Tiếp theo: Lưu hàng loạt (Bulk Insert) mảng nguyên liệu mới mà người dùng vừa thiết lập
    const { error: insertError } = await supabase
      .from("recipes")
      .insert(cleanRecipesData);

    if (insertError) {
      console.error("Lỗi ghi nhận định lượng mới:", insertError);
      return NextResponse.json(
        {
          success: false,
          error: `Lỗi lưu công thức mới: ${insertError.message}`,
        },
        { status: 500 },
      );
    }

    // Sau cùng: Đồng bộ cập nhật lại tổng giá vốn thực tế (cost_price) vào bảng danh mục món ăn MenuItem
    const { error: updateMenuError } = await supabase
      .from("menu_items")
      .update({ cost_price: cost_price, updated_at: new Date().toISOString() })
      .eq("id", menu_item_id);

    if (updateMenuError) {
      console.error("Lỗi cập nhật giá vốn món ăn:", updateMenuError);
      // Không chặn đứng tiến trình vì dữ liệu công thức mồi recipes đã lưu thành công ở bước trên
    }

    // ⚡ BƯỚC 4: TRẢ VỀ KẾT QUẢ THÀNH CÔNG (200 OK)
    return NextResponse.json(
      {
        success: true,
        message: "Đã đồng bộ hạch toán công thức định lượng món ăn thành công!",
      },
      { status: 200 },
    );
  } catch (globalError: any) {
    console.error("Lỗi hệ thống API định lượng:", globalError);
    return NextResponse.json(
      { success: false, error: "Hệ thống gặp sự cố kết nối máy chủ dữ liệu." },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    // Mở rộng URL để lấy các tham số Query parameters truyền lên từ trình duyệt
    const { searchParams } = new URL(request.url);
    const menu_item_id = searchParams.get("menu_item_id");

    if (!menu_item_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Thiếu mã món ăn (menu_item_id) để truy vấn!",
        },
        { status: 400 },
      );
    }

    // Bảo mật RLS: Khởi tạo client mang theo cookie store đã đăng nhập tài khoản
    const supabase = await createClient();

    // 1. Truy vấn thông tin tổng quan của món ăn từ bảng menu_items
    const { data: menuItem, error: menuError } = await supabase
      .from("menu_items")
      .select("id, name, price")
      .eq("id", menu_item_id)
      .single();

    if (menuError || !menuItem) {
      return NextResponse.json(
        {
          success: false,
          error: "Không tìm thấy thông tin món ăn này trên thực đơn!",
        },
        { status: 404 },
      );
    }
    // 2. Truy vấn danh sách nguyên liệu cấu thành hiện tại của món ăn từ bảng recipes
    // Thực hiện kết nối JOIN sang bảng ingredients để lấy thông tin Tên nguyên liệu và Đơn vị tính gốc
    const { data: recipeDetails, error: recipeError } = await supabase
      .from("recipes")
      .select(
        `
        ingredient_id,
        quantity_required,
        note,
        ingredients (
          name,
          base_uom
        )
      `,
      )
      .eq("menu_item_id", menu_item_id);

    if (recipeError) {
      console.error("Lỗi lấy công thức định lượng món:", recipeError);
      return NextResponse.json(
        {
          success: false,
          error: "Không thể nạp dữ liệu công thức của món ăn!",
        },
        { status: 500 },
      );
    }

    // 3. Khởi tạo quy trình tính toán tự động từ Backend dựa trên giá nhập gần nhất
    let calculatedCostPrice = 0;
    const itemsWithLiveCost = [];

    if (recipeDetails && recipeDetails.length > 0) {
      for (const row of recipeDetails) {
        const ingredientDetail = row.ingredients as any;
        const baseUom = ingredientDetail?.base_uom || "g";

        // Tìm giá nhập kho gần nhất của nguyên liệu này từ bảng purchase_order_details
        // Sắp xếp giảm dần theo thời gian tạo để lấy được hóa đơn mới nhất của nhà cung cấp
        const { data: lastPurchase } = await supabase
          .from("purchase_order_details")
          .select("price_per_uom, uom_used")
          .eq("ingredient_id", row.ingredient_id)
          .order("id", { ascending: false }) // Giả định ID tăng dần hoặc thay bằng trường ngày tạo nếu có
          .limit(1)
          .maybeSingle();

        // Nếu chưa từng nhập kho nguyên liệu này, mặc định giả lập đơn giá mồi là 25,000đ/Kg
        const lastPrice = lastPurchase?.price_per_uom || 25000;
        const qty = Number(row.quantity_required) || 0;

        // Mặc định quy ước tính toán: Nếu là gam (g) hoặc mililít (ml), chia cho 1000 để quy về đơn vị Kg/Lít gốc
        const isGramOrMl =
          baseUom.toLowerCase() === "g" || baseUom.toLowerCase() === "ml";
        const ingCost = isGramOrMl ? qty * (lastPrice / 1000) : qty * lastPrice;

        calculatedCostPrice += ingCost;

        itemsWithLiveCost.push({
          ingredient_id: row.ingredient_id,
          name: ingredientDetail?.name || "Nguyên liệu vô danh",
          base_uom: baseUom,
          quantity_required: qty,
          note: row.note,
          last_purchase_price: lastPrice,
          row_cost_estimated: ingCost,
        });
      }
    }

    // 4. Hạch toán các chỉ số kinh doanh cốt lõi từ máy chủ Backend
    const price = menuItem.price || 0;
    const food_cost_percentage =
      price > 0 ? (calculatedCostPrice / price) * 100 : 0;
    const profit = price - calculatedCostPrice;

    // Logic tính toán trạng thái: AN_TOAN nếu tỷ lệ phần trăm chi phí thấp dưới mức biên 30%
    const financeStatus = food_cost_percentage <= 30 ? "AN_TOAN" : "CANH_BAO";

    // Trả về cục dữ liệu JSON sạch sẽ đầy đủ cho Frontend đổ lên các ô trên giao diện
    return NextResponse.json(
      {
        success: true,
        menu_item: {
          id: menuItem.id,
          name: menuItem.name,
          price: price,
        },
        financial_summary: {
          cost_price: calculatedCostPrice,
          food_cost_percentage: food_cost_percentage,
          profit: profit,
          status: financeStatus,
        },
        recipes: itemsWithLiveCost,
      },
      { status: 200 },
    );
  } catch (globalError: any) {
    console.error("Lỗi hệ thống API GET recipes:", globalError);
    return NextResponse.json(
      {
        success: false,
        error: "Hệ thống gặp sự cố khi xử lý dữ liệu định lượng.",
      },
      { status: 500 },
    );
  }
}
