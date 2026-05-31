"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  UserCheck,
  Phone,
  MapPin,
  DollarSign,
  Copy,
  Check,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  current_debt: number;
  is_active: boolean;
}

export function SuppliersContent({
  initialSuppliers,
}: {
  initialSuppliers: Supplier[];
}) {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  // Bộ lọc Tìm kiếm văn bản và Lọc trạng thái nâng cao
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'active', 'inactive', 'has_debt'

  // Trạng thái quản lý sao chép nhanh (để đổi icon tạm thời khi bấm copy)
  const [copiedId, setCopiedId] = useState<string>("");
  const [copiedType, setCopiedType] = useState<"phone" | "address" | "">("");

  // Kiểm soát Dialog sửa đổi thông tin
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Hàm xử lý sao chép nhanh văn bản vào bộ nhớ đệm (Clipboard)
  const handleCopy = (text: string, id: string, type: "phone" | "address") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setCopiedType(type);
    setTimeout(() => {
      setCopiedId("");
      setCopiedType("");
    }, 2000); // Trả lại icon cũ sau 2 giây
  };

  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(num);
  };

  // 1. Hành động: Thêm mới đối tác qua API
  const handleAddSupplier = async () => {
    if (!form.name.trim()) return;
    const response = await fetch("/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await response.json();
    if (response.ok && result.success) {
      setSuppliers([result.data, ...suppliers]);
      setForm({ name: "", phone: "", email: "", address: "" });
      setIsOpen(false);
      router.refresh();
    } else {
      alert(`Lỗi: ${result.error || "Có lỗi xảy ra khi lưu đối tác."}`);
    }
  };

  // 2. Hành động: Xóa nhà cung cấp khỏi hệ thống
  const handleDeleteSupplier = async (id: string, name: string) => {
    const confirmDelete = confirm(
      `Bạn có chắc chắn muốn xóa đối tác: "${name}" không?`,
    );
    if (!confirmDelete) return;
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (!error) {
      setSuppliers((prev) => prev.filter((sup) => sup.id !== id));
      router.refresh();
    } else {
      alert(
        "Không thể xóa nhà cung cấp này do đã phát sinh chứng từ liên quan.",
      );
    }
  };

  // 3. Hành động: Cập nhật thông tin sửa đổi dữ liệu nền
  const handleUpdateSupplier = async () => {
    if (!editingSupplier || !editingSupplier.name.trim()) return;
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { error } = await supabase
      .from("suppliers")
      .update({
        name: editingSupplier.name.trim(),
        phone: editingSupplier.phone?.trim() || null,
        email: editingSupplier.email?.trim() || null,
        address: editingSupplier.address?.trim() || null,
      })
      .eq("id", editingSupplier.id);

    if (!error) {
      setSuppliers((prev) =>
        prev.map((sup) =>
          sup.id === editingSupplier.id ? editingSupplier : sup,
        ),
      );
      setIsEditOpen(false);
      setEditingSupplier(null);
      router.refresh();
    } else {
      alert("Có lỗi xảy ra khi cập nhật thông tin đối tác.");
    }
  };

  // 🚀 BỘ LỌC ĐA NĂNG PHỐI HỢP: Tìm kiếm chữ + Trạng thái hợp tác + Tồn đọng công nợ
  const filteredSuppliers = suppliers.filter((sup) => {
    const matchesSearch =
      sup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sup.phone && sup.phone.includes(searchTerm));

    if (!matchesSearch) return false;

    if (statusFilter === "active") return sup.is_active === true;
    if (statusFilter === "inactive") return sup.is_active === false;
    if (statusFilter === "has_debt") return sup.current_debt > 0;

    return true; // Trường hợp chọn 'all'
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold tracking-tight">
          Danh sách đối tác giao hàng
        </h3>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Thêm nhà cung cấp
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Đăng ký nhà cung cấp mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold">
                  Tên nhà cung cấp / Nhà xe *
                </label>
                <Input
                  placeholder="Ví dụ: Công ty Thực phẩm CP..."
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Số điện thoại</label>
                  <Input
                    placeholder="09xxxxxxxx"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Email liên hệ</label>
                  <Input
                    type="email"
                    placeholder="ncc@gmail.com"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">
                  Địa chỉ kho hàng NCC
                </label>
                <Input
                  placeholder="Số nhà, tên đường..."
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                />
              </div>
              <Button className="w-full mt-2" onClick={handleAddSupplier}>
                Khởi tạo đối tác
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 🔍 THANH TÌM KIẾM KẾT HỢP BỘ LỌC TRẠNG THÁI MỚI */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2">
        <Input
          placeholder="Tìm nhanh theo tên hoặc số điện thoại đối tác..."
          className="max-w-md h-10 shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
            <Filter className="h-3 w-3" /> Lọc theo:
          </span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] h-10 shadow-sm">
              <SelectValue placeholder="Tất cả đối tác" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">📊 Tất cả đối tác</SelectItem>
              <SelectItem value="active">🟢 Đang hợp tác</SelectItem>
              <SelectItem value="inactive">🔴 Ngừng hợp tác</SelectItem>
              <SelectItem value="has_debt">⚠️ Còn nợ tiền</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <TooltipProvider>
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/60 text-muted-foreground font-semibold border-b">
                <tr>
                  <th className="px-4 py-3.5">Tên đối tác</th>
                  <th className="px-4 py-3.5">Điện thoại</th>
                  <th className="px-4 py-3.5">Địa chỉ</th>
                  <th className="px-4 py-3.5 text-right">Công nợ hiện tại</th>
                  <th className="px-4 py-3.5 text-center">Trạng thái</th>
                  <th className="px-4 py-3.5 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-10 text-muted-foreground"
                    >
                      Không tìm thấy nhà cung cấp nào phù hợp với điều kiện lọc.
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((sup) => (
                    <tr
                      key={sup.id}
                      className="hover:bg-muted/40 transition-colors"
                    >
                      {/* 1. TÊN ĐỐI TÁC: Đã đổi thành link màu xanh dương bấm được */}
                      <td className="px-4 py-3.5 font-bold flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-primary shrink-0" />
                        <a
                          href={`/dashboard/inventory/suppliers/${sup.id}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline transition-all"
                          title="Click để xem chi tiết lịch sử chứng từ và dòng tiền"
                        >
                          {sup.name}
                        </a>
                      </td>

                      {/* 2. ĐIỆN THOẠI: Tích hợp nút Copy nhanh */}
                      <td className="px-4 py-3.5 font-medium text-muted-foreground">
                        {sup.phone ? (
                          <div className="flex items-center gap-1.5 group">
                            <span>{sup.phone}</span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity border"
                              onClick={() =>
                                handleCopy(sup.phone!, sup.id, "phone")
                              }
                            >
                              {copiedId === sup.id && copiedType === "phone" ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        ) : (
                          "---"
                        )}
                      </td>

                      {/* 3. ĐỊA CHỈ: Tích hợp Tooltip di chuột xem toàn bộ + nút Copy nhanh */}
                      <td className="px-4 py-3.5 max-w-[220px] text-muted-foreground font-medium">
                        {sup.address ? (
                          <div className="flex items-center justify-between gap-1 group">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="truncate block cursor-help">
                                  {sup.address}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs bg-popover text-popover-foreground border shadow-md p-2.5 font-semibold text-xs leading-relaxed">
                                <p>{sup.address}</p>
                              </TooltipContent>
                            </Tooltip>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity border shrink-0"
                              onClick={() =>
                                handleCopy(sup.address!, sup.id, "address")
                              }
                            >
                              {copiedId === sup.id &&
                              copiedType === "address" ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        ) : (
                          "---"
                        )}
                      </td>

                      {/* 4. CÔNG NỢ: Tự động đổi màu chữ sang màu Đỏ đậm nếu > 0đ để cảnh báo */}
                      <td className="px-4 py-3.5 text-right font-black text-sm">
                        <div className="flex items-center justify-end gap-2">
                          <span
                            className={
                              sup.current_debt > 0
                                ? "text-rose-600 font-extrabold"
                                : "text-emerald-600 font-semibold"
                            }
                          >
                            {formatVND(sup.current_debt)}
                          </span>
                          <a
                            href={`/dashboard/inventory/suppliers/${sup.id}`}
                            className="text-[10px] font-bold text-muted-foreground px-1.5 py-0.5 border rounded bg-background hover:bg-secondary transition-colors"
                          >
                            Sổ nợ
                          </a>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${sup.is_active ? "bg-green-100 text-green-700" : "bg-rose-100 text-rose-700"}`}
                        >
                          {sup.is_active ? "Đang hợp tác" : "Ngừng"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            onClick={() => {
                              setEditingSupplier(sup);
                              setIsEditOpen(true);
                            }}
                          >
                            Sửa
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-rose-500 hover:bg-rose-50"
                            onClick={() =>
                              handleDeleteSupplier(sup.id, sup.name)
                            }
                          >
                            Xóa
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </TooltipProvider>

      {/* DIALOG CHỈNH SỬA THÔNG TIN */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Cập nhật thông tin nhà cung cấp</DialogTitle>
          </DialogHeader>
          {editingSupplier && (
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold">
                  Tên nhà cung cấp *
                </label>
                <Input
                  value={editingSupplier.name}
                  onChange={(e) =>
                    setEditingSupplier({
                      ...editingSupplier,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Số điện thoại</label>
                  <Input
                    value={editingSupplier.phone || ""}
                    onChange={(e) =>
                      setEditingSupplier({
                        ...editingSupplier,
                        phone: e.target.value || null,
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Email liên hệ</label>
                  <Input
                    type="email"
                    value={editingSupplier.email || ""}
                    onChange={(e) =>
                      setEditingSupplier({
                        ...editingSupplier,
                        email: e.target.value || null,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">
                  Địa chỉ kho hàng
                </label>
                <Input
                  value={editingSupplier.address || ""}
                  onChange={(e) =>
                    setEditingSupplier({
                      ...editingSupplier,
                      address: e.target.value || null,
                    })
                  }
                />
              </div>
              <Button className="w-full mt-2" onClick={handleUpdateSupplier}>
                Lưu các thay đổi
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
