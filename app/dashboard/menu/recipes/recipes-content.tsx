"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Trash,
  Utensils,
  Scale,
  Save,
  Layers,
  Search,
  DollarSign,
  Percent,
  ChefHat,
  Eye,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils"; // Hàm hỗ trợ gộp class của shadcn
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MenuItem, Ingredient } from "@/lib/types/database";

// Định nghĩa kiểu dữ liệu cho form động tại Client, khớp với cấu trúc bảng Recipe
interface RecipeRow {
  ingredient_id: string;
  quantity_required: string; // Hàm lượng nhập (Ví dụ: 150g, 1 quả, 1 suất)
  uom_selected: string; // Đơn vị đo lường phụ dụng (g, ml, quả, suất)
  note: string; // Hướng dẫn sơ chế nhanh cho bếp
}

export function RecipesContent({
  menuItems,
  ingredients,
}: {
  menuItems: MenuItem[];
  ingredients: Ingredient[];
}) {
  const router = useRouter();

  // State quản lý món ăn đang được chọn để định lượng giá cốt
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(
    menuItems[0] || null,
  );

  // State quản lý thanh tìm kiếm nhanh thực đơn ăn uống
  const [menuSearchQuery, setMenuSearchQuery] = useState("");

  // Các trường vận hành bổ trợ bếp (Ghi chú quy trình & dụng cụ quy chuẩn)
  const [cookingSteps, setCookingSteps] = useState("");
  const [standardUtensil, setStandardUtensil] = useState("");

  // Cải tiến: Quản lý chi phí ẩn bao bì đóng gói mang về (Gom nhóm chi phí phụ)
  const [packagingCost, setPackagingCost] = useState("0");

  // State quản lý danh sách nguyên liệu rút gọn (Cấu trúc thẻ dọc thoáng đãng)
  const [recipeRows, setRecipeRows] = useState<RecipeRow[]>([
    { ingredient_id: "", quantity_required: "", uom_selected: "g", note: "" },
  ]);

  // Định dạng tiền tệ VND chuyên nghiệp
  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(num);
  };

  // Thanh lọc danh sách thực đơn theo từ khóa tìm kiếm nhanh
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(
      (item) =>
        item.name.toLowerCase().includes(menuSearchQuery.toLowerCase()) ||
        (item.id &&
          item.id.toLowerCase().includes(menuSearchQuery.toLowerCase())),
    );
  }, [menuItems, menuSearchQuery]);

  // 📊 TỰ ĐỘNG HẠCH TOÁN CHỈ SỐ FOOD COST THEO NGUYÊN LÝ "TỐI GIẢN GIA VỊ - CHI TIẾT CỐT LÕI"
  const financialMetrics = useMemo(() => {
    if (!selectedMenuItem)
      return {
        totalCost: 0,
        costPercent: 0,
        grossMargin: 0,
        alertColor: "text-muted-foreground",
        bgColor: "bg-muted",
      };

    const costRowTotal = recipeRows.reduce((sum, row) => {
      const ing = ingredients.find((i) => i.id === row.ingredient_id);
      if (!ing) return sum;

      const qty = Number(row.quantity_required) || 0;

      // Giả lập giá nguyên liệu theo dữ liệu hệ thống (nếu chưa có giá mua, mặc định tính toán mồi)
      const basePrice = (ing as any).last_purchase_price || 25000;

      // Nếu đơn vị phụ dụng là g hoặc ml, chia cho 1000 vì giá kho lưu theo đơn vị Kg/Lít gốc
      if (row.uom_selected === "g" || row.uom_selected === "ml") {
        return sum + qty * (basePrice / 1000);
      }

      // Nếu đơn vị tính là Quả, cái hoặc Suất gia vị nền, nhân trực tiếp đơn giá gốc
      return sum + qty * basePrice;
    }, 0);

    // Tổng chi phí = Tiền nguyên liệu + Chi phí bao bì hộp xốp tặng kèm
    const totalCost = costRowTotal + (Number(packagingCost) || 0);
    const menuPrice = selectedMenuItem.price || 0;

    const costPercent = menuPrice > 0 ? (totalCost / menuPrice) * 100 : 0;
    const grossMargin = menuPrice - totalCost;

    // Phân loại màu sắc cảnh báo biên lợi nhuận (Xanh <30%, Vàng 30-35%, Đỏ >35%)
    let alertColor = "text-emerald-600 dark:text-emerald-400";
    let bgColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (costPercent > 30 && costPercent <= 35) {
      alertColor = "text-amber-600 dark:text-amber-400";
      bgColor = "bg-amber-50 text-amber-700 border-amber-200";
    } else if (costPercent > 35) {
      alertColor = "text-rose-600 dark:text-rose-400";
      bgColor = "bg-rose-50 text-rose-700 border-rose-200";
    }

    return { totalCost, costPercent, grossMargin, alertColor, bgColor };
  }, [recipeRows, ingredients, selectedMenuItem, packagingCost]);

  const handleAddRow = () => {
    setRecipeRows([
      ...recipeRows,
      { ingredient_id: "", quantity_required: "", uom_selected: "g", note: "" },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    if (recipeRows.length === 1) {
      setRecipeRows([
        {
          ingredient_id: "",
          quantity_required: "",
          uom_selected: "g",
          note: "",
        },
      ]);
      return;
    }
    setRecipeRows(recipeRows.filter((_, i) => i !== index));
  };

  // Nghiệp vụ: Tự động nhận diện nguyên liệu để gán đơn vị đo phù hợp (Trứng -> Quả, Gia vị -> Suất)
  const handleIngredientChange = (index: number, ingId: string) => {
    const found = ingredients.find((i) => i.id === ingId);
    let defaultUom = found?.base_uom || "g";

    if (found) {
      const nameLower = found.name.toLowerCase();
      if (nameLower.includes("trứng")) defaultUom = "quả";
      else if (nameLower.includes("gia vị") || nameLower.includes("sốt nền"))
        defaultUom = "suất";
    }

    const updated = [...recipeRows];
    updated[index] = {
      ...updated[index],
      ingredient_id: ingId,
      uom_selected: defaultUom,
    };
    setRecipeRows(updated);
  };

  const handleUpdateRowFields = (index: number, fields: Partial<RecipeRow>) => {
    const updated = [...recipeRows];
    updated[index] = { ...updated[index], ...fields };
    setRecipeRows(updated);
  };

  const handleSaveRecipe = async () => {
    if (!selectedMenuItem) return;

    const hasInvalidRow = recipeRows.some(
      (row) => !row.ingredient_id || !row.quantity_required,
    );
    if (hasInvalidRow) {
      alert("Vui lòng cấu hình đầy đủ nguyên liệu kho và định mức tiêu hao!");
      return;
    }

    try {
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          menu_item_id: selectedMenuItem.id,
          cost_price: financialMetrics.totalCost, // Gửi tổng giá vốn để cập nhật vào trường cost_price của MenuItem
          recipes: recipeRows.map((row) => ({
            ingredient_id: row.ingredient_id,
            quantity_required: Number(row.quantity_required), // Ép kiểu số thực thi theo đúng interface Recipe
            note: row.note || null,
          })),
        }),
      });

      const result = await response.json();
      if (response.ok && result.success) {
        alert(
          `Đã lưu thành công định lượng tinh gọn cho món: ${selectedMenuItem.name}`,
        );
        router.refresh();
      } else {
        alert(`Lỗi: ${result.error || "Không thể lưu dữ liệu."}`);
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi kết nối API định lượng.");
    }
  };

  // 🌟 HÀM FETCH DỮ LIỆU ĐỊNH LƯỢNG TỪ BACKEND
  const fetchRecipeDetail = async (menuItemId: string) => {
    try {
      const response = await fetch(`/api/recipes?menu_item_id=${menuItemId}`);
      const result = await response.json();

      if (response.ok && result.success && result.recipes.length > 0) {
        // Nếu món đã có công thức cũ, nạp thẳng mảng dữ liệu vào form
        const mappedRows = result.recipes.map((row: any) => ({
          ingredient_id: row.ingredient_id,
          quantity_required: String(row.quantity_required),
          uom_selected: row.base_uom || "g",
          note: row.note || "",
        }));
        setRecipeRows(mappedRows);
      } else {
        // Nếu món mới hoàn toàn chưa có công thức, reset trắng form 30 giây để nhập mới
        setRecipeRows([
          {
            ingredient_id: "",
            quantity_required: "",
            uom_selected: "g",
            note: "",
          },
        ]);
      }
    } catch (error) {
      console.error("Lỗi tự động nạp công thức món ăn:", error);
      // Khi lỗi mạng, đưa form về trạng thái an toàn trống
      setRecipeRows([
        {
          ingredient_id: "",
          quantity_required: "",
          uom_selected: "g",
          note: "",
        },
      ]);
    }
  };

  // 🌟 TỰ ĐỘNG GỌI API KHI NGƯỜI DÙNG CLICK ĐỔI MÓN Ở DANH SÁCH BÊN TRÁI
  const React = require("react"); // Đảm bảo tệp đã import useEffect, hoặc dùng trực tiếp:

  useEffect(() => {
    if (selectedMenuItem?.id) {
      fetchRecipeDetail(selectedMenuItem.id);
    }
  }, [selectedMenuItem?.id]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
      {/* 🍔 CỘT TRÁI: TRA CỨU THỰC ĐƠN NHÀ HÀNG (Tích hợp Search bar và thanh cuộn mượt) */}
      <div className="lg:col-span-3 space-y-3 bg-muted/10 p-3 rounded-xl border text-left">
        <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 px-1">
          <Utensils className="h-3.5 w-3.5 text-primary" /> Thực đơn nhà hàng
        </h3>

        {/* Thanh tìm kiếm nhanh món ăn */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm nhanh món ăn..."
            className="pl-9 h-10 bg-background text-sm"
            value={menuSearchQuery}
            onChange={(e) => setMenuSearchQuery(e.target.value)}
          />
        </div>

        {/* Danh sách món ăn có Scrollbar độc lập, không sợ tràn trang */}
        <div className="flex flex-col gap-1 max-h-[70vh] overflow-y-auto pr-1">
          {filteredMenuItems.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground font-medium">
              Không tìm thấy món ăn nào.
            </div>
          ) : (
            filteredMenuItems.map((item) => (
              <Button
                key={item.id}
                type="button"
                variant={selectedMenuItem?.id === item.id ? "default" : "ghost"}
                className="justify-start font-medium text-left h-14 gap-3 w-full border border-transparent transition-all rounded-lg py-2"
                onClick={() => {
                  setSelectedMenuItem(item);
                  setRecipeRows([
                    {
                      ingredient_id: "",
                      quantity_required: "",
                      uom_selected: "g",
                      note: "",
                    },
                  ]);
                }}
              >
                <div className="bg-background/20 h-8 w-8 rounded-md flex items-center justify-center text-base shrink-0 border shadow-sm">
                  🍲
                </div>
                <div className="truncate flex-1 min-w-0">
                  <p className="font-bold text-xs leading-none mb-1 truncate">
                    {item.name}
                  </p>
                  <p className="text-[11px] opacity-80 font-medium">
                    Giá bán: {new Intl.NumberFormat("vi-VN").format(item.price)}
                    đ
                  </p>
                </div>
              </Button>
            ))
          )}
        </div>
      </div>

      {/* ⚖️ KHU VỰC PHẢI: CHI TIẾT ĐỊNH LƯỢNG MÓN ĂN (Chiếm 9/12 cột rộng rãi) */}
      <div className="lg:col-span-9 space-y-5 w-full text-left">
        <div className="flex flex-wrap md:flex-nowrap justify-between items-center border-b pb-3 gap-3 text-left">
          <div className="text-left">
            <h3 className="text-xl font-black tracking-tight text-primary flex items-center gap-2 text-left">
              <Scale className="h-5 w-5 text-primary" /> Định lượng:{" "}
              {selectedMenuItem?.name || "Chưa chọn món"}
            </h3>
            <p className="text-xs font-medium text-muted-foreground mt-0.5 text-left">
              Thiết lập tinh gọn giúp kiểm soát chính xác 95% hao hụt kho mà
              không rườm rà gây nản lòng.
            </p>
          </div>
          <Button
            className="h-11 px-5 font-bold gap-2 shadow-md rounded-xl w-full md:w-auto shrink-0"
            onClick={handleSaveRecipe}
          >
            <Save className="h-4 w-4" /> Lưu công thức món ăn
          </Button>
        </div>

        {/* 📊 BẢNG THEO DÕI GIÁ VỐN & CHI PHÍ FOOD COST AN TOÀN TRÊN UI */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
          <Card className="rounded-xl shadow-sm border border-border/80 bg-background text-left">
            <CardContent className="p-4 space-y-1 text-left">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 text-left">
                <DollarSign className="h-3 w-3 text-blue-500" /> Giá vốn
                (Cost_Price)
              </span>
              <p className="text-lg font-black text-foreground text-left">
                {formatVND(financialMetrics.totalCost)}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-xl shadow-sm border border-border/80 bg-background text-left">
            <CardContent className="p-4 space-y-1 text-left">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 text-left">
                <Utensils className="h-3 w-3 text-orange-500" /> Giá bán thực
                đơn
              </span>
              <p className="text-lg font-black text-foreground text-left">
                {formatVND(selectedMenuItem?.price || 0)}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-xl shadow-sm border border-border/80 bg-background text-left">
            <CardContent className="p-4 space-y-1 text-left">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 text-left">
                <Percent className="h-3 w-3 text-indigo-500" /> Tỷ lệ % Food
                Cost
              </span>
              <div className="flex items-center gap-2 text-left">
                <p
                  className={`text-lg font-black text-left ${financialMetrics.alertColor}`}
                >
                  {financialMetrics.costPercent.toFixed(1)}%
                </p>
                <span
                  className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border text-left ${financialMetrics.bgColor}`}
                >
                  {financialMetrics.costPercent <= 30
                    ? "🟢 An toàn"
                    : financialMetrics.costPercent <= 35
                      ? "🟡 Cảnh báo"
                      : "🔴 Nguy hiểm"}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl shadow-sm border border-border/80 bg-background text-left">
            <CardContent className="p-4 space-y-1 text-left">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 text-left">
                <DollarSign className="h-3 w-3 text-emerald-500" /> Lời gộp thực
                tế
              </span>
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 text-left">
                {formatVND(financialMetrics.grossMargin)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* THÀNH PHẦN ĐỊNH LƯỢNG CHI TIẾT */}
        <div className="space-y-4 text-left">
          <div className="flex justify-between items-center border-b pb-1 text-left">
            <h4 className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider text-left">
              Thành phần cốt lõi & Suất gia vị nền gom nhóm
            </h4>
          </div>

          <div className="space-y-4 text-left">
            {recipeRows.map((row, index) => {
              const currentIng = ingredients.find(
                (i) => i.id === row.ingredient_id,
              );

              // Cải tiến 1: Tự động điều xuất danh sách Đơn vị phụ dụng linh hoạt theo nguyên liệu kho
              const availableUoms = currentIng
                ? [currentIng.base_uom, "g", "ml", "quả", "suất"].filter(
                    (v, i, a) => a.indexOf(v) === i,
                  )
                : ["g", "ml", "quả", "suất"];

              const basePrice =
                (currentIng as any)?.last_purchase_price || 25000;
              const rowCost = currentIng
                ? (Number(row.quantity_required) || 0) *
                  (row.uom_selected === "g" || row.uom_selected === "ml"
                    ? basePrice / 1000
                    : basePrice)
                : 0;

              return (
                <div
                  key={index}
                  className="block p-5 bg-background border border-border rounded-xl shadow-sm transition-all hover:border-primary/40 text-left"
                >
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-dashed text-left">
                    <span className="text-xs font-black text-foreground bg-muted px-2.5 py-1 rounded-md uppercase text-left">
                      Nguyên liệu cấu thành #{index + 1}
                    </span>
                    <Button
                      size="sm"
                      type="button"
                      variant="ghost"
                      className="h-8 gap-1 text-rose-500 hover:bg-rose-50 font-bold text-xs px-2.5 rounded-lg"
                      onClick={() => handleRemoveRow(index)}
                    >
                      <Trash className="h-3.5 w-3.5" /> Xóa dòng
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                    {/* Ô 1: Chọn nguyên liệu liên kết danh mục kho */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block text-left">
                        Chọn nguyên liệu kho / Gia vị nền *
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "h-11 text-sm font-semibold rounded-xl border-slate-200 bg-slate-50/50 justify-between w-full px-3 text-left font-normal",
                              !row.ingredient_id && "text-muted-foreground"
                            )}
                          >
                            {row.ingredient_id
                              ? ingredients.find((i) => i.id === row.ingredient_id)?.name
                              : "Gõ hoặc bấm để chọn nguyên liệu..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl shadow-lg" align="start">
                          <Command className="rounded-xl">
                            {/* Ô nhập chữ để tra cứu nhanh */}
                            <CommandInput placeholder="Nhập tên nguyên liệu cần tìm..." className="h-10 text-sm" />
                            <CommandList className="max-h-[250px] custom-scrollbar">
                              <CommandEmpty className="py-3 text-center text-xs text-slate-400 font-medium">
                                Không tìm thấy nguyên liệu nào.
                              </CommandEmpty>
                              <CommandGroup>
                                {ingredients.map((i) => (
                                  <CommandItem
                                    key={i.id}
                                    value={i.name} // Dữ liệu dùng để lọc khi gõ chữ
                                    className="text-sm py-2 cursor-pointer rounded-lg"
                                    onSelect={() => {
                                      // Kích hoạt hàm xử lý đổi nguyên liệu y hệt logic cũ của bạn
                                      handleIngredientChange(index, i.id);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4 text-amber-600",
                                        row.ingredient_id === i.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <span className="font-medium text-slate-800">
                                      {i.name} {i.code ? `(${i.code})` : ""}
                                    </span>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Ô 2: Nhập hàm lượng thô định mức tiêu hao */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block text-left">
                        Hàm lượng định mức tiêu hao
                      </label>
                      <Input
                        className="h-11 text-sm font-bold bg-background text-right w-full"
                        type="number"
                        min="0"
                        step="any"
                        placeholder="Ví dụ: 150, 1, 2..."
                        value={row.quantity_required}
                        onChange={(e) =>
                          handleUpdateRowFields(index, {
                            quantity_required: e.target.value,
                          })
                        }
                      />
                    </div>
                    {/* Ô 3: Dropdown Đơn vị tính lựa chọn phụ dụng linh động */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block text-left">
                        Đơn vị đo lường tính toán *
                      </label>
                      <Select
                        value={row.uom_selected}
                        onValueChange={(val) =>
                          handleUpdateRowFields(index, { uom_selected: val })
                        }
                      >
                        <SelectTrigger className="h-11 text-sm font-semibold w-full bg-background text-left">
                          <SelectValue placeholder="Chọn đơn vị tính..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableUoms.map((uom) => (
                            <SelectItem
                              key={uom}
                              value={uom}
                              className="text-sm py-2"
                            >
                              {uom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Giá vốn tiền nguyên liệu tự động hạch toán đối soát */}
                    <div className="col-span-1 md:col-span-3 h-11 flex items-center justify-between font-black text-xs text-foreground bg-primary/5 px-4 rounded-xl border border-primary/20 w-full mt-1">
                      <span className="font-medium text-muted-foreground">
                        Thành tiền tạm tính theo thời giá nhập:
                      </span>
                      <span className="text-sm font-black text-primary">
                        {formatVND(rowCost)}
                      </span>
                    </div>

                    {/* Ghi chú bếp tóm tắt */}
                    <div className="col-span-1 md:col-span-3 space-y-1.5 text-left">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block text-left">
                        Hướng dẫn chế biến & ghi chú bộ phận bếp
                      </label>
                      <Input
                        className="h-11 text-sm bg-background pl-3 text-left w-full"
                        placeholder="Ví dụ: Bỏ lõi thái hạt lựu, đong 1 muỗng tiêu chuẩn, bỏ lòng trắng trứng..."
                        value={row.note}
                        onChange={(e) =>
                          handleUpdateRowFields(index, { note: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Button
            variant="outline"
            type="button"
            className="w-full text-xs h-11 font-bold text-primary border-primary/30 hover:bg-primary/5 rounded-xl border-2 border-dashed gap-1.5"
            onClick={handleAddRow}
          >
            <Layers className="h-3.5 w-3.5" /> + Thêm thành phần cốt lõi / Suất
            gia vị nền mới
          </Button>
        </div>
        {/* 🛠️ PHẦN VẬN HÀNH BẾP & HẠCH TOÁN CHI PHÍ BAO BÌ ẨN */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 text-left">
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 text-left">
              <ChefHat className="h-3.5 w-3.5 text-primary" /> Dụng cụ ra món
              quy chuẩn của bếp
            </label>
            <Input
              className="h-11 text-sm bg-background pl-3 text-left w-full"
              placeholder="Ví dụ: Đĩa Oval sứ trắng sâu lòng, Ly lùn thủy tinh..."
              value={standardUtensil}
              onChange={(e) => setStandardUtensil(e.target.value)}
            />
          </div>

          <div className="space-y-1.5 text-left">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 text-left">
              <DollarSign className="h-3.5 w-3.5 text-orange-500" /> Chi phí ẩn
              bao bì hộp xốp mang đi (đ)
            </label>
            <Input
              className="h-11 text-sm font-bold bg-background text-right text-orange-600 w-full"
              type="number"
              min="0"
              placeholder="Tiền hộp, muỗng đũa nhựa mang về nếu có..."
              value={packagingCost}
              onChange={(e) => setPackagingCost(e.target.value)}
            />
          </div>

          <div className="space-y-1.5 md:col-span-2 text-left">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 text-left">
              <Eye className="h-3.5 w-3.5 text-indigo-500" /> Ghi chú tóm tắt
              quy trình thực hiện chế biến món ăn
            </label>
            <textarea
              className="w-full h-24 border rounded-xl p-3 text-sm bg-background placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-left"
              placeholder="Ghi ngắn gọn quy trình nấu cho đầu bếp dễ thuộc bài (Ví dụ: Bước 1 đun sữa tươi ấm với đường, Bước 2 đánh trứng đổ qua rây lọc, Bước 3 hấp cách thủy 20 phút lửa nhỏ...)"
              value={cookingSteps}
              onChange={(e) => setCookingSteps(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
