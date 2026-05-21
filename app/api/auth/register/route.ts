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
    return NextResponse.json({ error: 'Email, mật khẩu và họ tên là bắt buộc.' }, { status: 400 })
  }

  const supabase = await createClient()

  // Kiểm tra phiên hiện tại và role của người gọi API
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Bạn cần đăng nhập bằng tài khoản quản lý.' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const currentRole = profile?.role ?? (user.user_metadata as any)?.role
  if (currentRole !== 'manager') {
    return NextResponse.json({ error: 'Chỉ quản lý mới được phép tạo tài khoản.' }, { status: 403 })
  }

  // Tạo user mới trong Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name, role, phone, is_active: true } },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  if (data?.user?.id) {
    const { error: insertErr } = await supabase.from('profiles').insert({ id: data.user.id, full_name, role, phone: phone || null, is_active: true })
    if (insertErr) console.warn('Profile insert warning:', insertErr.message)
  }

  return NextResponse.json({ message: 'Người dùng mới đã được tạo.' }, { status: 201 })
}
