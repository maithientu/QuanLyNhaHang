"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormEvent, useEffect, useState } from "react"

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [role, setRole] = useState("cashier")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isManager, setIsManager] = useState<boolean | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (!res.ok) { setIsManager(false); return }
        const data = await res.json()
        setIsManager(data.user?.role === 'manager')
      } catch (err) { setIsManager(false) }
    })()
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, email, password, phone, role }),
      })
      const data = await res.json()
      setLoading(false)
      if (!res.ok) {
        setError(data.error || 'Đăng ký thất bại')
        return
      }
      router.push('/auth/login')
    } catch (err) {
      setLoading(false)
      setError('Lỗi kết nối')
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 border">
        <h1 className="text-2xl font-semibold">Tạo tài khoản nhân viên</h1>
        <p className="mt-2 text-slate-600">Chỉ quản lý mới có quyền tạo tài khoản nhân viên.</p>

        {isManager === null ? (
          <div className="mt-4">Đang kiểm tra quyền...</div>
        ) : isManager ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input required placeholder="Họ tên" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border px-3 py-2" />
            <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border px-3 py-2" />
            <input required type="password" placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border px-3 py-2" />
            <input placeholder="Số điện thoại" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border px-3 py-2" />
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full border px-3 py-2">
              <option value="manager">Quản lý</option>
              <option value="cashier">Thu ngân</option>
              <option value="waiter">Phục vụ</option>
              <option value="kitchen">Bếp</option>
            </select>
            {error && <div className="text-rose-600">{error}</div>}
            <div className="flex gap-2">
              <button className="bg-amber-600 text-white px-4 py-2 rounded" disabled={loading}>{loading ? 'Đang tạo...' : 'Tạo tài khoản'}</button>
              <Link href="/dashboard" className="px-4 py-2 border rounded">Quay lại</Link>
            </div>
          </form>
        ) : (
          <div className="mt-6 text-rose-600">Bạn không có quyền tạo tài khoản. Vui lòng đăng nhập bằng tài khoản quản lý.</div>
        )}
      </div>
    </main>
  )
}
