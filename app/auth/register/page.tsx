"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormEvent, useEffect, useState } from "react"

const roles = [
  { label: "Quản lý", value: "manager" },
  { label: "Thu ngân", value: "cashier" },
  { label: "Phục vụ", value: "waiter" },
  { label: "Bếp", value: "kitchen" },
]

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState("cashier")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isManager, setIsManager] = useState<boolean | null>(null)
  const [meError, setMeError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMe() {
      try {
        const response = await fetch("/api/auth/me")
        if (!response.ok) {
          const result = await response.json()
          setMeError(result.error || "Bạn cần đăng nhập để truy cập chức năng này.")
          setIsManager(false)
          return
        }

        const result = await response.json()
        setIsManager(result.user?.role === "manager")
      } catch (error) {
        setMeError("Lỗi khi kiểm tra quyền. Vui lòng thử lại.")
        setIsManager(false)
      }
    }

    fetchMe()
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        full_name: fullName,
        email,
        password,
        phone,
        role,
      }),
    })

    const result = await response.json()
    setLoading(false)

    if (!response.ok) {
      setError(result.error ?? "Lỗi đăng ký. Vui lòng thử lại.")
      return
    }

    router.push("/auth/login")
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900 sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40 sm:p-12">
        <div className="space-y-3 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-amber-700">Tạo tài khoản nhân viên</p>
          <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">Đăng ký truy cập hệ thống</h1>
          <p className="mx-auto max-w-2xl text-base leading-7 text-slate-600">
            Chức năng này chỉ dành cho quản lý. Đăng nhập bằng tài khoản quản lý để tạo tài khoản nhân viên mới.
          </p>
        </div>

        {isManager === null ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
            Đang kiểm tra quyền của bạn...
          </div>
        ) : isManager ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Họ tên
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                  placeholder="Tên đầy đủ"
                  className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="name@example.com"
                  className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Số điện thoại
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="0123 456 789"
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
                  minLength={8}
                  placeholder="Mật khẩu ít nhất 8 ký tự"
                  className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
                />
              </label>
            </div>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              Vai trò nhân viên
              <select
                value={role}
                onChange={(event) => setRole(event.target.value)}
                className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-200"
              >
                {roles.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

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
              {loading ? "Đang đăng ký..." : "Đăng ký tài khoản"}
            </button>
          </form>
        ) : (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            <p className="font-semibold">Chỉ quản lý mới được tạo tài khoản nhân viên.</p>
            <p className="mt-2">Vui lòng đăng nhập bằng tài khoản quản lý trước khi sử dụng chức năng này.</p>
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
          <p className="font-medium text-slate-900">Lưu ý</p>
          <p className="mt-2">
            Tài khoản được lưu trong hệ thống Supabase. Mật khẩu được mã hóa, hệ thống sẽ quản lý phiên đăng nhập an toàn.
          </p>
          <p className="mt-2">
            Nếu bạn đã có tài khoản, hãy <Link href="/auth/login" className="font-semibold text-amber-700 hover:text-amber-900">đăng nhập tại đây</Link>.
          </p>
        </div>
      </div>
    </main>
  )
}
