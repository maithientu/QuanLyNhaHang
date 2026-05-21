import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const email = String(body.email || '').trim()
  const password = String(body.password || '')
  
  // Lấy thêm biến remember từ nhánh main
  const remember = Boolean(body.remember)

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email và mật khẩu là bắt buộc.' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  // Thực hiện đăng nhập bằng mật khẩu. Supabase sẽ quản lý session và cookie.
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data?.session) {
    return NextResponse.json(
      { error: error?.message ?? 'Đăng nhập không thành công. Kiểm tra lại thông tin.' },
      { status: 401 }
    )
  }

  // Nếu người dùng chọn nhớ đăng nhập, giữ session mặc định.
  // Nếu không, Supabase sẽ dùng session phiên trình duyệt.
  return NextResponse.json({ message: 'Đăng nhập thành công' }, { status: 200 })
}