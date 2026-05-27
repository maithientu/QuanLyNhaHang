"use client";

import { useState } from "react";
import { MenuItem, MenuCategory } from "@/lib/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  LayoutGrid,
  List,
  Clock,
  UtensilsCrossed,
} from "lucide-react";
import { Value } from "@radix-ui/react-select";

interface MenuContentProps {
  categories: MenuCategory[];
  items: (MenuItem & { category?: MenuCategory })[];
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

export function MenuContent({ categories, items }: MenuContentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Thêm mới: State quản lý form thêm món ---
  const [formData, setFormData] = useState({
    name: "",
    category_id: "",
    price: 0,
    cost_price: 0,
    preparation_time: 15,
    description: "",
    is_available: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false); // Trạng thái đợi API lưu dữ liệu

  // --- HÀM GỌI API (FETCH) ĐỂ LƯU MÓN ĂN MỚI LÊN DATABASE ---
  const handleCreateItem = async () => {
    // Kiểm tra dữ liệu bắt buộc trước khi gửi đi
    if (!formData.name || !formData.category_id || formData.price <= 0) {
      alert("Vui lòng điền đầy đủ Tên món, Danh mục và Giá bán lớn hơn 0!");
      return;
    }

    setIsSubmitting(true); // Bật trạng thái loading chặn người dùng bấm liên tục

    try {
      // Dùng "người đưa thư" fetch gửi gói dữ liệu JSON tới file route.ts (POST)
      const response = await fetch("/api/menu-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          price: Number(formData.price),
          description: formData.description,
          category_id: formData.category_id,
          preparation_time: Number(formData.preparation_time),
          cost_price: Number(formData.cost_price),
          is_available: formData.is_available,
          // Bạn có thể bổ sung thêm cost_price hoặc is_available nếu db của bạn có các cột này
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Không thể thêm món ăn mới");
      }

      // Nếu thành công: đóng popup, reset form và tải lại trang để hiển thị món mới
      alert("Thêm món ăn mới thành công!");
      setIsAddDialogOpen(false);
      window.location.reload();
    } catch (error: any) {
      alert(`Lỗi hệ thống: ${error.message}`);
    } finally {
      setIsSubmitting(false); // Tắt trạng thái loading
    }
  };

  // --- STATE QUẢN LÝ POPUP CHỈNH SỬA VÀ DỮ LIỆU ĐANG SỬA MÓN ---
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // --- HÀM XỬ LÝ API XÓA MÓN (GỌI ĐẾN ĐƯỜNG DẪN DELETE /api/menu-items/[id]) ---
  const handleDeleteItem = async (id: string, name: string) => {
    const confirmDelete = window.confirm(
      `Bạn có chắc chắn muốn hủy món "${name}" khỏi thực đơn không?`,
    );
    if (!confirmDelete) return;

    try {
      const response = await fetch(`/api/menu-items/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Gặp lỗi khi xóa");

      alert("Đã hủy món ăn thành công!");
      window.location.reload(); // Làm mới trang để cập nhật giao diện
    } catch (error: any) {
      alert(`Lỗi: ${error.message}`);
    }
  };

  // --- HÀM XỬ LÝ API SỬA MÓN (GỌI ĐẾN ĐƯỜNG DẪN PATCH /api/menu-items/[id]) ---
  const handleUpdateItem = async () => {
    if (!editingItem.name || editingItem.price <= 0) {
      alert("Vui lòng điền tên món và giá bán lớn hơn 0!");
      return;
    }
    // Thêm kiểm tra ID món ăn trước khi gọi API
    if (!editingItem.id || editingItem.id === "undefined") {
      alert("Không tìm thấy ID món ăn để cập nhật. Vui lòng thử lại.");
      setIsSubmittingEdit(false); // Đảm bảo tắt trạng thái gửi nếu có lỗi
      return;
    }

    setIsSubmittingEdit(true);
    try {
      const response = await fetch(`/api/menu-items/${editingItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingItem.name,
          price: Number(editingItem.price),
          description: editingItem.description,
          preparation_time: Number(editingItem.preparation_time),
          is_available: editingItem.is_available,
          category_id: editingItem.category_id || editingItem.category?.id, // Cập nhật category_id nếu có thay đổi
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gặp lỗi khi cập nhật");

      alert("Cập nhật thông tin món ăn thành công!");
      setIsEditDialogOpen(false);
      window.location.reload();
    } catch (error: any) {
      alert(`Lỗi: ${error.message}`);
    } finally {
      setIsSubmittingEdit(false);
    }
  };
  // Kết thúc State và hàm xử lý API cho thêm/sửa/xóa món ăn

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || item.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // 1. Tạo riêng một mảng lọc CHỈ THEO TỪ KHÓA TÌM KIẾM (Dùng chung cho việc đếm số lượng Badge)
  const itemsMatchedSearch = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // 2. Cập nhật hàm đếm số lượng cho từng danh mục con (Lấy dữ liệu từ mảng lọc tìm kiếm ở trên)
  const getItemsByCategory = (categoryId: string) => {
    return itemsMatchedSearch.filter((item) => item.category_id === categoryId);
  };

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
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("list")}
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
              {" "}
              {/* Form thêm món , đồng bộ các ô nhập liệu với state*/}
              <DialogHeader>
                <DialogTitle>Thêm món mới</DialogTitle>
                <DialogDescription>
                  Nhập thông tin món ăn mới vào thực đơn
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tên món</Label>
                  <Input
                    id="name"
                    placeholder="VD: Phở bò tái"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Danh mục</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Giá bán (VND)</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="0"
                      value={formData.price || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cost">Giá vốn (VND)</Label>
                    <Input
                      id="cost"
                      type="number"
                      placeholder="0"
                      value={formData.cost_price || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          cost_price: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prepTime">Thời gian chuẩn bị (phút)</Label>
                  <Input
                    id="prepTime"
                    type="number"
                    placeholder="15"
                    value={formData.preparation_time}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preparation_time: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Mô tả</Label>
                  <Textarea
                    id="description"
                    placeholder="Mô tả ngắn về món ăn..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="available">Còn phục vụ</Label>
                  <Switch
                    id="available"
                    defaultChecked
                    checked={formData.is_available}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_available: checked })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Hủy
                </Button>
                <Button onClick={handleCreateItem} disabled={isSubmitting}>
                  {isSubmitting ? "Đang tạo..." : "Thêm món"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Categories Tabs */}
      <Tabs
        value={selectedCategory}
        onValueChange={(value) => setSelectedCategory(value)}
        className="w-full"
      >
        <TabsList className="w-full justify-start flex-wrap h-auto gap-2 bg-transparent p-0">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Tất cả
            <Badge variant="secondary" className="ml-2">
              {itemsMatchedSearch.length}
            </Badge>
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

        <TabsContent value={selectedCategory || "all"} className="mt-6">
          {viewMode === "grid" ? (
            <MenuGrid
              items={filteredItems}
              onDelete={handleDeleteItem}
              onEdit={(item) => {
                console.log("Item selected for editing:", item);
                setEditingItem(item);
                setIsEditDialogOpen(true);
              }}
            />
          ) : (
            <MenuTable
              items={filteredItems}
              onDelete={handleDeleteItem}
              onEdit={(item) => {
                console.log("Item selected for editing:", item);
                setEditingItem(item);
                setIsEditDialogOpen(true);
              }}
            />
          )}
        </TabsContent>

        {/* {categories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="mt-6">
            {viewMode === "grid" ? (
              <MenuGrid items={getItemsByCategory(category.id)} />
            ) : (
              <MenuTable items={getItemsByCategory(category.id)} />
            )}
          </TabsContent>
        ))} */}
      </Tabs>
      {/* --- KHUNG POPUP CHỈNH SỬA MÓN ĂN --- */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa món ăn</DialogTitle>
            <DialogDescription>
              Cập nhật lại thông tin món ăn trong thực đơn
            </DialogDescription>
          </DialogHeader>

          {editingItem && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Tên món</Label>
                <Input
                  id="edit-name"
                  value={editingItem.name}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-price">Giá bán (VND)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={editingItem.price}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      price: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Danh mục</Label>
                <Select
                  value={
                    editingItem.category_id || editingItem.category?.id || ""
                  }
                  onValueChange={(value) =>
                    setEditingItem({ ...editingItem, category_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-prepTime">Thời gian chuẩn bị (phút)</Label>
                <Input
                  id="edit-prepTime"
                  type="number"
                  value={editingItem.preparation_time}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      preparation_time: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Mô tả</Label>
                <Textarea
                  id="edit-description"
                  value={editingItem.description || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-available">Còn phục vụ</Label>
                <Switch
                  id="edit-available"
                  checked={editingItem.is_available}
                  onCheckedChange={(checked) =>
                    setEditingItem({ ...editingItem, is_available: checked })
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSubmittingEdit}
            >
              Hủy
            </Button>
            <Button onClick={handleUpdateItem} disabled={isSubmittingEdit}>
              {isSubmittingEdit ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MenuGrid({
  items,
  onDelete,
  onEdit,
}: {
  items: (MenuItem & { category?: MenuCategory })[];
  onDelete: (id: string, name: string) => void;
  onEdit: (item: any) => void;
}) {
  if (items.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-12">
        <UtensilsCrossed className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Không tìm thấy món ăn nào</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => (
        <Card key={item.id} className="overflow-hidden group">
          <div className="aspect-video bg-muted relative">
            {item.image_url ? (
              <img
                src={item.image_url}
                alt={item.name}
                className="object-cover w-full h-full"
              />
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
              {/* Nút sửa chế độ lưới */}
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8"
                onClick={() => onEdit(item)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              {/* Nút hủy món chế độ lưới */}
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 text-destructive"
                onClick={() => onDelete(item.id, item.name)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{item.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {item.description || "Không có mô tả"}
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
  );
}

function MenuTable({
  items,
  onDelete,
  onEdit,
}: {
  items: (MenuItem & { category?: MenuCategory })[];
  onDelete: (id: string, name: string) => void;
  onEdit: (item: any) => void;
}) {
  if (items.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-12">
        <UtensilsCrossed className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Không tìm thấy món ăn nào</p>
      </Card>
    );
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
              <TableCell className="font-medium">
                {formatCurrency(item.price)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatCurrency(item.cost_price)}
              </TableCell>
              <TableCell>{item.preparation_time} phút</TableCell>
              <TableCell>
                <Badge variant={item.is_available ? "default" : "destructive"}>
                  {item.is_available ? "Còn phục vụ" : "Hết món"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  {/* Nút sửa chế độ bảng */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => onEdit(item)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {/* Nút hủy món chế độ bảng */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    onClick={() => onDelete(item.id, item.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
