"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Table, Area, MenuItem, MenuCategory } from "@/lib/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Users,
  Receipt,
  Send,
  X,
  FileText,
} from "lucide-react";

interface POSContentProps {
  tables: (Table & { area?: Area })[];
  categories: MenuCategory[];
  menuItems: (MenuItem & { category?: MenuCategory })[];
}

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  note: string; // Chuyển thành chuỗi bắt buộc để quản lý ghi chú từng món ăn tốt hơn
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

export function POSContent({ tables, categories, menuItems }: POSContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const qrTableId = searchParams.get("tableId");
  const isCustomer = searchParams.get("role") === "customer";

  const [selectedTable, setSelectedTable] = useState<string>("none"); // Tránh chuỗi rỗng để Select Component chạy mượt hơn
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [guestCount, setGuestCount] = useState<string>("1"); // Dùng dạng string giúp trải nghiệm gõ phím không bị nhảy số dội ngược
  const [orderNote, setOrderNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // Chặn spam click liên tục khi đang xử lý

  const availableTables = tables.filter(
    (t) =>
      t.status === "available" ||
      t.status === "reserved" ||
      t.status === "occupied",
  );

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || item.category_id === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menuItems, searchQuery, selectedCategory]);

  const addToCart = (menuItem: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.menuItem.id === menuItem.id);
      if (existing) {
        return prev.map((item) =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { menuItem, quantity: 1, note: "" }];
    });
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.menuItem.id === menuItemId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  // Hàm cập nhật ghi chú riêng cho từng món ăn cụ thể
  const updateItemNote = (menuItemId: string, note: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.menuItem.id === menuItemId ? { ...item, note } : item,
      ),
    );
  };

  const removeFromCart = (menuItemId: string) => {
    setCart((prev) => prev.filter((item) => item.menuItem.id !== menuItemId));
  };

  const clearCart = () => {
    setCart([]);
    setOrderNote("");
    setGuestCount("1");
    setSelectedTable("none");
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0,
  );
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const selectedTableData = tables.find((t) => t.id === selectedTable);

  // Khung xử lý API sẽ được tích hợp tại đây ở bước sau (Giữ tạm hàm rỗng để chạy giao diện)
  const handleCreateOrder = async (
    orderType: "send_kitchen" | "immediate_pay",
  ) => {
    if (cart.length === 0 || selectedTable === "none") return;

    try {
      setIsSubmitting(true);

      // Gửi dữ liệu giỏ hàng lên Backend xử lý
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table_id: selectedTable,
          guest_count: parseInt(guestCount) || 1,
          items: cart.map((item) => ({
            menu_item_id: item.menuItem.id,
            quantity: item.quantity,
            note: item.note.trim() === "" ? null : item.note.trim(),
          })),
          note: orderNote.trim() === "" ? null : orderNote.trim(),
          action_type: orderType,
          is_customer: isCustomer, // Gửi kèm nhãn để Backend biết ai đặt món
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Có lỗi xảy ra");

      // Quy tắc Đồng bộ State của dự án:
      clearCart(); // 1. Xóa trống giỏ hàng cục bộ ngay lập tức
      router.refresh(); // 2. Ép Server Component đồng bộ trạng thái ngầm từ máy chủ

      // Thông báo trạng thái dựa trên đối tượng đặt món
      if (isCustomer) {
        alert(
          "Món ăn đã được gửi lên hệ thống! Vui lòng đợi nhân viên xác nhận và gửi xuống bếp.",
        );
      } else {
        alert(
          orderType === "send_kitchen"
            ? "Đã gửi đơn xuống bếp thành công!"
            : "Hóa đơn đã được thanh toán!",
        );
      }
    } catch (error: any) {
      console.error(error);
      alert(
        error.message || "Không thể gửi bếp. Vui lòng kiểm tra lại kết nối!",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
            >
              Tất cả
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={
                  selectedCategory === category.id ? "default" : "outline"
                }
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </ScrollArea>

        {/* Menu Items Grid */}
        <ScrollArea className="flex-1 h-0">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pb-4">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className="cursor-pointer hover:border-primary transition-colors overflow-hidden"
                onClick={() => addToCart(item)}
              >
                <div className="aspect-square bg-muted relative">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="object-cover w-full h-full"
                    />
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
      <div className="w-[380px] border-l bg-card flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
        {/* Table Selection Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <Select
              value={selectedTable}
              onValueChange={setSelectedTable}
              disabled={isCustomer}
            >
              <SelectTrigger className="flex-1 disabled:opacity-100 disabled:bg-muted font-semibold text-primary">
                {isCustomer ? (
                  <div className="flex items-center gap-2">
                    <span>📱</span>
                    <span>{selectedTableData?.name || "Đang quét bàn..."}</span>
                  </div>
                ) : (
                  <SelectValue placeholder="Chọn bàn" />
                )}
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" disabled>
                  Chọn bàn phục vụ
                </SelectItem>
                {availableTables.map((table) => (
                  <SelectItem key={table.id} value={table.id}>
                    {table.name} - {table.area?.name}
                    {table.status === "occupied" && " (🔴 Đang có khách)"}
                    {table.status === "reserved" && " (🟡 Đã đặt trước)"}
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
                onChange={(e) => setGuestCount(e.target.value)}
                disabled={isCustomer}
                className="w-16 text-center"
              />
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* ĐÃ SỬA: Thêm class="flex-1 h-0" vào ScrollArea để kích hoạt thanh trượt cuộn mượt mà */}
        {/* ========================================================= */}
        <ScrollArea className="flex-1 h-0 border-b">
          <div className="p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mb-3" />
                <p>Chưa có món nào</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.menuItem.id}
                  className="flex flex-col gap-2 p-3 rounded-lg border bg-background"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {item.menuItem.name}
                      </h4>
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
                        disabled={isSubmitting}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.menuItem.id, 1)}
                        disabled={isSubmitting}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => removeFromCart(item.menuItem.id)}
                        disabled={isSubmitting}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Ô ghi chú nhỏ cho từng món ăn */}
                  <div className="flex items-center gap-1.5 opacity-80">
                    <input
                      type="text"
                      placeholder="Ghi chú món này (ít cay, không hành...)"
                      value={item.note}
                      onChange={(e) =>
                        updateItemNote(item.menuItem.id, e.target.value)
                      }
                      disabled={isSubmitting}
                      className="w-full bg-transparent text-xs text-muted-foreground focus:text-foreground outline-none border-b border-dashed pb-0.5"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Order Note Tổng */}
        {cart.length > 0 && (
          <div className="px-4 pt-3">
            <Textarea
              placeholder="Ghi chú tổng cho toàn bộ hóa đơn..."
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              className="resize-none h-16"
              disabled={isSubmitting}
            />
          </div>
        )}

        {/* Cart Summary & Action Buttons */}
        <div className="p-4 space-y-3 bg-background border-t mt-auto">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Tạm tính ({cart.reduce((sum, i) => sum + i.quantity, 0)} món)
              </span>
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
            <Button
              variant="outline"
              onClick={clearCart}
              disabled={cart.length === 0 || isSubmitting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Xóa tất cả
            </Button>

            {/* ========================================================= */}
            {/* ĐÃ SỬA: Gắn onClick và cấu hình chặn disabled khi đang gửi dữ liệu */}
            {/* ========================================================= */}
            <Button
              disabled={
                cart.length === 0 || selectedTable === "none" || isSubmitting
              }
              onClick={() => handleCreateOrder("send_kitchen")}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold"
            >
              <Send className="h-4 w-4 mr-2" />
              Gửi bếp
            </Button>
          </div>

          {!isCustomer && (
            <Button
              className="w-full"
              variant="secondary"
              disabled={
                cart.length === 0 || selectedTable === "none" || isSubmitting
              }
              onClick={() => handleCreateOrder("immediate_pay")}
            >
              <Receipt className="h-4 w-4 mr-2" />
              Thanh toán luôn
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
