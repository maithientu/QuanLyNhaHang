// app/auth/forgot-password/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      // Gọi lên API Route xử lý ở File 2 bên dưới
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Đã có lỗi xảy ra");
      }

      setMessage(data.message || "Vui lòng kiểm tra email của bạn!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-sm">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-amber-700">
            Khôi Phục Mật Khẩu
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            Quên mật khẩu?
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-xl bg-green-50 p-4 text-sm text-green-600">
              {message}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Địa chỉ Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 sm:text-sm"
              placeholder="name@example.com"
            />
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {loading ? "Đang gửi yêu cầu..." : "Gửi liên kết xác nhận"}
            </button>

            <div className="text-center">
              <Link
                href="/auth/login"
                className="text-sm font-medium text-amber-700 hover:text-amber-900"
              >
                Quay lại đăng nhập
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
