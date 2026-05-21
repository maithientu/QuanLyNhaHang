"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        remember,
      }),
    })

    const result = await response.json()
    setLoading(false)

    if (!response.ok) {
      setError(result.error ?? "Lỗi đăng nhập. Vui lòng thử lại.")
      return
    }

    router.push("/dashboard")
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900 sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40 sm:p-12">
        <div className="space-y-3 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-amber-700">Đăng nhập nhân viên</p>
          <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Đăng nhập vào hệ thống quản lý</h1>
          <p className="mx-auto max-w-2xl text-base leading-7 text-slate-600">
            Nhập email và mật khẩu để truy cập dashboard nhân viên. Nếu chưa có tài khoản, bạn có thể đăng ký mới.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                placeholder="name@example.com"
                className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Mật khẩu
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
                placeholder="Mật khẩu của bạn"
                className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
              />
            </label>
          </div>

          <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
              />
              Giữ đăng nhập
            </label>
            <Link href="/auth/register" className="font-semibold text-amber-700 hover:text-amber-900">
              Tạo tài khoản mới
            </Link>
          </div>

          {error ? (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-3xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
          <p className="font-medium text-slate-900">Lưu ý bảo mật</p>
          <p className="mt-2">
            Tài khoản nhân viên được lưu trong hệ thống Supabase. Mật khẩu mã hóa và phiên làm việc được quản lý tự động.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
          <p className="font-medium text-slate-900">Chức năng đăng nhập mẫu</p>
          <p className="mt-2">Email thử nghiệm: <span className="font-semibold">demo@restaurant.com</span></p>
          <p>Mật khẩu thử: <span className="font-semibold">Demo1234!</span></p>
        </div>
      </div>
    </main>
  )
}
