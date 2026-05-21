import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const email = String(body.email || '').trim()
  const password = String(body.password || '')

  if (!email || !password) {
    return NextResponse.json({ error: 'Email và mật khẩu là bắt buộc' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data?.session) {
    return NextResponse.json({ error: error?.message || 'Invalid login credentials' }, { status: 401 })
  }

  return NextResponse.json({ message: 'Đăng nhập thành công' })
}
