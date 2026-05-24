// Đây là file layout gốc (Root Layout) của ứng dụng Next.js.
// Nó định nghĩa cấu trúc HTML cơ bản và các thông tin meta chung áp dụng cho tất cả các trang.
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

// Khởi tạo các font chữ tùy chỉnh từ Google Fonts thông qua Next.js.
// Next.js sẽ tự động tối ưu việc tải font để cải thiện hiệu suất.
const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

// Định nghĩa metadata (siêu dữ liệu) cho trang web.
// Thông tin này được Next.js sử dụng để điền vào các thẻ <head> của HTML,
// rất quan trọng cho SEO (Tối ưu hóa công cụ tìm kiếm) và cách trang web xuất hiện khi được chia sẻ.
export const metadata: Metadata = {
  title: "RestaurantPOS - Quản lý nhà hàng",
  description:
    "Hệ thống quản lý nhà hàng chuyên nghiệp - POS, quản lý bàn, menu, đơn hàng và báo cáo",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

// Định nghĩa cấu hình viewport cho trang web.
// Điều này kiểm soát cách trang web hiển thị trên các thiết bị khác nhau, đặc biệt là thiết bị di động.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f0" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1714" },
  ],
  width: "device-width",
  initialScale: 1,
};

// Đây là thành phần React mặc định cho root layout.
// Nó nhận một prop `children`, đại diện cho nội dung của các trang hoặc layout lồng nhau.
// Next.js sẽ tự động truyền nội dung của các trang vào đây.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="bg-background" suppressHydrationWarning>
      <body className="font-sans antialiased">
        {children} // Render nội dung của các trang hoặc layout con tại đây.
        // Thành phần Analytics từ Vercel chỉ được tải và sử dụng trong môi trường production
        // để thu thập dữ liệu phân tích về hiệu suất ứng dụng.

        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
