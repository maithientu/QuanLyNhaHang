# Hướng Dẫn Cài Đặt - Restaurant POS

## Yêu Cầu Hệ Thống

- Node.js 18.x hoặc cao hơn
- pnpm (khuyến nghị) hoặc npm/yarn
- Tài khoản Supabase (miễn phí tại supabase.com)

## Bước 1: Tải Code Về Máy

### Cách 1: Download ZIP (Đơn giản nhất)
1. Nhấn vào nút **ba chấm (⋮)** ở góc trên bên phải của Preview
2. Chọn **"Download ZIP"**
3. Giải nén file ZIP vào thư mục bạn muốn

### Cách 2: Sử dụng shadcn CLI
```bash
npx shadcn@latest add https://v0.dev/chat/[your-chat-id]
```

### Cách 3: Kết nối GitHub
1. Nhấn vào **Settings** (biểu tượng bánh răng) ở góc trên bên phải
2. Chọn tab **Git**
3. Kết nối với GitHub repository của bạn

## Bước 2: Cài Đặt Dependencies

```bash
cd restaurant-pos
pnpm install
```

## Bước 3: Tạo Supabase Project

1. Truy cập [supabase.com](https://supabase.com) và đăng nhập
2. Tạo project mới
3. Vào **Settings > API** để lấy:
   - `Project URL` → NEXT_PUBLIC_SUPABASE_URL
   - `anon public` key → NEXT_PUBLIC_SUPABASE_ANON_KEY

## Bước 4: Tạo Database Schema

Vào **SQL Editor** trong Supabase Dashboard và chạy lần lượt các script sau:

### Script 1: Tạo ENUM Types và Tables

```sql
-- 1. ENUM Types
CREATE TYPE user_role AS ENUM ('manager', 'cashier', 'waiter', 'kitchen');
CREATE TYPE table_status AS ENUM ('available', 'occupied', 'reserved', 'cleaning');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled');
CREATE TYPE order_item_status AS ENUM ('pending', 'preparing', 'ready', 'served', 'cancelled');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'transfer', 'qr');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded');

-- 2. Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'waiter',
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Restaurant Settings
CREATE TABLE IF NOT EXISTS public.restaurant_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Nhà hàng',
  address TEXT,
  phone TEXT,
  logo_url TEXT,
  tax_rate DECIMAL(5,2) DEFAULT 10.00,
  currency TEXT DEFAULT 'VND',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Areas/Zones
CREATE TABLE IF NOT EXISTS public.areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tables
CREATE TABLE IF NOT EXISTS public.tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  capacity INT DEFAULT 4,
  status table_status DEFAULT 'available',
  position_x INT DEFAULT 0,
  position_y INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Menu Categories
CREATE TABLE IF NOT EXISTS public.menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Menu Items
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.menu_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL,
  cost_price DECIMAL(12,2) DEFAULT 0,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  preparation_time INT DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number SERIAL,
  table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
  waiter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status order_status DEFAULT 'pending',
  subtotal DECIMAL(12,2) DEFAULT 0,
  discount DECIMAL(12,2) DEFAULT 0,
  tax DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  note TEXT,
  guest_count INT DEFAULT 1,
  is_takeaway BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  status order_item_status DEFAULT 'pending',
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  cashier_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_method payment_method DEFAULT 'cash',
  status payment_status DEFAULT 'pending',
  received_amount DECIMAL(12,2) DEFAULT 0,
  change_amount DECIMAL(12,2) DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Reservations
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  guest_count INT DEFAULT 2,
  reservation_time TIMESTAMPTZ NOT NULL,
  note TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Script 2: Enable RLS và tạo Policies

```sql
-- Enable RLS
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

-- Policies (cho phép authenticated users)
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

CREATE POLICY "Allow authenticated insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON public.orders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON public.order_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON public.order_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated update" ON public.tables FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON public.payments FOR INSERT TO authenticated WITH CHECK (true);
```

### Script 3: Thêm Sample Data

```sql
-- Sample Areas
INSERT INTO public.areas (name, description, sort_order) VALUES
('Tầng 1', 'Khu vực tầng trệt', 1),
('Tầng 2', 'Khu vực tầng lầu', 2),
('Sân vườn', 'Khu vực ngoài trời', 3),
('VIP', 'Phòng riêng cho khách VIP', 4);

-- Sample Tables (Tầng 1)
INSERT INTO public.tables (area_id, name, capacity, status)
SELECT a.id, 'Bàn ' || n, 4, 
  CASE WHEN n % 3 = 0 THEN 'occupied'::table_status ELSE 'available'::table_status END
FROM public.areas a, generate_series(1, 6) n
WHERE a.name = 'Tầng 1';

-- Sample Tables (Tầng 2)
INSERT INTO public.tables (area_id, name, capacity, status)
SELECT a.id, 'Bàn ' || (n + 6), 4, 'available'::table_status
FROM public.areas a, generate_series(1, 4) n
WHERE a.name = 'Tầng 2';

-- Sample Tables (VIP)
INSERT INTO public.tables (area_id, name, capacity, status)
SELECT a.id, 'VIP ' || n, 8, 'available'::table_status
FROM public.areas a, generate_series(1, 2) n
WHERE a.name = 'VIP';

-- Sample Menu Categories
INSERT INTO public.menu_categories (name, description, icon, sort_order) VALUES
('Khai vị', 'Các món khai vị', 'utensils', 1),
('Món chính', 'Các món ăn chính', 'beef', 2),
('Lẩu', 'Các loại lẩu', 'soup', 3),
('Hải sản', 'Các món hải sản tươi sống', 'fish', 4),
('Đồ uống', 'Nước giải khát', 'cup-soda', 5),
('Tráng miệng', 'Món tráng miệng', 'cake', 6);

-- Sample Menu Items
INSERT INTO public.menu_items (category_id, name, description, price, is_available)
SELECT c.id, item.name, item.description, item.price, true
FROM public.menu_categories c,
(VALUES 
  ('Khai vị', 'Gỏi cuốn tôm thịt', '2 cuốn với tôm và thịt heo', 45000),
  ('Khai vị', 'Chả giò chiên', '4 cuốn chả giò giòn rụm', 55000),
  ('Món chính', 'Cơm chiên hải sản', 'Cơm chiên với tôm, mực', 85000),
  ('Món chính', 'Bò lúc lắc', 'Thịt bò Úc xào rau củ', 150000),
  ('Món chính', 'Gà nướng mật ong', 'Nửa con gà nướng', 180000),
  ('Lẩu', 'Lẩu thái hải sản', 'Lẩu chua cay kiểu Thái', 350000),
  ('Lẩu', 'Lẩu bò nhúng dấm', 'Lẩu bò truyền thống', 320000),
  ('Hải sản', 'Tôm hùm nướng phô mai', 'Tôm hùm Alaska', 850000),
  ('Hải sản', 'Cua rang me', 'Cua biển rang sốt me', 450000),
  ('Đồ uống', 'Nước cam tươi', 'Nước cam ép tươi', 35000),
  ('Đồ uống', 'Sinh tố bơ', 'Sinh tố bơ sánh mịn', 45000),
  ('Đồ uống', 'Bia Tiger', 'Lon 330ml', 25000),
  ('Tráng miệng', 'Chè khúc bạch', 'Chè khúc bạch mát lạnh', 40000),
  ('Tráng miệng', 'Bánh flan', 'Bánh flan caramen', 35000)
) AS item(cat, name, description, price)
WHERE c.name = item.cat;

-- Default restaurant settings
INSERT INTO public.restaurant_settings (name, address, phone) 
VALUES ('Nhà Hàng Demo', '123 Đường ABC, Quận 1, TP.HCM', '0901234567');
```

## Bước 5: Cấu Hình Environment Variables

Tạo file `.env.local` trong thư mục gốc:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Bước 6: Chạy Ứng Dụng

```bash
pnpm dev
```

Truy cập [http://localhost:3000](http://localhost:3000)

## Cấu Trúc Thư Mục

```
├── app/
│   ├── dashboard/
│   │   ├── page.tsx          # Dashboard tổng quan
│   │   ├── tables/           # Quản lý bàn
│   │   ├── menu/             # Quản lý thực đơn
│   │   ├── pos/              # Đặt món (POS)
│   │   ├── kitchen/          # Màn hình bếp (KDS)
│   │   └── billing/          # Thanh toán
│   ├── auth/                 # Xác thực
│   └── layout.tsx
├── components/
│   ├── dashboard/            # Components dashboard
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── supabase/             # Supabase client
│   └── types/                # TypeScript types
└── ...
```

## Các Tính Năng

1. **Dashboard** - Tổng quan doanh thu, đơn hàng, sơ đồ bàn
2. **Quản lý bàn** - Xem trạng thái, thay đổi trạng thái bàn
3. **Quản lý thực đơn** - Thêm, sửa, xóa món ăn
4. **POS** - Tạo đơn hàng, chọn bàn, thêm món
5. **Màn hình bếp** - Xem và xử lý đơn hàng
6. **Thanh toán** - Xử lý thanh toán, in hóa đơn

## Hỗ Trợ

Nếu gặp vấn đề, vui lòng kiểm tra:
- Environment variables đã được cấu hình đúng
- Database schema đã được tạo đầy đủ
- RLS policies đã được enable
