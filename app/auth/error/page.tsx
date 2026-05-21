export default function AuthErrorPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-rose-200 bg-white p-10 shadow-xl shadow-rose-200/40">
        <header className="space-y-4 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-rose-600">Lỗi xác thực</p>
          <h1 className="text-3xl font-semibold text-slate-900">Không thể đăng nhập</h1>
          <p className="text-base leading-7 text-slate-600">
            Có lỗi xảy ra khi xác thực tài khoản. Hãy quay lại trang đăng nhập và thử lại.
          </p>
        </header>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <a
            href="/auth/login"
            className="inline-flex items-center justify-center rounded-3xl bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
          >
            Quay về đăng nhập
          </a>
          <a
            href="/auth/register"
            className="inline-flex items-center justify-center rounded-3xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Đăng ký tài khoản mới
          </a>
        </div>
      </div>
    </main>
  )
}
