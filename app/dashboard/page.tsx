// app/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/dashboard/header";
import { DashboardContent } from "./dashboard-content";
import { Table, Area, Order, MenuItem } from "@/lib/types/database";

async function getDashboardData() {
  const supabase = await createClient();
  const now = new Date();

  // Mốc bắt đầu ngày hôm nay (00:00:00)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  // Mốc 7 ngày trước để quét dữ liệu làm biểu đồ và top món chạy thực tế
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);
  const sevenDaysAgoISO = sevenDaysAgo.toISOString();

  // 1. Chạy song song toàn bộ các câu lệnh truy vấn dữ liệu nền từ Database
  const [
    { data: tables },
    { data: areas },
    { data: todayOrdersData },
    { data: recentOrdersData },
    { data: activeOrdersData },
    { data: weeklyOrdersData },
    { data: allOrderItems },
  ] = await Promise.all([
    // Lấy danh sách bàn
    supabase
      .from("tables")
      .select("*, area:areas(*)")
      .eq("is_active", true)
      .order("name"),

    // Lấy danh sách khu vực
    supabase
      .from("areas")
      .select("*")
      .eq("is_active", true)
      .order("sort_order"),

    // Lấy đơn hàng hôm nay để đếm số lượng & tính KPI doanh thu
    supabase.from("orders").select("total, status").gte("created_at", todayISO),

    // Luôn luôn lấy dữ liệu 5 đơn hàng mới nhất (Bất kể đã thanh toán hay chưa)
    supabase
      .from("orders")
      .select("*, table:tables(*)")
      .order("created_at", { ascending: false })
      .limit(5),

    // Đếm số đơn hàng chưa thanh toán đang phục vụ tại quán
    supabase
      .from("orders")
      .select("id")
      .not("status", "in", '("completed","cancelled","paid")'),

    // Lấy toàn bộ đơn hàng 7 ngày qua để tính toán biểu đồ
    supabase
      .from("orders")
      .select("total, created_at, status")
      .gte("created_at", sevenDaysAgoISO),

    // Lấy món ăn đã bán trong 7 ngày qua làm Top món chạy
    supabase
      .from("order_items")
      .select("quantity, menu_item:menu_items(id, name, price, image_url)")
      .gte("created_at", sevenDaysAgoISO),
  ]);

  // ========================================================
  // 🔥 ĐỒNG BỘ CHI TIẾT MÓN ĂN CHO 5 HÓA ĐƠN GẦN NHẤT
  // ========================================================
  const recentOrderIds = recentOrdersData?.map((o) => o.id) || [];

  // Truy vấn tìm các món ăn nằm trong 5 hóa đơn vừa lấy ở trên
  const { data: recentItemsData } =
    recentOrderIds.length > 0
      ? await supabase
          .from("order_items")
          .select("*, menu_item:menu_items(name, price)")
          .in("order_id", recentOrderIds)
      : { data: [] };

  // Khớp nối danh sách món ăn vào từng hóa đơn tương ứng bằng JavaScript
  const recentOrdersWithItems =
    recentOrdersData?.map((order) => ({
      ...order,
      order_items:
        recentItemsData?.filter((item) => item.order_id === order.id) || [],
    })) || [];

  // ========================================================
  // 📈 XỬ LÝ BIỂU ĐỒ DOANH THU 7 NGÀY (THỰC TẾ 100%)
  // ========================================================
  const weekdayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const revenueData = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);

    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const dateStr = `${day}/${month}`;
    const dayName = weekdayNames[d.getDay()];

    const dayRevenue =
      weeklyOrdersData?.reduce((sum, order) => {
        const orderDate = new Date(order.created_at);
        const oDay = String(orderDate.getDate()).padStart(2, "0");
        const oMonth = String(orderDate.getMonth() + 1).padStart(2, "0");
        const oDateStr = `${oDay}/${oMonth}`;

        if (oDateStr === dateStr && order.status !== "cancelled") {
          return sum + (Number(order.total) || 0);
        }
        return sum;
      }, 0) || 0;

    revenueData.push({
      name: `${dayName} (${dateStr})`,
      revenue: dayRevenue,
    });
  }

  // ========================================================
  // 🍳 XỬ LÝ TOP MÓN ĂN BÁN CHẠY (THỰC TẾ 100%)
  // ========================================================
  const itemSalesMap: { [key: string]: any } = {};
  allOrderItems?.forEach((item: any) => {
    const menuItem = item.menu_item;
    if (!menuItem) return;

    if (!itemSalesMap[menuItem.id]) {
      itemSalesMap[menuItem.id] = {
        id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        image_url: menuItem.image_url,
        total_sold: 0,
      };
    }
    itemSalesMap[menuItem.id].total_sold += item.quantity || 0;
  });

  const topSellingItems = Object.values(itemSalesMap)
    .sort((a: any, b: any) => b.total_sold - a.total_sold)
    .slice(0, 5) as (MenuItem & { total_sold: number })[];

  // ========================================================
  // 📊 TÍNH TOÁN CÁC CHỈ SỐ KPI TRONG NGÀY
  // ========================================================
  const todayRevenue =
    todayOrdersData?.reduce((sum, order) => {
      if (order.status !== "cancelled") {
        return sum + (Number(order.total) || 0);
      }
      return sum;
    }, 0) || 0;

  const occupiedTables =
    tables?.filter((t) => t.status === "occupied").length || 0;
  const availableTables =
    tables?.filter((t) => t.status === "available").length || 0;
  const reservedTables =
    tables?.filter((t) => t.status === "reserved").length || 0;

  return {
    tables: tables || [],
    areas: areas || [],
    recentOrders: recentOrdersWithItems, // Đã đồng bộ đầy đủ mảng order_items bên trong
    topSellingItems,
    revenueData,
    stats: {
      todayRevenue,
      todayOrders: todayOrdersData?.length || 0,
      activeOrders: activeOrdersData?.length || 0,
      occupiedTables,
      totalTables: tables?.length || 0,
      availableTables,
      reservedTables,
    },
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <>
      <Header title="Dashboard" />
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        <DashboardContent {...data} />
      </main>
    </>
  );
}
