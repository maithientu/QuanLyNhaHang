// app/dashboard/staff/staff-content.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MoreVertical,
  UserPlus,
  Shield,
  User,
  Search,
  RefreshCw,
} from "lucide-react";

// Định nghĩa cấu trúc dữ liệu dựa trên bảng profiles của bạn
interface Profile {
  id: string;
  full_name: string;
  role: "manager" | "cashier" | "waiter" | "kitchen";
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

interface StaffContentProps {
  profiles: Profile[];
}

// Cấu hình nhãn màu sắc cho từng chức vụ
const roleConfig = {
  manager: {
    label: "Quản lý",
    className: "bg-red-500 text-white hover:bg-red-600",
  },
  cashier: {
    label: "Thu ngân",
    className: "bg-blue-500 text-white hover:bg-blue-600",
  },
  waiter: {
    label: "Phục vụ",
    className: "bg-green-500 text-white hover:bg-green-600",
  },
  kitchen: {
    label: "Nhà bếp",
    className: "bg-amber-500 text-white hover:bg-amber-600",
  },
};

export function StaffContent({ profiles: initialProfiles }: StaffContentProps) {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Quản lý trạng thái Dialog Sửa/Khóa
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<string>("waiter");

  useEffect(() => {
    setProfiles(initialProfiles);
  }, [initialProfiles]);

  // Logic tìm kiếm và lọc dữ liệu trên giao diện
  const filteredProfiles = profiles.filter((p) => {
    // Tầng 1: Lọc theo Tên hoặc Số điện thoại
    const matchesSearch =
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.phone && p.phone.includes(searchQuery));

    // Tầng 2: Lọc theo Chức vụ
    const matchesRole = roleFilter === "all" || p.role === roleFilter;

    // Tầng 3: Lọc theo Trạng thái tài khoản (Đang hoạt động / Tạm khóa)
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && p.is_active === true) ||
      (statusFilter === "inactive" && p.is_active === false);

    // Kết hợp đồng thời cả 3 điều kiện lọc
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Thống kê nhanh
  const totalStaff = profiles.length;
  const activeStaff = profiles.filter((p) => p.is_active).length;
  const inactiveStaff = totalStaff - activeStaff;

  // --- CÁC BIẾN STATE FORM THÊM NHÂN VIÊN---
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addFullName, setAddFullName] = useState("");
  const [addRole, setAddRole] = useState<
    "manager" | "cashier" | "waiter" | "kitchen"
  >("waiter");
  const [addPhone, setAddPhone] = useState("");
  // -----------------------------------------------------------

  // API Hành động: Cập nhật chức vụ hoặc trạng thái tài khoản
  const handleUpdateStaff = async (
    profileId: string,
    payload: { role?: string; is_active?: boolean },
  ) => {
    try {
      const response = await fetch(`/api/staff/${profileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Cập nhật thất bại");
      }

      // Cập nhật nhanh state tại client
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === profileId ? ({ ...p, ...payload } as Profile) : p,
        ),
      );

      setIsRoleDialogOpen(false);
      setIsStatusDialogOpen(false);
      router.refresh();
    } catch (error: any) {
      alert(`Lỗi: ${error.message}`);
    }
  };

  // --- HÀM XỬ LÝ API TẠO NHÂN VIÊN MỚI ---
  const handleCreateStaff = async () => {
    if (!addEmail.trim() || !addPassword.trim() || !addFullName.trim()) {
      alert("Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu!");
      return;
    }

    try {
      const response = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: addEmail,
          password: addPassword,
          full_name: addFullName,
          role: addRole,
          phone: addPhone || null,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Có lỗi xảy ra khi thêm nhân viên");
      }

      // Xóa trắng form, đóng cửa sổ và reload đồng bộ lại danh sách
      setIsAddDialogOpen(false);

      setTimeout(() => {
        setAddEmail("");
        setAddPassword("");
        setAddFullName("");
        setAddRole("waiter");
        setAddPhone("");

        router.refresh();
      }, 150); // Đợi animation đóng dialog hoàn thành

      router.refresh(); // Ép Server component fetch lại danh sách profiles mới tinh
    } catch (error: any) {
      alert(`Lỗi: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Thanh thống kê nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{totalStaff}</div>
            <div className="text-sm text-muted-foreground">Tổng nhân sự</div>
          </CardContent>
        </Card>
        <Card className="border-green-500">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {activeStaff}
            </div>
            <div className="text-sm text-muted-foreground">Đang hoạt động</div>
          </CardContent>
        </Card>
        <Card className="border-gray-300">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-500">
              {inactiveStaff}
            </div>
            <div className="text-sm text-muted-foreground">Tạm khóa</div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Bộ lọc dữ liệu */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-border/60">
          <div>
            <CardTitle className="text-xl font-bold tracking-tight">
              Danh sách thành viên
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Quản lý tài khoản, phân quyền chức vụ và trạng thái hoạt động của
              nhân sự.
            </p>
          </div>

          {/* Nhóm bộ lọc và nút thêm nhân viên */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm tên, số điện thoại..."
                className="pl-9 h-9 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[150px] h-9 text-sm">
                <SelectValue placeholder="Chức vụ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả chức vụ</SelectItem>
                <SelectItem value="manager">Quản lý</SelectItem>
                <SelectItem value="cashier">Thu ngân</SelectItem>
                <SelectItem value="waiter">Phục vụ</SelectItem>
                <SelectItem value="kitchen">Nhà bếp</SelectItem>
              </SelectContent>
            </Select>

            {/* Ô CHỌN TRẠNG THÁI HOẠT ĐỘNG */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px] h-9 text-sm">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="inactive">Tạm khóa</SelectItem>
              </SelectContent>
            </Select>

            {/* Nút Thêm nhân viên */}
            <Button
              size="sm"
              className="h-9 w-full sm:w-auto font-medium"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Thêm nhân viên
            </Button>
          </div>
        </CardHeader>

        {/* 3. Bảng danh sách hiển thị */}
        <CardContent className="p-4 md:p-6">
          <div className="rounded-md border border-border/60 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="pl-4 font-semibold text-foreground">
                    Họ và tên
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Số điện thoại
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Chức vụ
                  </TableHead>
                  <TableHead className="font-semibold text-foreground">
                    Trạng thái
                  </TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Không tìm thấy nhân viên phù hợp.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProfiles.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="font-medium pl-4">
                        {profile.full_name}
                      </TableCell>
                      <TableCell>{profile.phone || "Chưa cập nhật"}</TableCell>
                      <TableCell>
                        <Badge className={roleConfig[profile.role]?.className}>
                          {roleConfig[profile.role]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={profile.is_active ? "default" : "secondary"}
                        >
                          {profile.is_active ? "Đang hoạt động" : "Tạm khóa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedProfile(profile);
                                setNewRole(profile.role);
                                setIsRoleDialogOpen(true);
                              }}
                            >
                              <Shield className="mr-2 h-4 w-4" /> Đổi chức vụ
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className={
                                profile.is_active
                                  ? "text-amber-600"
                                  : "text-green-600"
                              }
                              onClick={() => {
                                setSelectedProfile(profile);
                                setIsStatusDialogOpen(true);
                              }}
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />{" "}
                              {profile.is_active ? "Khóa tài khoản" : "Mở khóa"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ======================================================= */}
      {/* MODAL 1: THAY ĐỔI CHỨC VỤ (ĐÃ TÁCH BIỆT CHUẨN)             */}
      {/* ======================================================= */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Phân quyền chức vụ</DialogTitle>
            <DialogDescription>
              Thay đổi quyền hạn cho{" "}
              <strong>{selectedProfile?.full_name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn chức vụ mới" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manager">Quản lý (Manager)</SelectItem>
                <SelectItem value="cashier">Thu ngân (Cashier)</SelectItem>
                <SelectItem value="waiter">Phục vụ (Waiter)</SelectItem>
                <SelectItem value="kitchen">Nhà bếp (Kitchen)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRoleDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={() =>
                selectedProfile &&
                handleUpdateStaff(selectedProfile.id, { role: newRole })
              }
            >
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================= */}
      {/* MODAL 2: KHÓA / MỞ TÀI KHOẢN (ĐẠT CHUẨN ĐÚNG THẺ ĐÓNG)     */}
      {/* ======================================================= */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {selectedProfile?.is_active
                ? "Khóa tài khoản"
                : "Mở khóa tài khoản"}
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn{" "}
              {selectedProfile?.is_active
                ? "tạm khóa quyền truy cập của"
                : "kích hoạt lại tài khoản cho"}{" "}
              <strong>{selectedProfile?.full_name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsStatusDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant={selectedProfile?.is_active ? "destructive" : "default"}
              onClick={() =>
                selectedProfile &&
                handleUpdateStaff(selectedProfile.id, {
                  is_active: !selectedProfile.is_active,
                })
              }
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================= */}
      {/* MODAL 3: FORM ĐIỀN THÔNG TIN THÊM NHÂN VIÊN MỚI           */}
      {/* ======================================================= */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Thêm nhân viên mới
            </DialogTitle>
            <DialogDescription>
              Tạo tài khoản đăng nhập hệ thống và phân quyền vị trí làm việc cho
              nhân sự.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Họ và tên nhân viên <span className="text-red-500">*</span>
              </label>
              <Input
                value={addFullName}
                onChange={(e) => setAddFullName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn A"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Email đăng nhập <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="nhanvien@tennhahang.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Mật khẩu tài khoản <span className="text-red-500">*</span>
              </label>
              <Input
                type="password"
                value={addPassword}
                onChange={(e) => setAddPassword(e.target.value)}
                placeholder="Nhập tối thiểu 6 ký tự"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Số điện thoại</label>
                <Input
                  value={addPhone}
                  onChange={(e) => setAddPhone(e.target.value)}
                  placeholder="0912xxxxxx"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  Vị trí làm việc <span className="text-red-500">*</span>
                </label>
                <Select
                  value={addRole}
                  onValueChange={(value: any) => setAddRole(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn vị trí" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Quản lý</SelectItem>
                    <SelectItem value="cashier">Thu ngân</SelectItem>
                    <SelectItem value="waiter">Phục vụ</SelectItem>
                    <SelectItem value="kitchen">Nhà bếp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleCreateStaff}
              disabled={
                !addFullName.trim() ||
                !addEmail.trim() ||
                addPassword.length < 6
              }
            >
              Tạo nhân viên
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
