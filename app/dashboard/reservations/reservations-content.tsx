"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Reservation, Table } from "@/lib/types/database";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  Users,
  Phone,
  User,
  Plus,
  CheckCircle2,
  XCircle,
  CalendarCheck,
  HelpCircle,
} from "lucide-react";

interface ReservationsContentProps {
  reservations: Reservation[];
  tables: Table[];
}

const statusConfig = {
  pending: {
    label: "Chờ duyệt",
    className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  },
  confirmed: {
    label: "Đã gán bàn",
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  seated: {
    label: "Đã nhận bàn",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  },
  cancelled: {
    label: "Đã hủy",
    className: "bg-rose-500/10 text-rose-600 border-rose-500/20",
  },
};

export function ReservationsContent({
  reservations,
  tables,
}: ReservationsContentProps) {
  const router = useRouter();

  // Quản lý đóng mở Modal thêm mới đặt bàn
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  // Khai báo State quản lý dữ liệu Form Đặt bàn mới
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    guest_count: "2",
    reservation_time: "",
    table_id: "none",
    note: "",
  });

  // 1. NGHIỆP VỤ: Hàm tiếp nhận thông tin và gửi tạo mới lịch đặt bàn
  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Lỗi thêm lịch đặt bàn");

      setIsNewDialogOpen(false);
      // Reset form về trạng thái trống
      setFormData({
        customer_name: "",
        customer_phone: "",
        guest_count: "2",
        reservation_time: "",
        table_id: "none",
        note: "",
      });

      router.refresh(); // Đồng bộ dữ liệu sạch từ máy chủ ngầm
      alert("Đã tiếp nhận thông tin đặt bàn thành công!");
    } catch (error: any) {
      alert(error.message || "Không thể lưu lịch đặt bàn. Vui lòng thử lại!");
    }
  };

  // 2. NGHIỆP VỤ: Nhân viên kiểm duyệt và gán bàn ăn thực tế cho khách
  const handleConfirmReservation = async (
    reservationId: string,
    assignedTableId: string,
  ) => {
    if (!assignedTableId || assignedTableId === "none") return;

    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "confirmed",
          table_id: assignedTableId,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Lỗi gán bàn");

      router.refresh(); // Ép sơ đồ phòng bàn chuyển sang màu vàng (reserved) ngầm
      alert("Đã duyệt và xếp bàn thành công cho khách!");
    } catch (error: any) {
      alert(error.message || "Không thể xếp bàn. Vui lòng thử lại!");
    }
  };

  // 3. NGHIỆP VỤ: Khách đến nhà hàng -> Nhận bàn và tự động chuyển sơ đồ bàn sang 'occupied'
  const handleSeatCustomer = async (reservationId: string, tableId: string) => {
    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "seated", table_id: tableId }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Lỗi nhận bàn");

      router.refresh(); // Ép sơ đồ phòng bàn chuyển sang đỏ (occupied) sẵn sàng gọi món
      alert("Khách đã nhận bàn thành công! Hệ thống đã mở bàn trên sơ đồ.");
    } catch (error: any) {
      alert(error.message || "Không thể thực hiện mở bàn!");
    }
  };

  // 4. NGHIỆP VỤ: Hủy lịch hẹn khi khách báo bận hoặc quá giờ hẹn không đến
  const handleCancelReservation = async (reservationId: string) => {
    const confirmCancel = window.confirm(
      "Bạn có chắc chắn muốn hủy lịch đặt bàn này không?",
    );
    if (!confirmCancel) return;

    try {
      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Lỗi hủy lịch đặt");

      router.refresh(); // Trả trạng thái bàn về xanh trống (available) nếu đơn này từng được gán bàn trước đó
      alert("Đã hủy lịch hẹn đặt bàn thành công.");
    } catch (error: any) {
      alert(error.message || "Thao tác thất bại!");
    }
  };

  // Phân loại danh sách đặt bàn theo từng bộ lọc trạng thái
  const pendingList = reservations.filter((r) => r.status === "pending");
  const confirmedList = reservations.filter((r) => r.status === "confirmed");
  const seatedList = reservations.filter((r) => r.status === "seated");
  const cancelledList = reservations.filter((r) => r.status === "cancelled");

  return (
    <div className="space-y-6">
      {/* Khối Tiêu Đề và Nút Bật Form Đặt Trước */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Sổ Điều Hành Đặt Bàn
          </h2>
          <p className="text-sm text-muted-foreground">
            Tiếp nhận thông tin khách đặt trước, điều phối sơ đồ phòng bàn hợp
            lý.
          </p>
        </div>

        {/* FORM DIALOG TẠO LỊCH ĐẶT TRƯỚC MỚI */}
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-sm">
              <Plus className="h-4 w-4 mr-2" /> Nhận đặt bàn
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-2xl">
            <form onSubmit={handleCreateReservation}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl font-black">
                  <CalendarCheck className="h-5 w-5 text-orange-500" /> Nhận
                  Thông Tin Đặt Bàn
                </DialogTitle>
                <DialogDescription>
                  Ghi nhận chính xác số điện thoại và mốc thời gian khách đến để
                  giữ bàn.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <Label htmlFor="customer_name" className="font-bold">
                    Tên khách hàng *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="customer_name"
                      required
                      placeholder="Nguyễn Văn A"
                      className="pl-9 rounded-xl"
                      value={formData.customer_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customer_name: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="customer_phone" className="font-bold">
                    Số điện thoại liên hệ *
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="customer_phone"
                      required
                      type="tel"
                      placeholder="0912345678"
                      className="pl-9 rounded-xl"
                      value={formData.customer_phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customer_phone: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="guest_count" className="font-bold">
                      Số lượng khách *
                    </Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="guest_count"
                        type="number"
                        min={1}
                        required
                        className="pl-9 rounded-xl"
                        value={formData.guest_count}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            guest_count: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reservation_time" className="font-bold">
                      Giờ hẹn đến *
                    </Label>
                    <Input
                      id="reservation_time"
                      type="datetime-local"
                      required
                      className="rounded-xl"
                      value={formData.reservation_time}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          reservation_time: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-bold">
                    Gán bàn trước (Không bắt buộc)
                  </Label>
                  <Select
                    value={formData.table_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, table_id: value })
                    }
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Chọn bàn trống gán luôn" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        Chưa gán bàn (Xếp sau)
                      </SelectItem>
                      {tables
                        .filter((t) => t.status === "available")
                        .map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name} (Sức chứa {t.capacity} người)
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="note" className="font-bold">
                    Yêu cầu đặc biệt
                  </Label>
                  <Textarea
                    id="note"
                    placeholder="Ngồi phòng VIP, không ăn được hành, tổ chức sinh nhật..."
                    className="rounded-xl h-16 resize-none"
                    value={formData.note}
                    onChange={(e) =>
                      setFormData({ ...formData, note: e.target.value })
                    }
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl font-bold"
                  onClick={() => setIsNewDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white font-black rounded-xl px-5"
                >
                  Xác nhận lưu
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* THANH THỐNG KÊ NHANH SỐ LƯỢNG ĐẶT BÀN */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-none bg-yellow-500/5 shadow-xs p-4 rounded-xl">
          <div className="text-xs font-black text-muted-foreground uppercase">
            Chờ phê duyệt
          </div>
          <div className="text-2xl font-black text-yellow-600 mt-1">
            {pendingList.length} lịch hẹn
          </div>
        </Card>
        <Card className="border-none bg-blue-500/5 shadow-xs p-4 rounded-xl">
          <div className="text-xs font-black text-muted-foreground uppercase">
            Đã gán bàn
          </div>
          <div className="text-2xl font-black text-blue-600 mt-1">
            {confirmedList.length} bàn giữ
          </div>
        </Card>
        <Card className="border-none bg-emerald-500/5 shadow-xs p-4 rounded-xl">
          <div className="text-xs font-black text-muted-foreground uppercase">
            Đang ngồi ăn
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {seatedList.length} bàn khách
          </div>
        </Card>
        <Card className="border-none bg-slate-500/5 shadow-xs p-4 rounded-xl">
          <div className="text-xs font-black text-muted-foreground uppercase">
            Tổng hôm nay
          </div>
          <div className="text-2xl font-black text-slate-700 mt-1">
            {reservations.length} lượt đặt
          </div>
        </Card>
      </div>

      {/* KHU VỰC CHIA TABS THEO QUY TRÌNH VẬN HÀNH */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="bg-muted/60 p-1 rounded-xl h-11 border">
          <TabsTrigger
            value="pending"
            className="rounded-lg font-bold text-xs sm:text-sm px-4"
          >
            Chờ duyệt ({pendingList.length})
          </TabsTrigger>
          <TabsTrigger
            value="confirmed"
            className="rounded-lg font-bold text-xs sm:text-sm px-4"
          >
            Đã gán bàn ({confirmedList.length})
          </TabsTrigger>
          <TabsTrigger
            value="seated"
            className="rounded-lg font-bold text-xs sm:text-sm px-4"
          >
            Đang ăn ({seatedList.length})
          </TabsTrigger>
          <TabsTrigger
            value="all"
            className="rounded-lg font-bold text-xs sm:text-sm px-4"
          >
            Tất cả lịch đặt
          </TabsTrigger>
        </TabsList>

        {/* NỘI DUNG TỪNG TABS HIỂN THỊ DANH SÁCH ĐẶT BÀN */}
        {["pending", "confirmed", "seated", "all"].map((tabKey) => {
          const targetList =
            tabKey === "pending"
              ? pendingList
              : tabKey === "confirmed"
                ? confirmedList
                : tabKey === "seated"
                  ? seatedList
                  : reservations;

          return (
            <TabsContent key={tabKey} value={tabKey} className="mt-4 space-y-3">
              {targetList.length === 0 ? (
                <Card className="p-12 text-center text-muted-foreground rounded-2xl border border-dashed">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm font-semibold">
                    Không tìm thấy thông tin lịch đặt bàn nào trong mục này.
                  </p>
                </Card>
              ) : (
                targetList.map((res) => (
                  <Card
                    key={res.id}
                    className="overflow-hidden border-2 hover:border-orange-500/20 transition-colors rounded-xl shadow-2xs"
                  >
                    <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-background">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h4 className="text-base font-black text-slate-800">
                            {res.customer_name}
                          </h4>
                          <Badge
                            variant="outline"
                            className={
                              statusConfig[
                                res.status as keyof typeof statusConfig
                              ]?.className
                            }
                          >
                            {
                              statusConfig[
                                res.status as keyof typeof statusConfig
                              ]?.label
                            }
                          </Badge>
                          {res.table && (
                            <Badge className="bg-orange-500 text-white font-extrabold">
                              {res.table.name}
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs text-muted-foreground font-semibold">
                          <span className="flex items-center gap-1 text-primary font-bold">
                            <Phone className="h-3.5 w-3.5" />{" "}
                            {res.customer_phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" /> Khách đi:{" "}
                            {res.guest_count} người
                          </span>
                          <span className="flex items-center gap-1 text-slate-700">
                            <Clock className="h-3.5 w-3.5" /> Hẹn đến:{" "}
                            {new Date(res.reservation_time).toLocaleString(
                              "vi-VN",
                            )}
                          </span>
                        </div>

                        {res.note && (
                          <div className="text-xs font-bold text-amber-700 bg-amber-500/5 border border-dashed border-amber-500/20 p-2 rounded-lg mt-1">
                            📝 Ghi chú: {res.note}
                          </div>
                        )}
                      </div>

                      {/* KHỐI NÚT HÀNH ĐỘNG ĐIỀU HÀNH NGHIỆP VỤ QUÁN */}
                      <div className="flex gap-2 w-full md:w-auto shrink-0 flex-wrap justify-end">
                        {res.status === "pending" && (
                          <div className="flex gap-2 items-center w-full sm:w-auto">
                            {/* Thanh chọn bàn nhanh tại chỗ để Duyệt gộp bàn luôn */}
                            <Select
                              onValueChange={(value) =>
                                handleConfirmReservation(res.id, value)
                              }
                            >
                              <SelectTrigger className="w-full sm:w-40 h-9 rounded-xl font-bold text-xs">
                                <SelectValue placeholder="Chọn bàn gán..." />
                              </SelectTrigger>
                              <SelectContent>
                                {tables
                                  .filter((t) => t.status === "available")
                                  .map((t) => (
                                    <SelectItem key={t.id} value={t.id}>
                                      {t.name} ({t.capacity} chỗ)
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-rose-600 font-bold hover:bg-rose-50 rounded-xl"
                              onClick={() => handleCancelReservation(res.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" /> Từ chối
                            </Button>
                          </div>
                        )}

                        {res.status === "confirmed" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl h-9"
                              onClick={() =>
                                handleSeatCustomer(res.id, res.table_id!)
                              }
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1.5" /> Khách
                              nhận bàn
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-muted-foreground border-slate-200 font-bold rounded-xl h-9"
                              onClick={() => handleCancelReservation(res.id)}
                            >
                              Hủy đặt
                            </Button>
                          </>
                        )}

                        {res.status === "seated" && (
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-600 border-none font-extrabold px-3 py-1.5 rounded-lg text-xs"
                          >
                            Khách đang sử dụng bàn
                          </Badge>
                        )}

                        {res.status === "cancelled" && (
                          <Badge
                            variant="outline"
                            className="bg-rose-500/10 text-rose-600 border-none font-extrabold px-3 py-1.5 rounded-lg text-xs"
                          >
                            Lịch hẹn đã hủy
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
