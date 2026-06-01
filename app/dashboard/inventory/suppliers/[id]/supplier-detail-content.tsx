"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  Phone,
  MapPin,
  CreditCard,
  Calendar,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  current_debt: number;
}
interface LedgerRow {
  id: string;
  transaction_type: string;
  amount: number;
  balance_after: number;
  note: string | null;
  created_at: string;
}

// 1. Thêm interface PurchaseOrder ở đầu file
interface PurchaseOrder {
  id: string;
  po_number: string;
  final_amount: number;
  payment_status: string;
  status: string;
  created_at: string;
}

export function SupplierDetailContent({
  supplier,
  ledger,
  purchaseOrders = [],
}: {
  supplier: Supplier;
  ledger: LedgerRow[];
  purchaseOrders?: PurchaseOrder[];
}) {
  const router = useRouter();
  const [currentDebt, setCurrentDebt] = useState(supplier.current_debt);
  const [ledgerRows, setLedgerRows] = useState<LedgerRow[]>(ledger);

  // Quản lý Dialog Ghi nhận thanh toán trả nợ
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [payForm, setPayForm] = useState({
    amount: "",
    payment_method: "CASH",
    note: "",
  });

  // --- BỔ SUNG CÁC STATE PHỤC VỤ LỌC & ĐIỀU HƯỚNG MỚI MỞ RỘNG ---
  const [activeTab, setActiveTab] = useState<string>("debt_ledger");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [poSearchQuery, setPoSearchQuery] = useState<string>(""); // Lưu mã PO được click để highlight/lọc tự động

  // ➔ Lọc mảng Lịch sử công nợ theo Khoảng thời gian
  const filteredLedger = useMemo(() => {
    return ledgerRows.filter((row) => {
      const rowDate = new Date(row.created_at).setHours(0, 0, 0, 0);

      if (startDate) {
        const start = new Date(startDate).setHours(0, 0, 0, 0);
        if (rowDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate).setHours(23, 59, 59, 999);
        if (rowDate > end) return false;
      }
      return true;
    });
  }, [ledgerRows, startDate, endDate]);

  // ➔ Lọc mảng Phiếu nhập kho theo Khoảng thời gian + Kết hợp mã PO điều hướng kích hoạt tự động
  const filteredPurchaseOrders = useMemo(() => {
    return purchaseOrders.filter((po) => {
      // Nếu có chuỗi tìm kiếm mã PO do người dùng bấm liên kết từ Sổ cái sang, thực hiện ưu tiên lọc chính xác mã đó trước
      if (poSearchQuery.trim()) {
        return po.po_number
          .toLowerCase()
          .includes(poSearchQuery.toLowerCase().trim());
      }

      const poDate = new Date(po.created_at).setHours(0, 0, 0, 0);

      if (startDate) {
        const start = new Date(startDate).setHours(0, 0, 0, 0);
        if (poDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate).setHours(23, 59, 59, 999);
        if (poDate > end) return false;
      }
      return true;
    });
  }, [purchaseOrders, startDate, endDate, poSearchQuery]);

  // Hàm xử lý nhảy Tab thông minh và lọc nhanh khi kế toán click vào mã PO liên kết
  const handleLinkToPurchaseOrder = (noteText: string | null) => {
    if (!noteText) return;
    // Sử dụng Regex để tìm chuỗi có định dạng mã PO (Ví dụ: PO-123456 hoặc NK-123456)
    const poMatch = noteText.match(/(PO-\d+|NK-\d+)/i);
    if (poMatch && poMatch[0]) {
      const detectedPoNumber = poMatch[0];
      setPoSearchQuery(detectedPoNumber); // Gắn mã PO vào thanh tìm kiếm tự động
      setActiveTab("purchase_orders"); // Đổi tab sang Lịch sử nhập kho ngay lập tức
    }
  };

  // ➔ Hàm gọi API trả nợ chạy thật qua Backend Route
  const handlePaymentSubmit = async () => {
    const payAmount = Number(payForm.amount);
    if (!payAmount || payAmount <= 0)
      return alert("Vui lòng nhập số tiền thanh toán hợp lệ!");

    try {
      const response = await fetch("/api/suppliers/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplier_id: supplier.id,
          amount: payAmount,
          payment_method: payForm.payment_method,
          note: payForm.note,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Đồng bộ State trên màn hình đổi số lượng ngay lập tức
        setCurrentDebt(result.newDebt);
        if (result.newLedger) {
          setLedgerRows([result.newLedger, ...ledgerRows]);
        }

        setIsPayOpen(false);
        setPayForm({ amount: "", payment_method: "CASH", note: "" });
        alert(`Đã lập phiếu chi trả nợ thành công!`);

        router.refresh(); // Làm mới ngầm Server Component
      } else {
        alert(`Lỗi: ${result.error}`);
      }
    } catch (error) {
      console.error(error);
      alert("Không thể kết nối tới máy chủ API.");
    }
  };

  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(num);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/inventory/suppliers">
          <Button variant="ghost" className="gap-2 text-xs">
            <ArrowLeft className="h-4 w-4" /> Quay lại danh sách đối tác
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Thông tin liên hệ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground font-medium">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />{" "}
              <span>Điện thoại: {supplier.phone || "---"}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />{" "}
              <span>Địa chỉ kho: {supplier.address || "---"}</span>
            </div>
          </CardContent>
        </Card>

        {/* 🎨 1. ĐIỀU CHỈNH MÀU SẮC LINH HOẠT THEO TÂM LÝ HỌC UI */}
        <Card
          className={`border-l-4 ${currentDebt > 0 ? "border-l-rose-500 bg-rose-50/10" : "border-l-emerald-500 bg-emerald-50/10"}`}
        >
          <CardHeader className="pb-1">
            <CardTitle className="text-xs uppercase text-muted-foreground tracking-wider">
              Tổng nợ đọng hiện tại
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p
              className={`text-2xl font-black ${currentDebt > 0 ? "text-rose-600" : "text-emerald-600"}`}
            >
              {formatVND(currentDebt)}
            </p>

            {/* 💳 2. NÚT HÀNH ĐỘNG GHI NHẬN THANH TOÁN ĐƯỢC THIẾT KẾ SẴN */}
            <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="w-full gap-1.5 h-8 font-semibold text-xs"
                  variant={currentDebt > 0 ? "default" : "outline"}
                >
                  <CreditCard className="h-3.5 w-3.5" /> Ghi nhận trả tiền nợ
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Tạo phiếu chi trả nợ nhà cung cấp</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold">
                      Số tiền thanh toán (đ) *
                    </label>
                    <Input
                      type="number"
                      placeholder="Nhập số tiền vừa chuyển khoản/trả mặt..."
                      value={payForm.amount}
                      onChange={(e) =>
                        setPayForm({ ...payForm, amount: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold">
                      Hình thức chi tiền
                    </label>
                    <Select
                      value={payForm.payment_method}
                      onValueChange={(val) =>
                        setPayForm({ ...payForm, payment_method: val })
                      }
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Chọn hình thức" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">
                          💵 Tiền mặt tại quỹ
                        </SelectItem>
                        <SelectItem value="BANK">
                          🏦 Chuyển khoản ngân hàng (QR)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold">
                      Nội dung / Diễn giải phiểu chi
                    </label>
                    <Input
                      placeholder="Ví dụ: Trả bớt tiền hàng đợt đầu tuần..."
                      value={payForm.note}
                      onChange={(e) =>
                        setPayForm({ ...payForm, note: e.target.value })
                      }
                    />
                  </div>
                  <Button
                    className="w-full h-10 mt-2 font-bold"
                    onClick={handlePaymentSubmit}
                  >
                    Xác nhận thanh toán công nợ
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* 🛠️ BỘ LỌC KHOẢNG THỜI GIAN ĐA NĂNG HÀNG ĐẦU */}
      <div className="bg-muted/30 border p-4 rounded-xl space-y-3 shadow-sm mt-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              type="date"
              className="h-10 bg-background text-sm max-w-[160px]"
              value={startDate}
              onChange={(e) => {
                setPoSearchQuery(""); // Xóa highlight PO cũ khi đổi bộ lọc thời gian
                setStartDate(e.target.value);
              }}
            />
            <span className="text-xs font-bold text-muted-foreground shrink-0">
              đến
            </span>
            <Input
              type="date"
              className="h-10 bg-background text-sm max-w-[160px]"
              value={endDate}
              onChange={(e) => {
                setPoSearchQuery(""); // Xóa highlight PO cũ khi đổi bộ lọc thời gian
                setEndDate(e.target.value);
              }}
            />
            {(startDate || endDate || poSearchQuery) && (
              <Button
                variant="ghost"
                className="text-xs font-semibold h-8 text-rose-500 hover:bg-rose-50 px-2 rounded-lg"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  setPoSearchQuery("");
                }}
              >
                Xóa lọc ✕
              </Button>
            )}
          </div>

          {/* Hiển thị dòng trạng thái nếu đang ở chế độ Highlight do Click mã PO từ Tab Sổ cái */}
          {poSearchQuery && (
            <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg animate-pulse">
              🔍 Đang lọc xem riêng biệt chứng từ: <b>{poSearchQuery}</b>
            </span>
          )}
        </div>
      </div>

      {/* KHU VỰC BẢNG LỊCH SỬ ĐA NĂNG ĐÃ ĐỒNG BỘ DỮ LIỆU THẬT */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full mt-4"
      >
        <TabsList className="grid w-full max-w-[400px] grid-cols-2 h-10 bg-muted/60 p-1 rounded-xl">
          <TabsTrigger
            value="debt_ledger"
            className="text-xs font-bold rounded-lg transition-all"
          >
            📜 Lịch sử công nợ
          </TabsTrigger>
          <TabsTrigger
            value="purchase_orders"
            className="text-xs font-bold rounded-lg transition-all"
          >
            📦 Lịch sử nhập kho
          </TabsTrigger>
        </TabsList>
        {/* TAB 1: SỔ CÁI BIẾN ĐỘNG CÔNG NỢ CHI TIẾT */}
        <TabsContent value="debt_ledger" className="mt-4">
          <Card className="rounded-xl overflow-hidden shadow-sm">
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/60 text-muted-foreground font-semibold border-b">
                  <tr>
                    <th className="px-4 py-3.5">Ngày phát sinh</th>
                    <th className="px-4 py-3.5">Loại giao dịch</th>
                    <th className="px-4 py-3.5 text-right">Số tiền</th>
                    <th className="px-4 py-3.5 text-right">
                      Dư nợ sau giao dịch
                    </th>
                    <th className="px-4 py-3.5 pl-6">Nội dung / Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-muted-foreground font-medium">
                  {filteredLedger.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-10 text-muted-foreground text-sm"
                      >
                        Không tìm thấy bản ghi biến động công nợ nào trong
                        khoảng thời gian đã chọn.
                      </td>
                    </tr>
                  ) : (
                    filteredLedger.map((row) => {
                      const hasPoLink =
                        row.note && /(PO-\d+|NK-\d+)/i.test(row.note);

                      return (
                        <tr
                          key={row.id}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-4 text-xs text-muted-foreground">
                            {new Date(row.created_at).toLocaleString("vi-VN")}
                          </td>
                          <td className="px-4 py-4">
                            {row.transaction_type === "PURCHASE_DEBT" ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-600">
                                ➔ Phát sinh nợ mới
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                                ✓ Thanh toán trả nợ
                              </span>
                            )}
                          </td>
                          <td
                            className={`px-4 py-4 text-right font-bold ${row.transaction_type === "PURCHASE_DEBT" ? "text-orange-600" : "text-emerald-600"}`}
                          >
                            {row.transaction_type === "PURCHASE_DEBT"
                              ? "+"
                              : "-"}
                            {formatVND(row.amount)}
                          </td>
                          <td className="px-4 py-4 text-right font-black text-foreground">
                            {formatVND(row.balance_after)}
                          </td>
                          <td className="px-4 py-4 pl-6 text-xs text-foreground font-normal max-w-[400px]">
                            {hasPoLink ? (
                              <span>
                                {row.note
                                  ?.split(/(PO-\d+|NK-\d+)/i)
                                  .map((part, index) => {
                                    const isPoCode = /(PO-\d+|NK-\d+)/i.test(
                                      part,
                                    );
                                    return isPoCode ? (
                                      <button
                                        key={index}
                                        type="button"
                                        className="font-bold text-primary hover:text-primary/80 underline cursor-pointer focus:outline-none px-0.5 mx-0.5"
                                        onClick={() =>
                                          handleLinkToPurchaseOrder(row.note)
                                        }
                                      >
                                        {part}
                                      </button>
                                    ) : (
                                      <span key={index}>{part}</span>
                                    );
                                  })}
                              </span>
                            ) : (
                              row.note || "---"
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: NHẬT KÝ TẤT CẢ PHIẾU NHẬP HÀNG CỦA ĐỐI TÁC NÀY */}
        <TabsContent value="purchase_orders" className="mt-4">
          <Card className="rounded-xl overflow-hidden shadow-sm">
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/60 text-muted-foreground font-semibold border-b">
                  <tr>
                    <th className="px-4 py-3.5">Mã chứng từ</th>
                    <th className="px-4 py-3.5">
                      <Calendar className="h-3 w-3 inline mr-1" /> Ngày lập
                      phiếu
                    </th>
                    <th className="px-4 py-3.5 text-right">Tổng tiền hàng</th>
                    <th className="px-4 py-3.5 text-center">
                      Trạng thái phiếu nợ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y text-muted-foreground font-medium">
                  {filteredPurchaseOrders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-center py-10 text-muted-foreground text-sm"
                      >
                        Không tìm thấy chứng từ nhập kho nào khớp với điều kiện
                        lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredPurchaseOrders.map((po) => {
                      const isHighlighted =
                        poSearchQuery &&
                        po.po_number.toLowerCase() ===
                          poSearchQuery.toLowerCase();

                      return (
                        <tr
                          key={po.id}
                          className={`transition-colors border-b ${
                            isHighlighted
                              ? "bg-amber-100/70 dark:bg-amber-950/40 font-bold hover:bg-amber-100/90"
                              : "hover:bg-muted/30"
                          }`}
                        >
                          <td className="px-4 py-4 font-mono font-bold text-primary">
                            <span className="flex items-center gap-1.5">
                              {po.po_number}
                              {isHighlighted && (
                                <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500 text-white animate-pulse">
                                  ĐỐI SOÁT
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-xs">
                            {new Date(po.created_at).toLocaleString("vi-VN")}
                          </td>
                          <td className="px-4 py-4 text-right font-bold text-foreground">
                            {formatVND(po.final_amount)}
                          </td>
                          <td className="px-4 py-4 text-center">
                            {po.status === "VOIDED" ||
                            po.payment_status === "VOIDED" ? (
                              <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded text-[10px] font-bold uppercase">
                                ✕ Đã hủy phiếu
                              </span>
                            ) : po.payment_status === "PAID" ? (
                              <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded text-[10px] font-bold uppercase">
                                ✓ Đã thanh toán xong
                              </span>
                            ) : po.payment_status === "PARTIAL" ? (
                              <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-bold uppercase">
                                ⏳ Trả một phần
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[10px] font-bold uppercase">
                                ⚠️ Chưa thanh toán
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
