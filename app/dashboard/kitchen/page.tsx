import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/header'
import { KitchenContent } from './kitchen-content'

async function getKitchenData() {
  const supabase = await createClient()

  // Get all active orders with their items
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      table:tables(*),
      items:order_items(*, menu_item:menu_items(*))
    `)
    .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
    .order('created_at', { ascending: true })

  return {
    orders: orders || [],
  }
}

export default async function KitchenPage() {
  const data = await getKitchenData()

  return (
    <>
      <Header title="Màn hình bếp (KDS)" />
      <main className="flex-1 p-4 md:p-6 overflow-auto bg-muted/30">
        <KitchenContent {...data} />
      </main>
    </>
  )
}
