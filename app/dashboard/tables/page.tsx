import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/dashboard/header";
import { TablesContent } from "./tables-content";

export const revalidate = 0;
export const dynamic = "force-dynamic";

async function getTablesData() {
  const supabase = await createClient();

  const [{ data: tables }, { data: areas }, { data: activeOrders }] =
    await Promise.all([
      supabase.from("tables").select("*, area:areas(*)").order("name"),

      supabase
        .from("areas")
        .select("*")
        .eq("is_active", true)
        .order("sort_order"),

      supabase
        .from("orders")
        .select(
          "*, table:tables(*), items:order_items(*, menu_item:menu_items(*))",
        )
        .not("status", "in", '("completed","cancelled")'),
    ]);

  return {
    tables: tables || [],
    areas: areas || [],
    activeOrders: activeOrders || [],
  };
}

export default async function TablesPage() {
  const data = await getTablesData();

  return (
    <>
      <Header title="Sơ đồ bàn" />
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        <TablesContent {...data} />
      </main>
    </>
  );
}
