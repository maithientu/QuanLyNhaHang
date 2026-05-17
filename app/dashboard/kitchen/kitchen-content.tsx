'use client'

import { useState } from 'react'
import { Order, Table, OrderItem, MenuItem } from '@/lib/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { 
  Clock, 
  ChefHat, 
  Bell, 
  CheckCircle2,
  Timer,
  UtensilsCrossed,
  AlertCircle
} from 'lucide-react'

interface KitchenContentProps {
  orders: (Order & { 
    table?: Table
    items?: (OrderItem & { menu_item?: MenuItem })[] 
  })[]
}

const statusConfig = {
  pending: { 
    label: 'Chờ xác nhận', 
    className: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/50',
    icon: AlertCircle
  },
  confirmed: { 
    label: 'Đã xác nhận', 
    className: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/50',
    icon: Clock
  },
  preparing: { 
    label: 'Đang nấu', 
    className: 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/50',
    icon: ChefHat
  },
  ready: { 
    label: 'Sẵn sàng', 
    className: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/50',
    icon: Bell
  },
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getElapsedTime(dateString: string) {
  const now = new Date()
  const created = new Date(dateString)
  const diff = Math.floor((now.getTime() - created.getTime()) / 1000 / 60)
  
  if (diff < 1) return 'Vừa xong'
  if (diff < 60) return `${diff} phút`
  return `${Math.floor(diff / 60)}h ${diff % 60}p`
}

function getTimeColor(dateString: string) {
  const now = new Date()
  const created = new Date(dateString)
  const diff = Math.floor((now.getTime() - created.getTime()) / 1000 / 60)
  
  if (diff < 10) return 'text-green-600'
  if (diff < 20) return 'text-yellow-600'
  return 'text-red-600'
}

export function KitchenContent({ orders }: KitchenContentProps) {
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set())

  const toggleItemComplete = (itemId: string) => {
    setCompletedItems((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }

  const pendingOrders = orders.filter((o) => o.status === 'pending')
  const preparingOrders = orders.filter((o) => o.status === 'confirmed' || o.status === 'preparing')
  const readyOrders = orders.filter((o) => o.status === 'ready')

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)]">
        <ChefHat className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Không có đơn hàng</h2>
        <p className="text-muted-foreground">Các đơn hàng mới sẽ xuất hiện tại đây</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="flex items-center gap-4 text-sm">
        <Badge variant="outline" className="gap-2 py-1.5 px-3">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          Chờ xác nhận: {pendingOrders.length}
        </Badge>
        <Badge variant="outline" className="gap-2 py-1.5 px-3">
          <ChefHat className="h-4 w-4 text-orange-500" />
          Đang nấu: {preparingOrders.length}
        </Badge>
        <Badge variant="outline" className="gap-2 py-1.5 px-3">
          <Bell className="h-4 w-4 text-green-500" />
          Sẵn sàng: {readyOrders.length}
        </Badge>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {orders.map((order) => {
          const StatusIcon = statusConfig[order.status as keyof typeof statusConfig]?.icon || Clock
          const allItemsComplete = order.items?.every((item) => completedItems.has(item.id))
          
          return (
            <Card 
              key={order.id} 
              className={cn(
                'overflow-hidden transition-all',
                statusConfig[order.status as keyof typeof statusConfig]?.className,
                allItemsComplete && 'ring-2 ring-green-500'
              )}
            >
              <CardHeader className="p-4 pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      #{order.order_number}
                      <Badge variant="secondary" className="font-normal">
                        {order.table?.name || 'Mang về'}
                      </Badge>
                    </CardTitle>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatTime(order.created_at)}
                      </span>
                      <span className={cn('flex items-center gap-1 font-medium', getTimeColor(order.created_at))}>
                        <Timer className="h-3.5 w-3.5" />
                        {getElapsedTime(order.created_at)}
                      </span>
                    </div>
                  </div>
                  <Badge className={statusConfig[order.status as keyof typeof statusConfig]?.className}>
                    <StatusIcon className="h-3.5 w-3.5 mr-1" />
                    {statusConfig[order.status as keyof typeof statusConfig]?.label}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-0">
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {order.items?.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          'flex items-start gap-3 p-2 rounded-lg transition-all',
                          completedItems.has(item.id) 
                            ? 'bg-green-500/10 line-through opacity-60' 
                            : 'bg-background/50'
                        )}
                      >
                        <Checkbox
                          checked={completedItems.has(item.id)}
                          onCheckedChange={() => toggleItemComplete(item.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg">{item.quantity}x</span>
                            <span className="font-medium truncate">{item.menu_item?.name}</span>
                          </div>
                          {item.note && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Ghi chú: {item.note}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {order.note && (
                  <div className="mt-3 p-2 rounded-lg bg-yellow-500/10 text-sm">
                    <span className="font-medium">Ghi chú:</span> {order.note}
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  {order.status === 'pending' && (
                    <Button className="flex-1" size="sm">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Xác nhận
                    </Button>
                  )}
                  {(order.status === 'confirmed' || order.status === 'preparing') && (
                    <>
                      <Button variant="outline" className="flex-1" size="sm">
                        <ChefHat className="h-4 w-4 mr-2" />
                        Đang nấu
                      </Button>
                      <Button className="flex-1" size="sm" disabled={!allItemsComplete}>
                        <Bell className="h-4 w-4 mr-2" />
                        Sẵn sàng
                      </Button>
                    </>
                  )}
                  {order.status === 'ready' && (
                    <Button className="flex-1" size="sm" variant="secondary">
                      <UtensilsCrossed className="h-4 w-4 mr-2" />
                      Đã phục vụ
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
