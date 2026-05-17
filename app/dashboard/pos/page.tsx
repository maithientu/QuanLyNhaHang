import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/header'
import { POSContent } from './pos-content'

export const revalidate = 30

async function getPOSData() {
  const supabase = await createClient()

  const [
    { data: tables },
    { data: categories },
    { data: menuItems }
  ] = await Promise.all([
    supabase
      .from('tables')
      .select('*, area:areas(*)')
      .eq('is_active', true)
      .order('name'),

    supabase
      .from('menu_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order'),

    supabase
      .from('menu_items')
      .select('*, category:menu_categories(*)')
      .eq('is_active', true)
      .eq('is_available', true)
      .order('name')
  ])

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
