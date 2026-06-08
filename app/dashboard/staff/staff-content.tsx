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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MoreVertical,
  UserPlus,
  Shield,
  Search,
  RefreshCw,
  Edit,
  CalendarCheck,
  Wallet,
  CheckCircle2,
  Users,
} from "lucide-react";

interface Profile {
  id: string;
  full_name: string;
  role: "manager" | "cashier" | "waiter" | "kitchen";
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  hourly_rate: number; // Bổ sung cột lương từ DB vào interface
}

interface StaffContentProps {
  profiles: Profile[];
}

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
    label: "Nhân viên bếp", // Sửa thuật ngữ từ "Nhà bếp" thành "Nhân viên bếp"
    className: "bg-amber-500 text-white hover:bg-amber-600",
  },
};

export function StaffContent({ profiles: initialProfiles }: StaffContentProps) {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Các state quản lý Dialog cũ
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<string>("waiter");

  // STATE MỚI: Quản lý sửa thông tin nhân viên
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editHourlyRate, setEditHourlyRate] = useState<number>(0);

  // STATE MỚI: Dữ liệu tạm phục vụ Tab Chấm công trực quan
  const [attendanceMock, setAttendanceMock] = useState<any[]>([]);

  useEffect(() => {
    setProfiles(initialProfiles);
    // Khởi tạo danh sách chấm công từ những nhân viên đang hoạt động
    setAttendanceMock(
      initialProfiles
        .filter((p) => p.is_active)
        .map((p) => ({
          id: p.id,
          full_name: p.full_name,
          role: p.role,
          status: "present", // present | late | absent
          late_minutes: 15,
          absent_type: "excused", // excused | unexcused
        })),
    );
  }, [initialProfiles]);

  const filteredProfiles = profiles.filter((p) => {
    const matchesSearch =
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.phone && p.phone.includes(searchQuery));
    const matchesRole = roleFilter === "all" || p.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && p.is_active === true) ||
      (statusFilter === "inactive" && p.is_active === false);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalStaff = profiles.length;
  const activeStaff = profiles.filter((p) => p.is_active).length;
  const inactiveStaff = totalStaff - activeStaff;

  // State form thêm mới
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addFullName, setAddFullName] = useState("");
  const [addRole, setAddRole] = useState<
    "manager" | "cashier" | "waiter" | "kitchen"
  >("waiter");
  const [addPhone, setAddPhone] = useState("");
  const [addHourlyRate, setAddHourlyRate] = useState<string>("0");

  // Hàm API cập nhật Chức vụ / Trạng thái tài khoản
  const handleUpdateStaff = async (profileId: string, payload: any) => {
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
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === profileId ? ({ ...p, ...payload } as Profile) : p,
        ),
      );
      setIsRoleDialogOpen(false);
      setIsStatusDialogOpen(false);
      setIsEditDialogOpen(false);
      router.refresh();
    } catch (error: any) {
      alert(`Lỗi: ${error.message}`);
    }
  };

  // Hàm API Sửa thông tin cá nhân (Tên, SĐT, Mức Lương)
  const handleEditStaff = async () => {
    if (!selectedProfile) return;
    if (!editFullName.trim()) {
      alert("Họ tên không được để trống!");
      return;
    }
    // Gọi hàm dùng chung cập nhật lên DB
    await handleUpdateStaff(selectedProfile.id, {
      full_name: editFullName,
      phone: editPhone || null,
      hourly_rate: Number(editHourlyRate),
    });
  };

  // Hàm API Tạo nhân viên mới
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
          hourly_rate: Number(addHourlyRate),
        }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Có lỗi xảy ra");
      }
      setIsAddDialogOpen(false);
      setTimeout(() => {
        setAddEmail("");
        setAddPassword("");
        setAddFullName("");
        setAddRole("waiter");
        setAddPhone("");
        setAddHourlyRate("0");
        router.refresh();
      }, 150);
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

      {/* Quy hoạch hệ thống 3 Tabs */}
      <Tabs defaultValue="members" className="w-full space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Thành viên
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <CalendarCheck className="h-4 w-4" /> Duyệt công
          </TabsTrigger>
          <TabsTrigger value="payroll" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" /> Bảng lương
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: DANH SÁCH THÀNH VIÊN */}
        <TabsContent value="members">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-border/60">
              <div>
                <CardTitle className="text-xl font-bold tracking-tight">
                  Danh sách thành viên
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Quản lý tài khoản, thông tin cơ bản, vị trí làm việc và lương
                  của nhân sự.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                {/* Nới rộng width ô tìm kiếm từ sm:w-64 lên sm:w-72 để chống tràn chữ */}
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm theo tên, SĐT..."
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
                    <SelectItem value="kitchen">Nhân viên bếp</SelectItem>
                  </SelectContent>
                </Select>

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
                      {/* BỔ SUNG: Thêm cột Mức lương/Giờ */}
                      <TableHead className="font-semibold text-foreground">
                        Mức lương/Giờ
                      </TableHead>
                      <TableHead className="font-semibold text-foreground">
                        Trạng thái
                      </TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProfiles.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
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
                          <TableCell>
                            {profile.phone || "Chưa cập nhật"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={roleConfig[profile.role]?.className}
                            >
                              {roleConfig[profile.role]?.label}
                            </Badge>
                          </TableCell>
                          {/* HIỂN THỊ: Cột lương định dạng VNĐ */}
                          <TableCell className="font-medium">
                            {(profile.hourly_rate || 0).toLocaleString("vi-VN")}{" "}
                            đ
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                profile.is_active ? "default" : "secondary"
                              }
                            >
                              {profile.is_active
                                ? "Đang hoạt động"
                                : "Tạm khóa"}
                            </Badge>
                          </TableCell>
                          {/* CĂN LỀ: Đẩy hẳn icon 3 chấm về góc phải */}
                          <TableCell className="pr-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 ml-auto block"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {/* BỔ SUNG: Nút Sửa thông tin nhân viên */}
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedProfile(profile);
                                    setEditFullName(profile.full_name);
                                    setEditPhone(profile.phone || "");
                                    setEditHourlyRate(profile.hourly_rate || 0);
                                    setIsEditDialogOpen(true);
                                  }}
                                >
                                  <Edit className="mr-2 h-4 w-4" /> Sửa thông
                                  tin
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedProfile(profile);
                                    setNewRole(profile.role);
                                    setIsRoleDialogOpen(true);
                                  }}
                                >
                                  <Shield className="mr-2 h-4 w-4" /> Đổi chức
                                  vụ
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
                                  {profile.is_active
                                    ? "Khóa tài khoản"
                                    : "Mở khóa"}
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
        </TabsContent>

        {/* TAB 2: DUYỆT CÔNG NGÀY HÔM NAY */}
        <TabsContent value="attendance">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-border/60">
              <div>
                <CardTitle className="text-xl font-bold tracking-tight flex items-center gap-2">
                  Duyệt công ngày trực
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Ghi nhận trạng thái đi làm, đi muộn hoặc vắng mặt của nhân sự
                  trong ca hôm nay.
                </p>
              </div>
              <Button className="bg-green-600 hover:bg-green-700 text-white font-medium shadow-sm">
                <CheckCircle2 className="h-4 w-4 mr-2" /> Chốt công ngày hôm nay
              </Button>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="rounded-md border border-border/60 overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="pl-4 font-semibold text-foreground">
                        Nhân viên
                      </TableHead>
                      <TableHead className="font-semibold text-foreground">
                        Chức vụ
                      </TableHead>
                      <TableHead className="font-semibold text-foreground w-[220px]">
                        Trạng thái
                      </TableHead>
                      <TableHead className="font-semibold text-foreground">
                        Chi tiết ghi chú
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceMock.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium pl-4">
                          {item.full_name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              roleConfig[item.role as keyof typeof roleConfig]
                                ?.className
                            }
                          >
                            {
                              roleConfig[item.role as keyof typeof roleConfig]
                                ?.label
                            }
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.status}
                            onValueChange={(val) => {
                              const updated = [...attendanceMock];
                              updated[index].status = val;
                              setAttendanceMock(updated);
                            }}
                          >
                            <SelectTrigger className="w-full h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="present">
                                🟢 Đúng giờ
                              </SelectItem>
                              <SelectItem value="late">🟡 Đi muộn</SelectItem>
                              <SelectItem value="absent">
                                🔴 Vắng mặt
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {item.status === "late" && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                Số phút muộn:
                              </span>
                              <Input
                                type="number"
                                className="w-20 h-8 text-sm"
                                value={item.late_minutes}
                                onChange={(e) => {
                                  const updated = [...attendanceMock];
                                  updated[index].late_minutes = Number(
                                    e.target.value,
                                  );
                                  setAttendanceMock(updated);
                                }}
                              />
                            </div>
                          )}
                          {item.status === "absent" && (
                            <Select
                              value={item.absent_type}
                              onValueChange={(val) => {
                                const updated = [...attendanceMock];
                                updated[index].absent_type = val;
                                setAttendanceMock(updated);
                              }}
                            >
                              <SelectTrigger className="w-[150px] h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="excused">
                                  Có đơn phép
                                </SelectItem>
                                <SelectItem value="unexcused">
                                  Không có phép
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          {item.status === "present" && (
                            <span className="text-xs text-green-600 font-medium">
                              Ghi nhận công đầy đủ
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: BẢNG LƯƠNG TỔNG HỢP */}
        <TabsContent value="payroll">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold tracking-tight">
                Bảng lương tổng hợp
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Hệ thống tự động tính: Lương = Tổng số giờ tích lũy (từ điểm
                danh) × Mức lương theo giờ.
              </p>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="rounded-md border border-border/60 overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="pl-4 font-semibold text-foreground">
                        Nhân viên
                      </TableHead>
                      <TableHead className="font-semibold text-foreground">
                        Mức lương/Giờ
                      </TableHead>
                      <TableHead className="font-semibold text-foreground">
                        Tổng giờ làm (Tháng này)
                      </TableHead>
                      <TableHead className="font-semibold text-foreground text-right pr-4">
                        Thành tiền tạm tính
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles
                      .filter((p) => p.is_active)
                      .map((p) => {
                        const mockTotalHours = 120; // Số giờ giả định phục vụ giao diện trực quan
                        const calculatedSalary =
                          (p.hourly_rate || 0) * mockTotalHours;
                        return (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium pl-4">
                              {p.full_name}
                            </TableCell>
                            <TableCell>
                              {(p.hourly_rate || 0).toLocaleString("vi-VN")} đ/h
                            </TableCell>
                            <TableCell className="font-semibold text-amber-600">
                              {mockTotalHours} giờ
                            </TableCell>
                            <TableCell className="text-right pr-4 font-bold text-green-600">
                              {calculatedSalary.toLocaleString("vi-VN")} đ
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ======================================================= */}
      {/* MODAL MỚI: FORM SỬA THÔNG TIN CÁ NHÂN & LƯƠNG GIỜ           */}
      {/* ======================================================= */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Cập nhật thông tin nhân viên
            </DialogTitle>
            <DialogDescription>
              Thay đổi thông tin cá nhân và khung lương cơ bản.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Họ và tên</label>
              <Input
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Số điện thoại</label>
              <Input
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="Chưa có SĐT"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Mức lương theo giờ (VNĐ)
              </label>
              <Input
                type="number"
                value={editHourlyRate}
                onChange={(e) => setEditHourlyRate(Number(e.target.value))}
                placeholder="Ví dụ: 25000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button onClick={handleEditStaff}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 1: THAY ĐỔI CHỨC VỤ */}
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
                <SelectItem value="kitchen">Nhân viên bếp (Kitchen)</SelectItem>
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

      {/* MODAL 2: KHÓA / MỞ TÀI KHOẢN */}
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

      {/* MODAL 3: FORM ĐIỀN THÔNG TIN THÊM NHÂN VIÊN MỚI */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Thêm nhân viên mới
            </DialogTitle>
            <DialogDescription>
              Tạo tài khoản hệ thống và thiết lập vị trí công việc ban đầu.
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
                    <SelectItem value="kitchen">Nhân viên bếp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Mức lương theo giờ (VNĐ)
              </label>
              <Input
                type="number"
                value={addHourlyRate}
                onChange={(e) => setAddHourlyRate(e.target.value)}
                placeholder="Ví dụ: 25000"
              />
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
