import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/header'
import { POSContent } from './pos-content'

async function getPOSData() {
  const supabase = await createClient()

  const { data: tables } = await supabase
    .from('tables')
    .select('*, area:areas(*)')
    .eq('is_active', true)
    .order('name')

  const { data: categories } = await supabase
    .from('menu_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')

  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('*, category:menu_categories(*)')
    .eq('is_active', true)
    .eq('is_available', true)
    .order('name')

  return {
    tables: tables || [],
    categories: categories || [],
    menuItems: menuItems || [],
  }
}

export default async function POSPage() {
  const data = await getPOSData()

  return (
    <>
      <Header title="Đặt món (POS)" />
      <main className="flex-1 overflow-hidden">
        <POSContent {...data} />
      </main>
    </>
  )
}
