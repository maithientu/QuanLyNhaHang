'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  UtensilsCrossed,
  Grid3X3,
  ShoppingCart,
  ChefHat,
  Receipt,
  BarChart3,
  Users,
  Settings,
  CalendarDays,
  LogOut,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

const mainNavItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Sơ đồ bàn',
    url: '/dashboard/tables',
    icon: Grid3X3,
  },
  {
    title: 'Đặt món (POS)',
    url: '/dashboard/pos',
    icon: ShoppingCart,
  },
  {
    title: 'Bếp (KDS)',
    url: '/dashboard/kitchen',
    icon: ChefHat,
  },
  {
    title: 'Thanh toán',
    url: '/dashboard/billing',
    icon: Receipt,
  },
]

const managementNavItems = [
  {
    title: 'Thực đơn',
    url: '/dashboard/menu',
    icon: UtensilsCrossed,
  },
  {
    title: 'Đặt bàn',
    url: '/dashboard/reservations',
    icon: CalendarDays,
  },
  {
    title: 'Báo cáo',
    url: '/dashboard/reports',
    icon: BarChart3,
  },
  {
    title: 'Nhân viên',
    url: '/dashboard/staff',
    icon: Users,
  },
  {
    title: 'Cài đặt',
    url: '/dashboard/settings',
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="p-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <UtensilsCrossed className="h-6 w-6" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-lg font-bold text-sidebar-foreground">RestaurantPOS</span>
            <span className="text-xs text-sidebar-foreground/60">Quản lý nhà hàng</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Hoạt động</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Quản lý</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-white font-bold">AD</AvatarFallback>
          </Avatar>
          <div className="flex flex-1 flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-bold text-foreground">Admin</span>
            <span className="text-xs text-muted-foreground">Quản lý</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 group-data-[collapsible=icon]:hidden text-foreground hover:bg-muted"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
