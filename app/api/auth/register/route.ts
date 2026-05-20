import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const email = String(body.email || '').trim()
  const password = String(body.password || '')
  const full_name = String(body.full_name || '').trim()
  const phone = String(body.phone || '').trim()
  const role = String(body.role || 'cashier').trim()

  if (!email || !password || !full_name) {
    return NextResponse.json(
      { error: 'Email, mật khẩu và họ tên là bắt buộc.' },
      { status: 400 },
    )
  }

  const supabase = await createClient()

  // Đăng ký người dùng mới vào Supabase Auth.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        role,
        phone,
        is_active: true,
      },
    },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Thêm profile vào bảng `profiles` nếu table đã được cấu hình.
  if (data?.user?.id) {
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      full_name,
      role,
      phone: phone || null,
      is_active: true,
    })

    if (profileError) {
      // Nếu bảng profile chưa tồn tại, vẫn cho phép người dùng tạo tài khoản.
      console.warn('Không thể tạo profile:', profileError.message)
    }
  }

  return NextResponse.json(
    {
      message:
        'Đăng ký thành công. Vui lòng kiểm tra email để xác thực nếu Supabase yêu cầu.',
    },
    { status: 201 },
  )
}
