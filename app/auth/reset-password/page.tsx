// app/auth/reset-password/page.tsx
"use client";
import { createBrowserClient } from "@supabase/ssr";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      alert("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);
    if (error) {
      alert("Lỗi: " + error.message);
    } else {
      alert("Đổi mật khẩu thành công!");
      router.push("/auth/login"); // Thành công thì đẩy về trang đăng nhập
    }
  };

  // --- ĐÂY LÀ PHẦN GIAO DIỆN HIỂN THỊ CÒN THIẾU CỦA BẠN ---
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-sm">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-amber-700">
            Đặt Lại Mật Khẩu
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            Nhập mật khẩu mới
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Vui lòng nhập mật khẩu mới bảo mật hơn để truy cập hệ thống.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleUpdatePassword}>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Mật khẩu mới
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 sm:text-sm"
              placeholder="Mật khẩu ít nhất 6 ký tự"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 disabled:opacity-50"
            >
              {loading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
