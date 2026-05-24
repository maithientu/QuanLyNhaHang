-- Migration: Kích hoạt Row Level Security (RLS) và tạo các chính sách truy cập cho các bảng
-- Điều này giúp kiểm soát ai có thể truy cập và sửa đổi dữ liệu trong từng bảng.

-- Kích hoạt RLS cho tất cả các bảng
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Các chính sách RLS cơ bản (cho phép người dùng đã xác thực đọc dữ liệu)
-- LƯU Ý QUAN TRỌNG:
-- Chính sách cho bảng `profiles` ở đây rất chung chung ("Allow authenticated read").
-- Nếu bạn đã có các chính sách RLS chi tiết hơn cho bảng `profiles` (ví dụ: chỉ cho phép người dùng đọc hồ sơ của chính họ hoặc quản lý đọc tất cả)
-- từ file `001-profiles-and-rls.sql` trước đây, bạn nên xem xét kết hợp lại hoặc điều chỉnh chúng.
-- Việc này là RẤT QUAN TRỌNG để không ảnh hưởng đến logic đăng nhập và phân quyền hiện có của bạn.

CREATE POLICY "Allow authenticated read" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON public.restaurant_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON public.areas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON public.tables FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON public.menu_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON public.menu_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON public.orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON public.order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON public.payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read" ON public.reservations FOR SELECT TO authenticated USING (true);

-- Các chính sách cho phép người dùng đã xác thực thực hiện INSERT/UPDATE
CREATE POLICY "Allow authenticated insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON public.orders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON public.order_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON public.order_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated update" ON public.tables FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON public.payments FOR INSERT TO authenticated WITH CHECK (true);
