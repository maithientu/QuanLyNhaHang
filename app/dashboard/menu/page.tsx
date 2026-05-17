import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/dashboard/header'
import { MenuContent } from './menu-content'

async function getMenuData() {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('menu_categories')
    .select('*')
    .order('sort_order')

  const { data: items } = await supabase
    .from('menu_items')
    .select('*, category:menu_categories(*)')
    .order('name')

  return {
    categories: categories || [],
    items: items || [],
  }
}

export default async function MenuPage() {
  const data = await getMenuData()

  return (
    <>
      <Header title="Quản lý thực đơn" />
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        <MenuContent {...data} />
      </main>
    </>
  )
}
