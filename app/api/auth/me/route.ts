import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Không có phiên đăng nhập.' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profileError && profileError.code !== 'PGRST116') {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json(
    {
      user: {
        id: user.id,
        email: user.email,
        role: profile?.role ?? (user.user_metadata as any)?.role ?? null,
        full_name: profile?.full_name ?? (user.user_metadata as any)?.full_name ?? null,
      },
    },
    { status: 200 },
  )
}
