import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/header'
import { BillingContent } from './billing-content'

export const revalidate = 10

async function getBillingData() {
  const supabase = await createClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    { data: orders },
    { data: todayPayments }
  ] = await Promise.all([
    supabase
      .from('orders')
      .select(`
        *,
        table:tables(*),
        items:order_items(*, menu_item:menu_items(*))
      `)
      .in('status', ['served', 'ready', 'preparing', 'confirmed'])
      .order('created_at', { ascending: false }),

    supabase
      .from('payments')
      .select('*')
      .eq('status', 'paid')
      .gte('created_at', today.toISOString())
  ])

  const todayRevenue = todayPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
  const todayTransactions = todayPayments?.length || 0

  return {
    orders: orders || [],
    stats: {
      todayRevenue,
      todayTransactions,
    },
  }
}

export default async function BillingPage() {
  const data = await getBillingData()

  return (
    <>
      <Header title="Thanh toán" />
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        <BillingContent {...data} />
      </main>
    </>
  )
}
