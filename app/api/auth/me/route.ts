import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'No session' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single()

  return NextResponse.json({ user: { id: user.id, email: user.email, full_name: profile?.full_name ?? (user.user_metadata as any)?.full_name, role: profile?.role ?? (user.user_metadata as any)?.role } })
}
