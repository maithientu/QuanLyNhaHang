'use client'

import { useState, useMemo } from 'react'
import { Table, Area, MenuItem, MenuCategory } from '@/lib/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart,
  Users,
  Receipt,
  Send,
  X
} from 'lucide-react'

interface POSContentProps {
  tables: (Table & { area?: Area })[]
  categories: MenuCategory[]
  menuItems: (MenuItem & { category?: MenuCategory })[]
}

interface CartItem {
  menuItem: MenuItem
  quantity: number
  note?: string
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

export function POSContent({ tables, categories, menuItems }: POSContentProps) {
  const [selectedTable, setSelectedTable] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [guestCount, setGuestCount] = useState(1)
  const [orderNote, setOrderNote] = useState('')

  const availableTables = tables.filter((t) => t.status === 'available' || t.status === 'reserved')

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [menuItems, searchQuery, selectedCategory])

  const addToCart = (menuItem: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.menuItem.id === menuItem.id)
      if (existing) {
        return prev.map((item) =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { menuItem, quantity: 1 }]
    })
  }

  const updateQuantity = (menuItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.menuItem.id === menuItemId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  const removeFromCart = (menuItemId: string) => {
    setCart((prev) => prev.filter((item) => item.menuItem.id !== menuItemId))
  }

  const clearCart = () => {
    setCart([])
    setOrderNote('')
    setGuestCount(1)
  }

  const subtotal = cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0)
  const tax = subtotal * 0.1
  const total = subtotal + tax

  const selectedTableData = tables.find((t) => t.id === selectedTable)

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Menu Section */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        {/* Search and Filters */}
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm món ăn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Categories */}
        <ScrollArea className="w-full whitespace-nowrap mb-4">
          <div className="flex gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              Tất cả
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </ScrollArea>

        {/* Menu Items Grid */}
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pb-4">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className="cursor-pointer hover:border-primary transition-colors overflow-hidden"
                onClick={() => addToCart(item)}
              >
                <div className="aspect-square bg-muted relative">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="object-cover w-full h-full" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-4xl">
                      🍽️
                    </div>
                  )}
                  <Badge className="absolute top-2 left-2 bg-background/80 text-foreground">
                    {item.category?.name}
                  </Badge>
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm truncate">{item.name}</h3>
                  <p className="font-bold text-primary mt-1">
                    {formatCurrency(item.price)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Cart Section */}
      <div className="w-[380px] border-l bg-card flex flex-col">
        {/* Table Selection */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Chọn bàn" />
              </SelectTrigger>
              <SelectContent>
                {availableTables.map((table) => (
                  <SelectItem key={table.id} value={table.id}>
                    {table.name} - {table.area?.name} ({table.capacity} chỗ)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Input
                type="number"
                min={1}
                value={guestCount}
                onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                className="w-16 text-center"
              />
            </div>
          </div>
          {selectedTableData && (
            <div className="mt-2 text-sm text-muted-foreground">
              {selectedTableData.area?.name} - Sức chứa: {selectedTableData.capacity} người
            </div>
          )}
        </div>

        {/* Cart Items */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mb-3" />
                <p>Chưa có món nào</p>
                <p className="text-sm">Chọn món từ menu bên trái</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.menuItem.id} className="flex items-start gap-3 p-3 rounded-lg border bg-background">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{item.menuItem.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(item.menuItem.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.menuItem.id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.menuItem.id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => removeFromCart(item.menuItem.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Order Note */}
        {cart.length > 0 && (
          <div className="px-4 pb-3">
            <Textarea
              placeholder="Ghi chú đơn hàng..."
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              className="resize-none h-20"
            />
          </div>
        )}

        {/* Cart Summary */}
        <div className="p-4 border-t space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tạm tính ({cart.reduce((sum, i) => sum + i.quantity, 0)} món)</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">VAT (10%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Tổng cộng</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={clearCart} disabled={cart.length === 0}>
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa tất cả
            </Button>
            <Button disabled={cart.length === 0 || !selectedTable}>
              <Send className="h-4 w-4 mr-2" />
              Gửi bếp
            </Button>
          </div>
          <Button className="w-full" variant="secondary" disabled={cart.length === 0}>
            <Receipt className="h-4 w-4 mr-2" />
            Thanh toán luôn
          </Button>
        </div>
      </div>
    </div>
  )
}
