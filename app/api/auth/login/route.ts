// File này định nghĩa API route để xử lý yêu cầu đăng nhập (login).
// Nó sẽ nhận email và mật khẩu từ client, sau đó sử dụng Supabase để xác thực.

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Xử lý yêu cầu POST cho việc đăng nhập.
 * @param request Đối tượng Request chứa thông tin đăng nhập.
 * @returns NextResponse chứa kết quả đăng nhập (thành công hoặc lỗi).
 */
export async function POST(request: Request) {
  // Lấy dữ liệu từ body của yêu cầu POST
  const body = await request.json();
  // Trích xuất và làm sạch email từ body
  const email = String(body.email || "").trim();
  // Trích xuất mật khẩu từ body
  const password = String(body.password || "");

  // Lấy giá trị 'remember' từ body, chuyển đổi sang boolean.
  // Giá trị này có thể được sử dụng để kiểm soát thời gian tồn tại của session.
  const remember = Boolean(body.remember);

  // Kiểm tra xem email và mật khẩu có được cung cấp hay không
  if (!email || !password) {
    // Nếu thiếu, trả về lỗi 400 Bad Request
    return NextResponse.json(
      { error: "Email và mật khẩu là bắt buộc." },
      { status: 400 }
    );
  }

  // Tạo một Supabase client để tương tác với các dịch vụ Supabase trên server
  const supabase = await createClient();

  // Thực hiện đăng nhập người dùng bằng email và mật khẩu thông qua Supabase Auth.
  // Supabase sẽ quản lý việc xác thực, tạo và lưu trữ session/cookie.
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  // Kiểm tra nếu có lỗi từ Supabase hoặc không có session nào được tạo
  if (error || !data?.session) {
    // Nếu có lỗi, trả về lỗi 401 Unauthorized với thông báo lỗi
    return NextResponse.json(
      { error: error?.message ?? "Đăng nhập không thành công. Kiểm tra lại thông tin." },
      { status: 401 }
    );
  }

  // Nếu đăng nhập thành công, trả về thông báo thành công với status 200 OK
  // Supabase đã tự động xử lý việc thiết lập session cookie.
  return NextResponse.json({ message: "Đăng nhập thành công" }, { status: 200 });
}
