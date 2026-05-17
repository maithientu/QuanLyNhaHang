'use client'

import { useState } from 'react'
import { MenuItem, MenuCategory } from '@/lib/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2, 
  LayoutGrid, 
  List,
  Clock,
  UtensilsCrossed
} from 'lucide-react'

interface MenuContentProps {
  categories: MenuCategory[]
  items: (MenuItem & { category?: MenuCategory })[]
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

export function MenuContent({ categories, items }: MenuContentProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getItemsByCategory = (categoryId: string) => {
    return filteredItems.filter((item) => item.category_id === categoryId)
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm món ăn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Thêm món
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Thêm món mới</DialogTitle>
                <DialogDescription>
                  Nhập thông tin món ăn mới vào thực đơn
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tên món</Label>
                  <Input id="name" placeholder="VD: Phở bò tái" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Danh mục</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Giá bán (VND)</Label>
                    <Input id="price" type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cost">Giá vốn (VND)</Label>
                    <Input id="cost" type="number" placeholder="0" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prepTime">Thời gian chuẩn bị (phút)</Label>
                  <Input id="prepTime" type="number" placeholder="15" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Mô tả</Label>
                  <Textarea id="description" placeholder="Mô tả ngắn về món ăn..." />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="available">Còn phục vụ</Label>
                  <Switch id="available" defaultChecked />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={() => setIsAddDialogOpen(false)}>
                  Thêm món
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Categories Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-2 bg-transparent p-0">
          <TabsTrigger 
            value="all" 
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Tất cả
            <Badge variant="secondary" className="ml-2">{filteredItems.length}</Badge>
          </TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger 
              key={category.id} 
              value={category.id}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {category.name}
              <Badge variant="secondary" className="ml-2">
                {getItemsByCategory(category.id).length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {viewMode === 'grid' ? (
            <MenuGrid items={filteredItems} />
          ) : (
            <MenuTable items={filteredItems} />
          )}
        </TabsContent>

        {categories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="mt-6">
            {viewMode === 'grid' ? (
              <MenuGrid items={getItemsByCategory(category.id)} />
            ) : (
              <MenuTable items={getItemsByCategory(category.id)} />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function MenuGrid({ items }: { items: (MenuItem & { category?: MenuCategory })[] }) {
  if (items.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-12">
        <UtensilsCrossed className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Không tìm thấy món ăn nào</p>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => (
        <Card key={item.id} className="overflow-hidden group">
          <div className="aspect-video bg-muted relative">
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className="object-cover w-full h-full" />
            ) : (
              <div className="flex items-center justify-center h-full">
                <UtensilsCrossed className="h-12 w-12 text-muted-foreground/50" />
              </div>
            )}
            {!item.is_available && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <Badge variant="destructive">Hết món</Badge>
              </div>
            )}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <Button size="icon" variant="secondary" className="h-8 w-8">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="secondary" className="h-8 w-8 text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{item.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {item.description || 'Không có mô tả'}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>{item.preparation_time} phút</span>
              </div>
              <span className="font-bold text-primary">
                {formatCurrency(item.price)}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function MenuTable({ items }: { items: (MenuItem & { category?: MenuCategory })[] }) {
  if (items.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-12">
        <UtensilsCrossed className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Không tìm thấy món ăn nào</p>
      </Card>
    )
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tên món</TableHead>
            <TableHead>Danh mục</TableHead>
            <TableHead>Giá bán</TableHead>
            <TableHead>Giá vốn</TableHead>
            <TableHead>Thời gian</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {item.description}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{item.category?.name}</Badge>
              </TableCell>
              <TableCell className="font-medium">{formatCurrency(item.price)}</TableCell>
              <TableCell className="text-muted-foreground">{formatCurrency(item.cost_price)}</TableCell>
              <TableCell>{item.preparation_time} phút</TableCell>
              <TableCell>
                <Badge variant={item.is_available ? 'default' : 'destructive'}>
                  {item.is_available ? 'Còn phục vụ' : 'Hết món'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}
