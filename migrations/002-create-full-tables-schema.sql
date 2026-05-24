-- Migration: Tạo toàn bộ cấu trúc bảng cho ứng dụng Restaurant POS
-- Bao gồm các bảng: profiles, restaurant_settings, areas, tables, menu_categories, menu_items, orders, order_items, payments, reservations.
-- Sử dụng CREATE TABLE IF NOT EXISTS để tránh lỗi nếu bảng đã tồn tại.

-- Bảng Profiles: Thông tin hồ sơ người dùng, liên kết với auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role public.user_role NOT NULL DEFAULT 'waiter', -- Sử dụng ENUM user_role
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- LƯU Ý: Nếu bảng profiles đã tồn tại từ migration 001-profiles-and-rls.sql với cột 'role' là TEXT,
-- thì lệnh CREATE TABLE IF NOT EXISTS này sẽ không thay đổi kiểu dữ liệu của cột 'role'.
-- Để chuyển đổi 'role' từ TEXT sang ENUM 'user_role' mà không mất dữ liệu, cần một ALTER TABLE riêng.
-- Vui lòng kiểm tra schema hiện tại trên Supabase và thực hiện ALTER TABLE thủ công nếu cần.

-- Bảng Restaurant Settings: Cài đặt chung của nhà hàng
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

-- Bảng Areas/Zones: Các khu vực trong nhà hàng (ví dụ: Tầng 1, Tầng 2, Sân vườn)
CREATE TABLE IF NOT EXISTS public.areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng Tables: Thông tin các bàn trong nhà hàng
CREATE TABLE IF NOT EXISTS public.tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  capacity INT DEFAULT 4,
  status public.table_status DEFAULT 'available', -- Sử dụng ENUM table_status
  position_x INT DEFAULT 0,
  position_y INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng Menu Categories: Danh mục các món ăn (ví dụ: Khai vị, Món chính)
CREATE TABLE IF NOT EXISTS public.menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng Menu Items: Chi tiết các món ăn trong thực đơn
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

-- Bảng Orders: Thông tin các đơn đặt hàng
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number SERIAL,
  table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
  waiter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status public.order_status DEFAULT 'pending', -- Sử dụng ENUM order_status
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

-- Bảng Order Items: Chi tiết các món trong mỗi đơn hàng
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  status public.order_item_status DEFAULT 'pending', -- Sử dụng ENUM order_item_status
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng Payments: Thông tin các giao dịch thanh toán
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  cashier_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_method public.payment_method DEFAULT 'cash', -- Sử dụng ENUM payment_method
  status public.payment_status DEFAULT 'pending', -- Sử dụng ENUM payment_status
  received_amount DECIMAL(12,2) DEFAULT 0,
  change_amount DECIMAL(12,2) DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng Reservations: Thông tin đặt bàn trước
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES public.tables(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  guest_count INT DEFAULT 2,
  reservation_time TIMESTAMPTZ NOT NULL,
  note TEXT,
  status TEXT DEFAULT 'pending', -- Có thể dùng ENUM riêng nếu cần nhiều trạng thái
  created_at TIMESTAMPTZ DEFAULT NOW()
);
