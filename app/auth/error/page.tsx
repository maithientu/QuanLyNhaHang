export default function AuthError() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="max-w-md rounded-xl border p-8 bg-white">
        <h1 className="text-2xl font-semibold">Lỗi xác thực</h1>
        <p className="mt-4 text-slate-600">Không thể xác thực tài khoản. Vui lòng thử lại hoặc liên hệ quản trị viên.</p>
        <div className="mt-6">
          <a href="/auth/login" className="text-amber-700">Quay lại đăng nhập</a>
        </div>
      </div>
    </main>
  )
}
