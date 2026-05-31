"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// ⏱️ CẤU HÌNH THỜI GIAN CA LÀM VIỆC TUYỆT ĐỐI (Tính bằng Mili-giây)
// Ví dụ: 4 tiếng = 4 * 60 * 60 * 1000 = 14400000 ms.
// (Để test nhanh bạn có thể sửa số này thành 10000 - tức là 10 giây xem có bị đá ra không nhé).
const SESSION_DURATION_MS = 8 * 50 * 60 * 1000;

export function IdleLogout() {
  const supabase = createClient();

  useEffect(() => {
    // 1. Lấy mốc thời gian nhân viên đăng nhập thực tế từ LocalStorage
    const storedStartTime = localStorage.getItem("session_start_time");
    const startTime = storedStartTime
      ? parseInt(storedStartTime, 10)
      : Date.now();

    // Nếu chưa từng có mốc thời gian (đăng nhập cũ), tự động tạo mốc mới ngay lúc này
    if (!storedStartTime) {
      localStorage.setItem("session_start_time", startTime.toString());
    }

    // 2. Hàm thực hiện đăng xuất sạch dữ liệu
    const handleSessionExpiry = async () => {
      try {
        localStorage.removeItem("session_start_time"); // Xóa mốc thời gian cũ
        await supabase.auth.signOut();
        window.location.href = "/auth/login";
      } catch (error) {
        console.error("Lỗi khi tự động hết hạn ca làm việc:", error);
      }
    };

    // 3. Tính toán xem ca làm việc đã trôi qua bao nhiêu lâu rồi
    const timeElapsed = Date.now() - startTime;
    const timeLeft = SESSION_DURATION_MS - timeElapsed;

    let timeoutId: NodeJS.Timeout;

    // Nếu thời gian còn lại lớn hơn 0, thiết lập bộ đếm chạy nốt phần thời gian đó
    if (timeLeft > 0) {
      timeoutId = setTimeout(handleSessionExpiry, timeLeft);
    } else {
      // Nếu đã quá 4 tiếng kể từ lúc đăng nhập, đá ra ngoài ngay lập tức khi vừa load trang
      handleSessionExpiry();
    }

    // Hủy bộ đếm khi đóng tab để tránh tốn tài nguyên máy
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [supabase]);

  return null;
}
