"use client";

import { useState } from "react";
import { Table, Area, Order, OrderItem, MenuItem } from "@/lib/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Users, Clock, ShoppingCart, Plus, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

interface TablesContentProps {
  tables: (Table & { area?: Area })[];
  areas: Area[];
  activeOrders: (Order & {
    table?: Table;
    items?: (OrderItem & { menu_item?: MenuItem })[];
  })[];
}

const statusConfig = {
  available: {
    label: "Trống",
    className: "bg-status-available text-white",
    borderClass: "border-status-available",
  },
  occupied: {
    label: "Có khách",
    className: "bg-status-occupied text-white",
    borderClass: "border-status-occupied",
  },
  reserved: {
    label: "Đã đặt",
    className: "bg-status-reserved text-white",
    borderClass: "border-status-reserved",
  },
  cleaning: {
    label: "Dọn dẹp",
    className: "bg-status-cleaning text-foreground",
    borderClass: "border-status-cleaning",
  },
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TablesContent({
  tables,
  areas,
  activeOrders,
}: TablesContentProps) {
  const [selectedTable, setSelectedTable] = useState<
    (Table & { area?: Area }) | null
  >(null);
  const [activeAreaId, setActiveAreaId] = useState(areas[0]?.id || "");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAreaDialogOpen, setIsAreaDialogOpen] = useState(false);
  const [isDeleteAreaOpen, setIsDeleteAreaOpen] = useState(false);
  const [isDeleteTableOpen, setIsDeleteTableOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<
    (Table & { area?: Area }) | null
  >(null);
  const [newAreaName, setNewAreaName] = useState("");
  const [newAreaSortOrder, setNewAreaSortOrder] = useState(areas.length + 1);

  const getTablesByArea = (areaId: string) => {
    return tables.filter((table) => table.area_id === areaId);
  };

  const getOrderForTable = (tableId: string) => {
    return activeOrders.find((order) => order.table_id === tableId);
  };

  const getTableStats = () => {
    const total = tables.length;
    const available = tables.filter((t) => t.status === "available").length;
    const occupied = tables.filter((t) => t.status === "occupied").length;
    const reserved = tables.filter((t) => t.status === "reserved").length;
    const cleaning = tables.filter((t) => t.status === "cleaning").length;
    return { total, available, occupied, reserved, cleaning };
  };

  const stats = getTableStats();

  const handleTableClick = (table: Table & { area?: Area }) => {
    setSelectedTable(table);
    setIsDialogOpen(true);
  };

  const handleAddArea = () => {
    // TODO: connect this action với API để thêm phòng mới vào database
    setIsAreaDialogOpen(true);
  };

  const handleDeleteArea = () => {
    setIsDeleteAreaOpen(true);
  };

  const activeArea = areas.find((area) => area.id === activeAreaId);

  const handleDeleteTable = (table: Table & { area?: Area }) => {
    setTableToDelete(table);
    setIsDeleteTableOpen(true);
  };

  const handleConfirmDeleteTable = () => {
    // TODO: thực hiện xóa bàn ở đây khi có backend
    setIsDeleteTableOpen(false);
    setTableToDelete(null);
    alert("Tính năng xóa bàn chưa được kết nối backend.");
  };

  const handleCreateArea = () => {
    // TODO: thực hiện thêm phòng vào database khi có backend
    setIsAreaDialogOpen(false);
    setNewAreaName("");
    setNewAreaSortOrder(areas.length + 1);
    alert(`Thêm phòng "${newAreaName}" thành công (tạm).`);
  };

  const handleConfirmDeleteArea = () => {
    // TODO: thực hiện xóa phòng khi có backend
    setIsDeleteAreaOpen(false);
    alert("Tính năng xóa phòng chưa được kết nối backend.");
  };

  const tableOrder = selectedTable ? getOrderForTable(selectedTable.id) : null;

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Tổng số bàn</div>
          </CardContent>
        </Card>
        <Card className="border-status-available">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-status-available">
              {stats.available}
            </div>
            <div className="text-sm text-muted-foreground">Bàn trống</div>
          </CardContent>
        </Card>
        <Card className="border-status-occupied">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-status-occupied">
              {stats.occupied}
            </div>
            <div className="text-sm text-muted-foreground">Có khách</div>
          </CardContent>
        </Card>
        <Card className="border-status-reserved">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-status-reserved">
              {stats.reserved}
            </div>
            <div className="text-sm text-muted-foreground">Đã đặt</div>
          </CardContent>
        </Card>
        <Card className="border-status-cleaning">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-status-cleaning">
              {stats.cleaning}
            </div>
            <div className="text-sm text-muted-foreground">Dọn dẹp</div>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <span className="text-muted-foreground">Chú thích:</span>
        {Object.entries(statusConfig).map(([key, config]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={cn("h-4 w-4 rounded", config.className)} />
            <span>{config.label}</span>
          </div>
        ))}
      </div>

      {/* Tables Grid */}
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div>
            <CardTitle>Sơ đồ bàn</CardTitle>
            <p className="text-sm text-muted-foreground">
              Quản lý phòng và bàn trực quan, kèm thao tác thêm/xóa.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleAddArea}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm phòng
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Thêm bàn
            </Button>
            <Button size="sm" variant="destructive" onClick={handleDeleteArea}>
              Xóa phòng
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeAreaId}
            onValueChange={(value) => setActiveAreaId(value)}
            className="w-full"
          >
            <TabsList className="mb-4 w-full justify-start flex-wrap h-auto gap-2">
              {areas.map((area) => (
                <TabsTrigger key={area.id} value={area.id} className="text-sm">
                  {area.name}
                  <Badge variant="secondary" className="ml-2">
                    {getTablesByArea(area.id).length}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
            {areas.map((area) => (
              <TabsContent key={area.id} value={area.id}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {getTablesByArea(area.id).map((table) => {
                    const order = getOrderForTable(table.id);
                    return (
                      <div
                        key={table.id}
                        onClick={() => handleTableClick(table)}
                        className={cn(
                          "relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-105 hover:shadow-lg min-h-[140px]",
                          table.status === "available" &&
                            "border-status-available bg-status-available/5 hover:bg-status-available/15",
                          table.status === "occupied" &&
                            "border-status-occupied bg-status-occupied/5 hover:bg-status-occupied/15",
                          table.status === "reserved" &&
                            "border-status-reserved bg-status-reserved/5 hover:bg-status-reserved/15",
                          table.status === "cleaning" &&
                            "border-status-cleaning bg-status-cleaning/5 hover:bg-status-cleaning/15",
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-bold text-lg">
                            {table.name}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              asChild
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 -mr-2 -mt-1"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                Đổi trạng thái
                              </DropdownMenuItem>
                              <DropdownMenuItem>Chỉnh sửa</DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleDeleteTable(table);
                                }}
                              >
                                Xóa bàn
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                          <Users className="h-3.5 w-3.5" />
                          <span>{table.capacity} chỗ</span>
                        </div>

                        <div className="flex-1" />

                        {order && (
                          <div className="mt-3 pt-3 border-t border-border/50 space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{formatTime(order.created_at)}</span>
                            </div>
                            <div className="font-semibold text-sm">
                              {formatCurrency(order.total)}
                            </div>
                          </div>
                        )}

                        <Badge
                          className={cn(
                            "mt-2 text-xs justify-center",
                            statusConfig[table.status].className,
                          )}
                        >
                          {statusConfig[table.status].label}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Table Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span>{selectedTable?.name}</span>
              {selectedTable && (
                <Badge className={statusConfig[selectedTable.status].className}>
                  {statusConfig[selectedTable.status].label}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedTable?.area?.name} - {selectedTable?.capacity} chỗ ngồi
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Status Change */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Đổi trạng thái</label>
              <Select defaultValue={selectedTable?.status}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Trống</SelectItem>
                  <SelectItem value="occupied">Có khách</SelectItem>
                  <SelectItem value="reserved">Đã đặt</SelectItem>
                  <SelectItem value="cleaning">Dọn dẹp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Order Info if occupied */}
            {tableOrder && (
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">
                    Đơn hàng #{tableOrder.order_number}
                  </h4>
                  <span className="text-sm text-muted-foreground">
                    {formatTime(tableOrder.created_at)}
                  </span>
                </div>

                <ScrollArea className="h-[150px]">
                  <div className="space-y-2">
                    {tableOrder.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>
                          {item.quantity}x {item.menu_item?.name}
                        </span>
                        <span className="font-medium">
                          {formatCurrency(item.total_price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="flex items-center justify-between pt-3 border-t font-semibold">
                  <span>Tổng cộng</span>
                  <span>{formatCurrency(tableOrder.total)}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              {selectedTable?.status === "available" && (
                <Button className="flex-1" asChild>
                  <Link href={`/dashboard/pos?table=${selectedTable.id}`}>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Tạo đơn hàng
                  </Link>
                </Button>
              )}
              {selectedTable?.status === "occupied" && tableOrder && (
                <>
                  <Button variant="outline" className="flex-1" asChild>
                    <Link
                      href={`/dashboard/pos?table=${selectedTable.id}&order=${tableOrder.id}`}
                    >
                      Thêm món
                    </Link>
                  </Button>
                  <Button className="flex-1" asChild>
                    <Link href={`/dashboard/billing?order=${tableOrder.id}`}>
                      Thanh toán
                    </Link>
                  </Button>
                </>
              )}
              {selectedTable?.status === "reserved" && (
                <Button className="flex-1" asChild>
                  <Link href={`/dashboard/pos?table=${selectedTable.id}`}>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Nhận bàn & Tạo đơn
                  </Link>
                </Button>
              )}
              {selectedTable?.status === "cleaning" && (
                <Button className="flex-1">Hoàn thành dọn dẹp</Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Room Dialog */}
      <Dialog open={isAreaDialogOpen} onOpenChange={setIsAreaDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm phòng mới</DialogTitle>
            <DialogDescription>
              Nhập tên phòng và thứ tự hiển thị.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Tên phòng</label>
              <Input
                value={newAreaName}
                onChange={(event) => setNewAreaName(event.target.value)}
                placeholder="Ví dụ: Tầng 3, VIP"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Thứ tự hiển thị
              </label>
              <Input
                type="number"
                value={newAreaSortOrder}
                onChange={(event) =>
                  setNewAreaSortOrder(Number(event.target.value))
                }
                min={1}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsAreaDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button onClick={handleCreateArea} disabled={!newAreaName.trim()}>
                Lưu phòng
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Room Dialog */}
      <Dialog open={isDeleteAreaOpen} onOpenChange={setIsDeleteAreaOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xóa phòng</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa phòng <strong>{activeArea?.name}</strong>?
              Thao tác này sẽ chỉ thực hiện khi có backend.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteAreaOpen(false)}
            >
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeleteArea}>
              Xóa phòng
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Table Dialog */}
      <Dialog open={isDeleteTableOpen} onOpenChange={setIsDeleteTableOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xóa bàn</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa bàn <strong>{tableToDelete?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteTableOpen(false)}
            >
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeleteTable}>
              Xóa bàn
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
