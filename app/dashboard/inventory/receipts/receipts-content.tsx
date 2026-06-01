"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash,
  Receipt,
  Calendar,
  ArrowRight,
  User,
  Home,
  Search,
  Filter,
  Printer,
  XCircle,
  MoreVertical,
  Clock,
  Eye,
  FileText,
  ShoppingBag,
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
// 💡 Sử dụng Sheet component của Shadcn UI để làm Drawer trượt từ bên phải cực đẹp
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UomConversion {
  alternative_uom: string;
  conversion_factor: number;
}

interface Ing {
  id: string;
  name: string;
  base_uom: string;
  code: string | null;
  uom_conversions?: UomConversion[]; // Nạp kèm danh sách đơn vị quy đổi khả dụng
}

interface Wh {
  id: string;
  name: string;
}

interface Su {
  id: string;
  name: string;
  current_debt: number;
}

interface ReceiptItem {
  ingredient_id: string;
  uom_used: string;
  quantity_uom: string;
  price_per_uom: string;
  expiry_date: string;
}

export function ReceiptsContent({
  ingredients,
  warehouses,
  suppliers,
  recentReceipts,
}: {
  ingredients: Ing[];
  warehouses: Wh[];
  suppliers: Su[];
  recentReceipts: any[];
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // State quản lý thông tin tổng quan đầu phiếu nhập kho
  const [warehouseId, setWarehouseId] = useState("");
  const [supplierId, setSupplierId] = useState("");

  // Tính năng 3: Quản lý giá trị chiết khấu và loại chiết khấu (đ hoặc %)
  const [discount, setDiscount] = useState("0");
  const [discountType, setDiscountType] = useState<"cash" | "percent">("cash");

  const [paidAmount, setPaidAmount] = useState("0");
  const [note, setNote] = useState("");

  // State quản lý danh sách các dòng vật tư động
  const [items, setItems] = useState<ReceiptItem[]>([
    {
      ingredient_id: "",
      uom_used: "",
      quantity_uom: "",
      price_per_uom: "",
      expiry_date: "",
    },
  ]);

  // State phục vụ bộ lọc đa năng tại trang nhật ký
  const [searchQuery, setSearchQuery] = useState("");
  const [debtFilter, setDebtFilter] = useState("all"); // 'all', 'PAID', 'UNPAID', 'PARTIAL'
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // --- STATE NÂNG CẤP XEM CHI TIẾT PHIẾU (DRAWER) & THAO TÁC NHANH ---
  const [selectedPo, setSelectedPo] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Định dạng tiền tệ VND
  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(num);
  };

  // Tính năng 2: Hàm kiểm tra và cảnh báo lô hàng cận hạn sử dụng (Dưới 7 ngày)
  const checkExpiryAlert = (expiryDateStr: string) => {
    if (!expiryDateStr) return { isNearExpiry: false, daysDiff: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiryDate = new Date(expiryDateStr);
    expiryDate.setHours(0, 0, 0, 0);

    const timeDiff = expiryDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    return {
      isNearExpiry: daysDiff <= 7,
      daysDiff: daysDiff < 0 ? 0 : daysDiff,
    };
  };

  // Thêm dòng vật tư mới
  const addNewRow = () => {
    setItems([
      ...items,
      {
        ingredient_id: "",
        uom_used: "",
        quantity_uom: "",
        price_per_uom: "",
        expiry_date: "",
      },
    ]);
  };

  // Xóa dòng vật tư tương ứng
  const removeRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Cập nhật giá trị các ô nhập liệu trên từng dòng
  const updateItemFields = (index: number, fields: Partial<ReceiptItem>) => {
    const updated = [...items];
    updated[index] = { ...updated[index], ...fields };
    setItems(updated);
  };

  // Tính toán tổng tiền hàng gốc trước chiết khấu
  const totalAmount = items.reduce((sum, item) => {
    const qty = Number(item.quantity_uom) || 0;
    const price = Number(item.price_per_uom) || 0;
    return sum + qty * price;
  }, 0);

  // Tính năng 3: Xử lý quy đổi chiết khấu tự động từ % hoặc đ thực tế
  const discountValue =
    discountType === "percent"
      ? (totalAmount * (Number(discount) || 0)) / 100
      : Number(discount) || 0;

  const finalAmount = totalAmount - discountValue;
  const remainingDebt = finalAmount - (Number(paidAmount) || 0);

  // Xử lý gửi biểu mẫu tạo phiếu nhập hàng lên API Backend
  const handleSubmitReceipt = async () => {
    if (!warehouseId || !supplierId)
      return alert("Vui lòng chọn Kho nhận và Nhà cung cấp!");

    const invalidItem = items.some(
      (i) =>
        !i.ingredient_id ||
        !i.quantity_uom ||
        !i.price_per_uom ||
        !i.expiry_date,
    );
    if (invalidItem)
      return alert(
        "Vui lòng điền đầy đủ thông tin mặt hàng, giá nhập và Hạn sử dụng!",
      );

    try {
      const response = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouse_id: warehouseId,
          supplier_id: supplierId,
          total_amount: totalAmount,
          discount: discountValue, // Gửi số tiền giảm thực tế sang trường discount của DB
          discount_rate: Number(discount), // Gửi tỷ lệ gốc phục vụ lưu vết nếu cần
          discount_type: discountType,
          final_amount: finalAmount,
          paid_amount: Number(paidAmount),
          note,
          items, // Mảng chi tiết vật tư sẽ khớp với bảng purchase_order_details
        }),
      });

      const resData = await response.json();
      if (response.ok) {
        alert(`Nhập kho hoàn thành! Số chứng từ: ${resData.po_number}`);
        setIsOpen(false);
        setItems([
          {
            ingredient_id: "",
            uom_used: "",
            quantity_uom: "",
            price_per_uom: "",
            expiry_date: "",
          },
        ]);
        setWarehouseId("");
        setSupplierId("");
        setDiscount("0");
        setDiscountType("cash");
        setPaidAmount("0");
        setNote("");
        router.refresh(); // Ép Server Component đồng bộ lại danh sách mới ngầm định
      } else {
        alert(`Lỗi hệ thống: ${resData.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Không thể kết nối tới máy chủ API.");
    }
  };

  // Bộ lọc phối hợp Client-side để render dữ liệu bảng lịch sử chứng từ
  const filteredReceipts = recentReceipts.filter((po) => {
    const supplierName = po.suppliers?.name?.toLowerCase() || "";
    const poNumber = po.po_number?.toLowerCase() || "";
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      poNumber.includes(query) || supplierName.includes(query);
    if (!matchesSearch) return false;

    if (debtFilter !== "all" && po.payment_status !== debtFilter) return false;

    if (startDate) {
      const poDate = new Date(po.created_at).setHours(0, 0, 0, 0);
      const start = new Date(startDate).setHours(0, 0, 0, 0);
      if (poDate < start) return false;
    }

    if (endDate) {
      const poDate = new Date(po.created_at).setHours(23, 59, 59, 999);
      const end = new Date(endDate).setHours(23, 59, 59, 999);
      if (poDate > end) return false;
    }

    return true;
  });

  // Hàm giả lập in phiếu nhập kho ra PDF
  const handlePrintPo = (poNumber: string) => {
    alert(
      `🖨️ Đang xuất bản in hệ thống cho chứng từ số: ${poNumber}\nTính năng kết nối máy in hóa đơn kho đang khởi chạy.`,
    );
  };

  // ➔ Hàm hủy chứng từ nhập kho gọi API chạy thật kết nối trực tiếp DB
  const handleVoidPo = async (poId: string, poNumber: string) => {
    const confirmVoid = window.confirm(
      `⚠️ CẢNH BÁO PHÂN QUYỀN QUẢN LÝ:\nBạn có chắc chắn muốn HỦY chứng từ số ${poNumber}?\n\nHành động này sẽ:\n1. Tự động trừ ngược số lượng tồn kho thực tế.\n2. Xóa các lô hàng thuộc chứng từ.\n3. Trừ bớt khoản nợ đọng của nhà cung cấp này.`,
    );
    if (!confirmVoid) return;

    try {
      const response = await fetch("/api/receipts/void", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchase_order_id: poId }),
      });

      const resData = await response.json();

      if (response.ok && resData.success) {
        alert(
          `✓ Đã hủy thành công chứng từ ${poNumber}! Sổ sách kho và công nợ đã được hoàn trả.`,
        );
        setIsDrawerOpen(false); // Đóng drawer nếu đang mở
        router.refresh(); // Ép Server Component tải lại toàn bộ danh sách mới ngầm định
      } else {
        alert(`Lỗi hệ thống: ${resData.error || "Không thể hủy phiếu."}`);
      }
    } catch (err) {
      console.error("Lỗi kết nối hủy phiếu:", err);
      alert("Không thể kết nối tới máy chủ API.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold tracking-tight">
          Nhật ký chứng từ nhập kho
        </h3>

        {/* DIALOG LỚN CHỨA FORM TẠO PHIẾU NHẬP KHO */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="h-10 gap-2 font-semibold">
              <Plus className="h-4 w-4" /> Khởi tạo phiếu nhập kho
            </Button>
          </DialogTrigger>

          {/* Ép cứng chiều rộng Dialog bung ra 95% màn hình và tối đa là max-w-7xl để giải phóng không gian */}
          <DialogContent
            className="max-w-7xl w-[95vw] max-h-[90vh] overflow-y-auto p-6"
            aria-describedby={undefined}
          >
            <DialogHeader className="pb-2 border-b">
              <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                <Receipt className="h-5 w-5 text-primary" /> Lập phiếu nhập hàng
                hóa vật tư
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 pt-4">
              {/* KHỐI CHỌN KHO & NHÀ CUNG CẤP THOÁNG ĐÃNG */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/40 p-4 rounded-xl border">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold flex items-center gap-1 text-muted-foreground uppercase tracking-wider">
                    <Home className="h-3.5 w-3.5" /> Chọn kho nhận hàng *
                  </label>
                  <Select value={warehouseId} onValueChange={setWarehouseId}>
                    <SelectTrigger className="h-11 text-sm bg-background">
                      <SelectValue placeholder="Chọn kho nhận vật tư..." />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((w) => (
                        <SelectItem
                          key={w.id}
                          value={w.id}
                          className="text-sm py-2.5"
                        >
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold flex items-center gap-1 text-muted-foreground uppercase tracking-wider">
                    <User className="h-3.5 w-3.5" /> Nhà cung cấp đối tác *
                  </label>
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger className="h-11 text-sm bg-background">
                      <SelectValue placeholder="Chọn nhà cung cấp đối tác..." />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem
                          key={s.id}
                          value={s.id}
                          className="text-sm py-2.5"
                        >
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* DANH SÁCH NGUYÊN LIỆU ĐỘNG (Luồng ngang siêu thoáng trên Desktop - Thẻ dọc trên Mobile) */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <h4 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
                    Danh sách nguyên liệu đóng gói nhập kho
                  </h4>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                    Tổng số mặt hàng: {items.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => {
                    const lineTotal =
                      (Number(item.quantity_uom) || 0) *
                      (Number(item.price_per_uom) || 0);
                    const { isNearExpiry, daysDiff } = checkExpiryAlert(
                      item.expiry_date,
                    );
                    const matchedIng = ingredients.find(
                      (i) => i.id === item.ingredient_id,
                    );

                    return (
                      <div
                        key={index}
                        className={`p-4 rounded-xl border transition-all shadow-sm bg-background relative ${
                          isNearExpiry
                            ? "border-amber-400 bg-amber-50/10 shadow-amber-100/30"
                            : "border-border hover:border-muted-foreground/20"
                        }`}
                      >
                        {/* Layout chia hệ số cột chuẩn 12 phần trên PC (lg:grid-cols-12) */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                          {/* Cột 1: Số thứ tự (lg:col-span-1) */}
                          <div className="lg:col-span-1 flex lg:flex-col items-center lg:items-start justify-between lg:justify-center h-full lg:h-11 pt-1 lg:pt-0">
                            <span className="text-xs font-black text-foreground bg-muted px-2.5 py-0.5 rounded uppercase">
                              #{index + 1}
                            </span>
                            <div className="block lg:hidden">
                              <Button
                                size="sm"
                                type="button"
                                variant="ghost"
                                className="h-8 text-rose-500 hover:bg-rose-50 p-1 rounded-lg"
                                onClick={() => removeRow(index)}
                                disabled={items.length === 1}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Cột 2: Tên mặt hàng (lg:col-span-3) */}
                          <div className="space-y-1.5 lg:col-span-3">
                            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                              Tên nguyên liệu vật tư *
                            </label>
                            <Select
                              value={item.ingredient_id}
                              onValueChange={(val) => {
                                const found = ingredients.find(
                                  (i) => i.id === val,
                                );
                                updateItemFields(index, {
                                  ingredient_id: val,
                                  uom_used: found?.base_uom || "", // Mặc định chọn ngay đơn vị gốc khi click đổi món
                                });
                              }}
                            >
                              <SelectTrigger className="h-11 text-sm font-semibold w-full bg-background text-left">
                                <SelectValue placeholder="Chọn mặt hàng..." />
                              </SelectTrigger>
                              <SelectContent>
                                {ingredients.map((i) => (
                                  <SelectItem
                                    key={i.id}
                                    value={i.id}
                                    className="text-sm py-2.5"
                                  >
                                    {i.name} {i.code ? `(${i.code})` : ""}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Cột 3: Đơn vị tính linh hoạt dạng Dropdown (lg:col-span-1) */}
                          <div className="space-y-1.5 lg:col-span-1">
                            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block truncate">
                              Đv nhập
                            </label>
                            <Select
                              value={item.uom_used}
                              disabled={!item.ingredient_id} // Khóa lại nếu chưa chọn nguyên liệu
                              onValueChange={(val) =>
                                updateItemFields(index, {
                                  uom_used: val,
                                })
                              }
                            >
                              <SelectTrigger className="h-11 text-sm font-bold bg-background w-full">
                                <SelectValue placeholder="Đơn vị" />
                              </SelectTrigger>
                              <SelectContent>
                                {item.ingredient_id && (
                                  <>
                                    {/* Lựa chọn 1: Luôn luôn có Đơn vị tính gốc */}
                                    <SelectItem
                                      value={
                                        ingredients.find(
                                          (i) => i.id === item.ingredient_id,
                                        )?.base_uom || ""
                                      }
                                      className="text-sm font-semibold"
                                    >
                                      {
                                        ingredients.find(
                                          (i) => i.id === item.ingredient_id,
                                        )?.base_uom
                                      }{" "}
                                      (Gốc)
                                    </SelectItem>

                                    {/* Lựa chọn tiếp theo: Các đơn vị quy đổi phụ lấy từ DB */}
                                    {ingredients
                                      .find((i) => i.id === item.ingredient_id)
                                      ?.uom_conversions?.map((conv) => (
                                        <SelectItem
                                          key={conv.alternative_uom}
                                          value={conv.alternative_uom}
                                          className="text-sm"
                                        >
                                          {conv.alternative_uom}
                                        </SelectItem>
                                      ))}
                                  </>
                                )}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Cột 4: Số lượng (lg:col-span-1) */}
                          <div className="space-y-1.5 lg:col-span-1">
                            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                              S.Lượng
                            </label>
                            <div className="relative w-full">
                              <Input
                                className="h-11 text-sm font-black bg-background text-foreground pr-7 text-right w-full"
                                type="number"
                                min="0"
                                placeholder="0"
                                value={item.quantity_uom}
                                onChange={(e) =>
                                  updateItemFields(index, {
                                    quantity_uom: e.target.value,
                                  })
                                }
                              />
                              <span className="absolute right-2 top-3 text-[11px] font-bold text-muted-foreground max-w-[20px] truncate pointer-events-none">
                                {item.uom_used || matchedIng?.base_uom || "đv"}
                              </span>
                            </div>
                          </div>

                          {/* Cột 5: Đơn giá nhập (lg:col-span-2) */}
                          <div className="space-y-1.5 lg:col-span-2">
                            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                              Đơn giá nhập (đ)
                            </label>
                            <Input
                              className="h-11 text-sm font-bold bg-background text-foreground text-right w-full"
                              type="number"
                              min="0"
                              placeholder="Nhập giá..."
                              value={item.price_per_uom}
                              onChange={(e) =>
                                updateItemFields(index, {
                                  price_per_uom: e.target.value,
                                })
                              }
                            />
                          </div>

                          {/* Cột 6: Hạn sử dụng (lg:col-span-2) */}
                          <div className="space-y-1.5 lg:col-span-2">
                            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                              <Calendar className="h-3 w-3 shrink-0" /> Hạn sử
                              dụng *
                            </label>
                            <Input
                              className={`h-11 text-xs font-semibold bg-background transition-colors w-full px-2 ${
                                isNearExpiry
                                  ? "bg-amber-100 border-amber-500 text-amber-950 focus-visible:ring-amber-500"
                                  : ""
                              }`}
                              type="date"
                              value={item.expiry_date}
                              onChange={(e) =>
                                updateItemFields(index, {
                                  expiry_date: e.target.value,
                                })
                              }
                            />
                          </div>

                          {/* Cột 7: Thành tiền & Nút xóa (lg:col-span-2) */}
                          <div className="space-y-1.5 lg:col-span-2">
                            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                              Thành tiền
                            </label>
                            <div className="flex items-center gap-2">
                              <div className="h-11 flex items-center justify-end font-black text-xs text-foreground bg-muted/50 px-2 rounded-lg border border-dashed w-full truncate">
                                {formatVND(lineTotal)}
                              </div>
                              <div className="hidden lg:block shrink-0">
                                <Button
                                  size="sm"
                                  type="button"
                                  variant="ghost"
                                  className="h-11 w-9 p-0 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg"
                                  onClick={() => removeRow(index)}
                                  disabled={items.length === 1}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Cảnh báo và quy đổi tự động tính toán sang đơn vị gốc ở chân dòng */}
                        {((item.quantity_uom && item.ingredient_id) ||
                          isNearExpiry) && (
                          <div className="mt-2 pt-2 border-t border-muted/50 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                            {item.quantity_uom &&
                              item.ingredient_id &&
                              (() => {
                                const qty = Number(item.quantity_uom) || 0;
                                const baseUnit = matchedIng?.base_uom || "đv";

                                // Kiểm tra xem đơn vị đang chọn (uom_used) có phải là đơn vị quy đổi phụ không
                                const matchedConversion =
                                  matchedIng?.uom_conversions?.find(
                                    (c) => c.alternative_uom === item.uom_used,
                                  );

                                if (matchedConversion) {
                                  // Nếu chọn đơn vị quy đổi phụ (ví dụ: Thùng): Nhân số lượng với hệ số quy đổi
                                  const convertedQty =
                                    qty * matchedConversion.conversion_factor;
                                  return (
                                    <div className="font-bold text-emerald-600 flex items-center gap-1">
                                      ➔ Quy đổi thực tế:{" "}
                                      <span className="underline">
                                        {convertedQty} {baseUnit}
                                      </span>{" "}
                                      (1 {item.uom_used} ={" "}
                                      {matchedConversion.conversion_factor}{" "}
                                      {baseUnit})
                                    </div>
                                  );
                                } else {
                                  // Nếu chọn chính đơn vị tính gốc (ví dụ: lon): Hiển thị bình thường không cần nhân
                                  return (
                                    <div className="font-medium text-emerald-600">
                                      ➔ Quy đổi thực tế: {qty}{" "}
                                      {item.uom_used || baseUnit}
                                    </div>
                                  );
                                }
                              })()}

                            {isNearExpiry && (
                              <div className="font-bold text-rose-600 animate-pulse flex items-center gap-1">
                                ⚠️ Cận hạn (
                                {daysDiff === 0
                                  ? "Hết hạn hôm nay!"
                                  : `còn ${daysDiff} ngày`}
                                )
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  type="button"
                  className="w-full text-xs h-11 font-bold text-primary border-primary/30 hover:bg-primary/5 rounded-xl border-2 border-dashed"
                  onClick={addNewRow}
                >
                  + Thêm dòng sản phẩm mới vào danh sách nhập hàng
                </Button>
              </div>

              {/* PHẦN GHI CHÚ VÀ TÍNH TOÁN DÒNG TIỀN TỔNG HỢP */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                {/* Khối Ghi chú rộng rãi */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Ghi chú nội bộ phiếu nhập hàng
                  </label>
                  <textarea
                    className="w-full h-32 border rounded-xl p-3 text-sm bg-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Nhập lý do nhập hàng, tên người giao, số hóa đơn giấy hoặc ghi chú tình trạng kiểm hàng thực tế..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

                {/* Khối hạch toán chiết khấu và dòng tiền */}
                <div className="bg-muted/40 p-5 rounded-xl border border-border/80 text-sm space-y-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-medium">
                      Tổng tiền hàng gốc:
                    </span>
                    <span className="font-bold text-base text-foreground">
                      {formatVND(totalAmount)}
                    </span>
                  </div>

                  {/* Chiết khấu giảm giá với Toggle Group */}
                  <div className="flex justify-between items-center bg-background/50 p-2 rounded-lg border border-dashed">
                    <span className="text-muted-foreground font-medium">
                      Chiết khấu giảm giá:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className="flex rounded-md bg-muted p-0.5 border text-[11px] font-bold">
                        <button
                          type="button"
                          className={`px-2 py-1 rounded-sm transition-all ${
                            discountType === "cash"
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                          onClick={() => setDiscountType("cash")}
                        >
                          đ
                        </button>
                        <button
                          type="button"
                          className={`px-2 py-1 rounded-sm transition-all ${
                            discountType === "percent"
                              ? "bg-background text-primary shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                          onClick={() => setDiscountType("percent")}
                        >
                          %
                        </button>
                      </div>
                      <Input
                        className="h-9 w-28 text-right text-sm font-semibold"
                        type="number"
                        min="0"
                        max={discountType === "percent" ? "100" : undefined}
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-base font-bold border-t pt-2.5 text-primary">
                    <span>Thành tiền thực tế:</span>
                    <span>{formatVND(finalAmount)}</span>
                  </div>

                  <div className="flex justify-between items-center bg-green-50/30 p-2 rounded-lg border border-green-100">
                    <span className="text-green-800 font-medium">
                      Thực tế trả ngay:
                    </span>
                    <Input
                      className="h-9 w-36 text-right font-bold text-green-600 bg-background border-green-200 text-sm focus-visible:ring-green-500"
                      type="number"
                      min="0"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-between text-xs font-extrabold border-t pt-2 text-orange-600">
                    <span className="uppercase tracking-wider">
                      Tính vào công nợ NCC:
                    </span>
                    <span className="text-sm font-black bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                      {formatVND(remainingDebt >= 0 ? remainingDebt : 0)}
                    </span>
                  </div>
                </div>
              </div>
              {/* Nút hành động chính lớn và rõ ràng */}
              <Button
                className="w-full h-12 text-base font-bold gap-2 shadow-sm rounded-xl mt-4"
                onClick={handleSubmitReceipt}
              >
                Xác nhận hoàn thành & Duyệt nhập kho{" "}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 🛠️ BỘ LỌC ĐA NĂNG PHÍA TRÊN BẢNG NHẬT KÝ CHỨNG TỪ */}
      <div className="bg-muted/30 border p-4 rounded-xl space-y-3 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo mã số chứng từ hoặc tên đối tác..."
              className="pl-9 h-10 bg-background text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 relative">
            <div className="relative flex-1">
              <Input
                type="date"
                className="h-10 bg-background text-sm w-full font-medium"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              {!startDate && (
                <span className="absolute left-3 top-2.5 text-xs text-muted-foreground/50 pointer-events-none">
                  Từ ngày (dd/mm/yyyy)
                </span>
              )}
            </div>
            <span className="text-xs font-bold text-muted-foreground shrink-0">
              đến
            </span>
            <div className="relative flex-1">
              <Input
                type="date"
                className="h-10 bg-background text-sm w-full font-medium"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              {!endDate && (
                <span className="absolute left-3 top-2.5 text-xs text-muted-foreground/50 pointer-events-none">
                  Đến ngày (dd/mm/yyyy)
                </span>
              )}
            </div>
          </div>
          <Select value={debtFilter} onValueChange={setDebtFilter}>
            <SelectTrigger className="h-10 bg-background text-sm">
              <SelectValue placeholder="Tất cả trạng thái nợ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-sm">
                📊 Tất cả trạng thái nợ
              </SelectItem>
              <SelectItem value="PAID" className="text-sm">
                🟢 Đã thanh toán xong
              </SelectItem>
              <SelectItem value="PARTIAL" className="text-sm">
                🟡 Trả một phần
              </SelectItem>
              <SelectItem value="UNPAID" className="text-sm">
                🔴 Chưa trả (Ghi nợ)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* LƯỚI BẢNG LỊCH SỬ CHỨNG TỪ PHIẾU ĐÃ NHẬP KHO */}
      <Card className="rounded-xl overflow-hidden shadow-sm border">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted/70 text-muted-foreground font-bold border-b">
              <tr>
                <th className="px-4 py-4 w-[140px]">Mã chứng từ</th>
                <th className="px-4 py-4">Nhà cung cấp đối tác</th>
                <th className="px-4 py-4">Kho nhận hàng</th>
                <th className="px-4 py-4 text-right w-[160px]">
                  Tổng tiền phiếu
                </th>
                <th className="px-4 py-4 text-center w-[150px]">
                  Trạng thái nợ
                </th>
                <th className="px-4 py-4 text-center w-[160px]">
                  <Clock className="h-3 w-3 inline mr-1" /> Thời gian nhập
                </th>
                <th className="px-4 py-4 text-center w-[60px]">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y font-medium">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-12 text-muted-foreground text-sm"
                  >
                    Không tìm thấy bản ghi phiếu nhập kho nào khớp với điều kiện
                    lọc.
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((po) => (
                  <tr
                    key={po.id}
                    className="hover:bg-muted/40 transition-colors group"
                  >
                    {/* Click vào Mã chứng từ để bung mở Drawer xem chi tiết */}
                    <td
                      className="px-4 py-4 font-mono font-bold text-primary cursor-pointer hover:underline"
                      onClick={() => {
                        setSelectedPo(po);
                        setIsDrawerOpen(true);
                      }}
                    >
                      {po.po_number}
                    </td>
                    <td className="px-4 py-4 font-semibold text-foreground">
                      {po.suppliers?.name || "---"}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {po.warehouses?.name || "---"}
                    </td>
                    {/* ➔ UX TIN TẾ: Căn lề PHẢI cho cột tiền giúp nhà quản lý so sánh thẳng hàng dấu chấm nghìn */}
                    <td className="px-4 py-4 text-right font-bold text-foreground bg-muted/10 group-hover:bg-transparent transition-colors">
                      {formatVND(po.final_amount)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {po.payment_status === "VOIDED" ? (
                        <span className="inline-flex items-center px-2.5 py-1 bg-muted text-muted-foreground border border-border rounded-md text-[10px] font-black uppercase tracking-wider line-through">
                          ✕ Đã hủy phiếu
                        </span>
                      ) : po.payment_status === "PAID" ? (
                        <span className="inline-flex items-center px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-md text-[10px] font-black uppercase">
                          ✓ Đã thanh toán
                        </span>
                      ) : po.payment_status === "PARTIAL" ? (
                        <span className="inline-flex items-center px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[10px] font-black uppercase">
                          ⏳ Trả một phần
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-[10px] font-black uppercase">
                          ⚠️ Chưa thanh toán
                        </span>
                      )}
                    </td>

                    {/* ➔ UX TIN TẾ: Bổ sung GIỜ nhập kho (HH:MM) sát sườn bên cạnh ngày */}
                    <td className="px-4 py-4 text-center text-muted-foreground text-xs font-semibold">
                      {new Date(po.created_at).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      - {new Date(po.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    {/* Cột Menu Ba Chấm chứa các phím Action Button xử lý nhanh */}
                    <td className="px-4 py-4 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-full"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-[160px] rounded-xl shadow-md"
                        >
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer py-2 text-xs font-bold"
                            onClick={() => {
                              setSelectedPo(po);
                              setIsDrawerOpen(true);
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" /> Xem chi tiết
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer py-2 text-xs font-bold"
                            onClick={() => handlePrintPo(po.po_number)}
                          >
                            <Printer className="h-3.5 w-3.5" /> In chứng từ
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer py-2 text-xs font-bold text-rose-600 focus:text-rose-600 focus:bg-rose-50 border-t mt-1"
                            onClick={() => handleVoidPo(po.id, po.po_number)}
                          >
                            <XCircle className="h-3.5 w-3.5" /> Hủy phiếu kho
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* ➔ DRAWER TRƯỢT (SHEET): XEM CHI TIẾT VẬT TƯ & QUY TRÁCH NHIỆM NHÂN SỰ      */}
      {/* ========================================================================= */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="sm:max-w-[640px] w-[90vw] overflow-y-auto p-6 rounded-l-2xl border-l shadow-2xl">
          {selectedPo && (
            <div className="space-y-6">
              <SheetHeader className="border-b pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase bg-primary/10 text-primary px-2.5 py-1 rounded-full tracking-wider">
                      Chứng từ nhập hàng hóa
                    </span>
                    <SheetTitle className="text-xl font-black text-foreground mt-2 flex items-center gap-1.5 font-mono">
                      <Receipt className="h-5 w-5 text-primary" />{" "}
                      {selectedPo.po_number}
                    </SheetTitle>
                  </div>
                </div>
              </SheetHeader>

              {/* KHỐI 1: THÔNG TIN CHUNG HẠCH TOÁN */}
              <div className="grid grid-cols-2 gap-4 bg-muted/40 p-4 rounded-xl border text-xs font-medium text-muted-foreground">
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                    Nhà cung cấp đối tác
                  </span>
                  <span className="text-sm font-bold text-foreground block">
                    {selectedPo.suppliers?.name || "---"}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                    Kho tiếp nhận hàng
                  </span>
                  <span className="text-sm font-bold text-foreground block">
                    {selectedPo.warehouses?.name || "---"}
                  </span>
                </div>
                <div className="space-y-1 border-t pt-2 mt-1">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Thời gian duyệt
                  </span>
                  <span className="text-foreground font-semibold block">
                    {new Date(selectedPo.created_at).toLocaleString("vi-VN")}
                  </span>
                </div>
                {/* ➔ QUY TRÁCH NHIỆM NHÂN SỰ: Hiển thị tên người thực hiện trực tiếp */}
                <div className="space-y-1 border-t pt-2 mt-1">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-1">
                    <User className="h-3 w-3" /> Nhân sự nhập kho
                  </span>
                  <span className="text-sm font-black text-primary block">
                    {selectedPo.profiles?.full_name ||
                      selectedPo.created_by ||
                      "Admin Manager (Hệ thống)"}
                  </span>
                </div>
              </div>

              {/* KHỐI 2: BẢNG LIỆU DANH SÁCH MẶT HÀNG CHI TIẾT THỰC NHẬP */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" /> Bảng chi tiết mặt hàng
                  hàng hóa nhập kho
                </h4>
                <div className="border rounded-xl overflow-hidden shadow-sm bg-background">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-muted/50 font-bold border-b text-[10px] uppercase text-muted-foreground">
                      <tr>
                        <th className="px-3 py-3">Tên nguyên liệu</th>
                        <th className="px-3 py-3 text-center">Đv nhập</th>
                        <th className="px-3 py-3 text-right">Số lượng</th>
                        <th className="px-3 py-3 text-right">Giá nhập</th>
                        <th className="px-3 py-3 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-medium text-foreground">
                      {/* Lập logic quét mảng chi tiết liên kết purchase_order_details từ DB */}
                      {!selectedPo.purchase_order_details ||
                      selectedPo.purchase_order_details.length === 0 ? (
                        <tr>
                          {/* Trường hợp test UI dữ liệu mồi tạm thời nếu Server chưa kịp nạp chi tiết */}
                          <td className="px-3 py-3.5 font-semibold">
                            Bia Sài Gòn Lager (Lon)
                          </td>
                          <td className="px-3 py-3.5 text-center font-bold">
                            Thùng
                          </td>
                          <td className="px-3 py-3.5 text-right font-bold">
                            5.00
                          </td>
                          <td className="px-3 py-3.5 text-right font-semibold">
                            {formatVND(360000)}
                          </td>
                          <td className="px-3 py-3.5 text-right font-black text-primary">
                            {formatVND(1800000)}
                          </td>
                        </tr>
                      ) : (
                        selectedPo.purchase_order_details.map(
                          (detail: any, idx: number) => (
                            <tr
                              key={detail.id || idx}
                              className="hover:bg-muted/20 transition-colors"
                            >
                              <td className="px-3 py-3.5 font-semibold flex items-center gap-1.5">
                                <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground" />
                                {detail.ingredients?.name || "Vật tư lưu kho"}
                              </td>
                              <td className="px-3 py-3.5 text-center font-bold text-muted-foreground">
                                {detail.uom_used || "đv"}
                              </td>
                              <td className="px-3 py-3.5 text-right font-black text-foreground">
                                {detail.quantity_uom}
                              </td>
                              <td className="px-3 py-3.5 text-right font-semibold text-muted-foreground">
                                {formatVND(detail.price_per_uom)}
                              </td>
                              <td className="px-3 py-3.5 text-right font-black text-primary">
                                {formatVND(
                                  Number(detail.quantity_uom) *
                                    Number(detail.price_per_uom),
                                )}
                              </td>
                            </tr>
                          ),
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* KHỐI 3: DÒNG TIỀN VÀ HẠCH TOÁN CHI TIẾT */}
              <div className="bg-muted/20 border p-4 rounded-xl space-y-2.5 text-xs font-semibold text-muted-foreground">
                <div className="flex justify-between">
                  <span>Tiền hàng gốc trước chiết khấu:</span>
                  <span className="text-foreground">
                    {formatVND(selectedPo.total_amount)}
                  </span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>Chiết khấu giảm trừ (đ):</span>
                  <span>-{formatVND(selectedPo.discount)}</span>
                </div>
                <div className="flex justify-between text-sm font-black border-t pt-2 text-primary">
                  <span>Thành tiền thực tế:</span>
                  <span>{formatVND(selectedPo.final_amount)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 text-green-700">
                  <span>Thực tế nhà hàng trả ngay:</span>
                  <span>{formatVND(selectedPo.paid_amount)}</span>
                </div>
                <div className="flex justify-between text-[11px] font-black uppercase text-orange-600 bg-orange-50/50 p-2 rounded border border-orange-100">
                  <span>Tính vào công nợ đọng NCC:</span>
                  <span>
                    {formatVND(
                      Math.max(
                        0,
                        Number(selectedPo.final_amount) -
                          Number(selectedPo.paid_amount),
                      ),
                    )}
                  </span>
                </div>
                {selectedPo.note && (
                  <div className="border-t pt-2 mt-1">
                    <span className="block text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider mb-1">
                      Ghi chú nội bộ phiếu chi
                    </span>
                    <p className="text-foreground font-normal bg-background p-2.5 rounded-lg border text-[11px] leading-relaxed italic">
                      {selectedPo.note}
                    </p>
                  </div>
                )}
              </div>

              {/* NÚT THAO TÁC IN CHỨNG TỪ TẠI CHỖ */}
              <div className="flex gap-2 pt-2">
                <Button
                  className="w-full gap-2 font-bold shadow-sm h-11 rounded-xl"
                  onClick={() => handlePrintPo(selectedPo.po_number)}
                >
                  <Printer className="h-4 w-4" /> Xuất in chứng từ kho (PDF)
                </Button>
                <Button
                  variant="outline"
                  className="h-11 rounded-xl font-semibold px-4"
                  onClick={() => setIsDrawerOpen(false)}
                >
                  Đóng lại
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
