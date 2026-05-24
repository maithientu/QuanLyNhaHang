-- Migration: Tạo các loại ENUM tùy chỉnh cho ứng dụng
-- Chứa các định nghĩa loại ENUM cho vai trò người dùng, trạng thái bàn, trạng thái đơn hàng, phương thức thanh toán, và trạng thái thanh toán.
-- Các loại ENUM này được sử dụng trong các bảng khác để đảm bảo tính toàn vẹn dữ liệu.

CREATE TYPE public.user_role AS ENUM (
  'manager',
  'cashier',
  'waiter',
  'kitchen'
);
CREATE TYPE public.table_status AS ENUM (
  'available',
  'occupied',
  'reserved',
  'cleaning'
);
CREATE TYPE public.order_status AS ENUM (
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'served',
  'completed',
  'cancelled'
);
CREATE TYPE public.order_item_status AS ENUM (
  'pending',
  'preparing',
  'ready',
  'served',
  'cancelled'
);
CREATE TYPE public.payment_method AS ENUM (
  'cash',
  'card',
  'transfer',
  'qr'
);
CREATE TYPE public.payment_status AS ENUM (
  'pending',
  'paid',
  'refunded'
);
