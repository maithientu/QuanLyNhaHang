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

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, remember }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Đăng nhập thất bại')
        setLoading(false)
        return
      }

      router.push('/dashboard')
    } catch (err) {
      setError('Lỗi kết nối. Vui lòng thử lại.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900 sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl sm:p-12">
        <div className="space-y-3 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-amber-700">Đăng nhập nhân viên</p>
          <h1 className="text-3xl font-semibold text-slate-900">Đăng nhập vào hệ thống quản lý</h1>
          <p className="mx-auto max-w-2xl text-base leading-7 text-slate-600">Nhập email và mật khẩu để truy cập dashboard nhân viên.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Email
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-3xl border px-4 py-3" />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Mật khẩu
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-3xl border px-4 py-3" />
          </label>

          <div className="flex items-center justify-between text-sm">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Giữ đăng nhập
            </label>
            <Link href="/auth/register" className="text-amber-700">Tạo tài khoản</Link>
          </div>

          {error && <div className="text-rose-600">{error}</div>}

          <button type="submit" disabled={loading} className="w-full rounded-3xl bg-amber-600 px-5 py-3 text-white">
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </main>
  )
}
