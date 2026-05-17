import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/header'
import { DashboardContent } from './dashboard-content'

async function getDashboardData() {
  const supabase = await createClient()

  // Fetch tables with areas
  const { data: tables } = await supabase
    .from('tables')
    .select('*, area:areas(*)')
    .eq('is_active', true)
    .order('name')

  // Fetch areas
  const { data: areas } = await supabase
    .from('areas')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  // Fetch today's orders
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const { data: todayOrders } = await supabase
    .from('orders')
    .select('*, table:tables(*)')
    .gte('created_at', today.toISOString())
    .order('created_at', { ascending: false })

  // Fetch active orders (not completed or cancelled)
  const { data: activeOrders } = await supabase
    .from('orders')
    .select('*, table:tables(*)')
    .not('status', 'in', '("completed","cancelled")')
    .order('created_at', { ascending: false })
    .limit(10)

  // Fetch menu items for top selling (mock data for now)
  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('*')
    .eq('is_active', true)
    .limit(5)

  // Calculate stats
  const todayRevenue = todayOrders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0
  const occupiedTables = tables?.filter((t) => t.status === 'occupied').length || 0
  const availableTables = tables?.filter((t) => t.status === 'available').length || 0
  const reservedTables = tables?.filter((t) => t.status === 'reserved').length || 0

  // Mock revenue data for chart (7 days)
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
  const revenueData = days.map((name, index) => ({
    name,
    revenue: Math.floor(Math.random() * 5000000) + 2000000,
  }))

  // Add mock total_sold for menu items
  const topSellingItems = menuItems?.map((item) => ({
    ...item,
    total_sold: Math.floor(Math.random() * 50) + 10,
  })) || []

  return {
    tables: tables || [],
    areas: areas || [],
    recentOrders: activeOrders || [],
    topSellingItems,
    revenueData,
    stats: {
      todayRevenue,
      todayOrders: todayOrders?.length || 0,
      activeOrders: activeOrders?.length || 0,
      occupiedTables,
      totalTables: tables?.length || 0,
      availableTables,
      reservedTables,
    },
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <>
      <Header title="Dashboard" />
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        <DashboardContent {...data} />
      </main>
    </>
  )
}
