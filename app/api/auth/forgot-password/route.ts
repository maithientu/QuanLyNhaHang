// app/api/auth/forgot-password/route.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Thêm AWAIT ở đây vì cookies() trong Next.js mới là một Promise
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options),
              );
            } catch {
              // Tránh crash log ở môi trường Server Component / Route Handler
            }
          },
        },
      },
    );

    // Toàn bộ logic gửi email resetPasswordForEmail bên dưới giữ nguyên...
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${new URL(request.url).origin}/auth/reset-password`,
    });

    if (error)
      return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ message: "Vui lòng kiểm tra email của bạn!" });
  } catch (err) {
    return NextResponse.json({ error: "Đã có lỗi xảy ra" }, { status: 500 });
  }
}
