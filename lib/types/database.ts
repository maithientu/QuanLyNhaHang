// Database Types for Restaurant Management System

export type UserRole = 'manager' | 'cashier' | 'waiter' | 'kitchen'
export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning'
export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled'
export type OrderItemStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled'
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'qr'
export type PaymentStatus = 'pending' | 'paid' | 'refunded'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  phone: string | null
  avatar_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface RestaurantSettings {
  id: string
  name: string
  address: string | null
  phone: string | null
  logo_url: string | null
  tax_rate: number
  currency: string
  created_at: string
  updated_at: string
}

export interface Area {
  id: string
  name: string
  description: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface Table {
  id: string
  area_id: string | null
  name: string
  capacity: number
  status: TableStatus
  position_x: number
  position_y: number
  is_active: boolean
  created_at: string
  area?: Area
}

export interface MenuCategory {
  id: string
  name: string
  description: string | null
  icon: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface MenuItem {
  id: string
  category_id: string | null
  name: string
  description: string | null
  price: number
  cost_price: number
  image_url: string | null
  is_available: boolean
  is_active: boolean
  preparation_time: number
  created_at: string
  updated_at: string
  category?: MenuCategory
}

export interface Order {
  id: string
  order_number: number
  table_id: string | null
  waiter_id: string | null
  status: OrderStatus
  subtotal: number
  discount: number
  tax: number
  total: number
  note: string | null
  guest_count: number
  is_takeaway: boolean
  created_at: string
  updated_at: string
  table?: Table
  waiter?: Profile
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string | null
  quantity: number
  unit_price: number
  total_price: number
  status: OrderItemStatus
  note: string | null
  created_at: string
  updated_at: string
  menu_item?: MenuItem
}

export interface Payment {
  id: string
  order_id: string
  cashier_id: string | null
  amount: number
  payment_method: PaymentMethod
  status: PaymentStatus
  received_amount: number
  change_amount: number
  note: string | null
  created_at: string
  cashier?: Profile
  order?: Order
}

export interface Reservation {
  id: string
  table_id: string | null
  customer_name: string
  customer_phone: string
  guest_count: number
  reservation_time: string
  note: string | null
  status: string
  created_at: string
  table?: Table
}

// Dashboard Stats
export interface DashboardStats {
  todayRevenue: number
  todayOrders: number
  activeOrders: number
  occupiedTables: number
  totalTables: number
  availableTables: number
  reservedTables: number
}
