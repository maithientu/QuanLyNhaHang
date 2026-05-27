import { NextResponse } from "next/server";
import QRCode from "qrcode";

// Quy tắc Node.js 16: Sử dụng cấu trúc xử lý context để bóc tách ID an toàn thay vì await params trực tiếp
export async function GET(request: Request, context: any) {
  try {
    const paramsResolved =
      context.params && typeof context.params.then === "function"
        ? await context.params
        : context.params;
    const tableId = paramsResolved?.id;

    if (!tableId) {
      return NextResponse.json(
        { error: "Thiếu ID bàn ăn để tạo mã QR" },
        { status: 400 },
      );
    }

    // Tự động nhận diện tên miền hệ thống khi deploy (ví dụ link Vercel) hoặc dùng localhost khi code
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Cấu trúc URL động dán vào QR: Điều hướng thẳng tới trang POS kèm mã bàn và ép chặt quyền khách hàng
    const qrUrl = `${baseUrl}/dashboard/pos?tableId=${tableId}&role=customer`;

    // Cấu hình thuật toán vẽ mã QR chất lượng cao
    const qrCodeBase64 = await QRCode.toDataURL(qrUrl, {
      errorCorrectionLevel: "H", // Mức độ sửa lỗi cao nhất (High) - dán tại bàn lỡ dính bẩn vẫn quét được
      margin: 2, // Khoảng cách viền trắng an toàn xung quanh mã QR
      width: 400, // Độ phân giải chiều rộng ảnh (400x400px) đảm bảo in ấn sắc nét
      color: {
        dark: "#000000", // Màu của các ô điểm đen mã QR
        light: "#FFFFFF", // Màu nền của mã QR
      },
    });

    // Trả kết quả dữ liệu ảnh sạch về cho giao diện quản lý bàn của Admin
    return NextResponse.json(
      {
        success: true,
        qrCode: qrCodeBase64,
        url: qrUrl,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Lỗi máy chủ trong quá trình sinh mã QR:", error);
    return NextResponse.json(
      { error: error.message || "Lỗi hệ thống nội bộ" },
      { status: 500 },
    );
  }
}
