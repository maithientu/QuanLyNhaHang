-- 1. BẢNG KHO / CHI NHÁNH
CREATE TABLE public.warehouses (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NULL,
  is_active BOOLEAN NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  CONSTRAINT warehouses_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- 2. BẢNG DANH MỤC NGUYÊN LIỆU (Thịt, Rau, Gia vị...)
CREATE TABLE public.ingredient_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  CONSTRAINT ingredient_categories_pkey PRIMARY KEY (id),
  CONSTRAINT ingredient_categories_name_key UNIQUE (name)
) TABLESPACE pg_default;

-- 3. BẢNG DANH MỤC NGUYÊN LIỆU (Lưu đơn vị cơ bản nhỏ nhất)
CREATE TABLE public.ingredients (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  category_id UUID NULL,
  code TEXT NULL,
  name TEXT NOT NULL,
  base_uom TEXT NOT NULL, -- Đơn vị tính cơ bản nhỏ nhất (g, ml, lon, cái)
  min_stock_level NUMERIC(10, 2) NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  CONSTRAINT ingredients_pkey PRIMARY KEY (id),
  CONSTRAINT ingredients_code_key UNIQUE (code),
  CONSTRAINT ingredients_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.ingredient_categories (id) ON DELETE SET NULL
) TABLESPACE pg_default;

-- 4. BẢNG QUY ĐỔI ĐƠN VỊ TÍNH (UoM Conversion)
CREATE TABLE public.uom_conversions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  ingredient_id UUID NOT NULL,
  alternative_uom TEXT NOT NULL, -- Đơn vị quy đổi (Thùng, Két, Can, Kg)
  conversion_factor NUMERIC(10, 4) NOT NULL, -- 1 Thùng = 24 Lon -> factor = 24
  CONSTRAINT uom_conversions_pkey PRIMARY KEY (id),
  CONSTRAINT unique_ingredient_uom UNIQUE (ingredient_id, alternative_uom),
  CONSTRAINT uom_conversions_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- 5. BẢNG NHÀ CUNG CẤP
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NULL,
  email TEXT NULL,
  address TEXT NULL,
  current_debt NUMERIC(12, 2) NULL DEFAULT 0.00,
  is_active BOOLEAN NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  CONSTRAINT suppliers_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- 6. BẢNG SỔ CÁI BIẾN ĐỘNG CÔNG NỢ NHÀ CUNG CẤP
CREATE TABLE public.supplier_debt_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL,
  transaction_type TEXT NOT NULL, -- 'PURCHASE' (Tăng nợ), 'PAYMENT' (Giảm nợ)
  reference_id UUID NULL, -- ID của phiếu nhập kho hoặc phiếu chi tiền
  amount NUMERIC(12, 2) NOT NULL,
  balance_after NUMERIC(12, 2) NOT NULL,
  note TEXT NULL,
  created_by UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  CONSTRAINT supplier_debt_ledger_pkey PRIMARY KEY (id),
  CONSTRAINT supplier_debt_ledger_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers (id) ON DELETE RESTRICT
) TABLESPACE pg_default;

-- 7. BẢNG PHIẾU NHẬP KHO (Purchase Orders)
CREATE TABLE public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL,
  supplier_id UUID NOT NULL,
  po_number TEXT NOT NULL,
  total_amount NUMERIC(12, 2) NULL DEFAULT 0.00,
  discount NUMERIC(12, 2) NULL DEFAULT 0.00,
  final_amount NUMERIC(12, 2) NULL DEFAULT 0.00, -- Tiền hàng sau chiết khấu
  paid_amount NUMERIC(12, 2) NULL DEFAULT 0.00,  -- Tiền mặt/chuyển khoản trả ngay
  payment_status TEXT NULL DEFAULT 'UNPAID', -- 'UNPAID', 'PARTIAL', 'PAID'
  status TEXT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'COMPLETED', 'CANCELLED'
  note TEXT NULL,
  created_by UUID NULL,
  approved_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  CONSTRAINT purchase_orders_pkey PRIMARY KEY (id),
  CONSTRAINT purchase_orders_po_number_key UNIQUE (po_number),
  CONSTRAINT purchase_orders_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses (id) ON DELETE RESTRICT,
  CONSTRAINT purchase_orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers (id) ON DELETE RESTRICT
) TABLESPACE pg_default;

-- 8. BẢNG CHI TIẾT PHIẾU NHẬP KHO
CREATE TABLE public.purchase_order_details (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL,
  ingredient_id UUID NOT NULL,
  uom_used TEXT NOT NULL,
  quantity_uom NUMERIC(10, 2) NOT NULL,
  price_per_uom NUMERIC(12, 2) NOT NULL,
  base_quantity NUMERIC(10, 2) NOT NULL, -- Hệ thống tự tính bằng Trigger
  base_price NUMERIC(12, 2) NOT NULL,    -- Hệ thống tự tính bằng Trigger
  total_price NUMERIC(12, 2) NOT NULL,   -- Hệ thống tự tính bằng Trigger
  CONSTRAINT purchase_order_details_pkey PRIMARY KEY (id),
  CONSTRAINT purchase_order_details_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders (id) ON DELETE CASCADE,
  CONSTRAINT purchase_order_details_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients (id) ON DELETE RESTRICT
) TABLESPACE pg_default;

-- 9. BẢNG LÔ HÀNG HẠN SỬ DỤNG (Phục vụ FEFO/FIFO)
CREATE TABLE public.inventory_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL,
  ingredient_id UUID NOT NULL,
  po_detail_id UUID NULL,
  batch_code TEXT NOT NULL,
  initial_quantity NUMERIC(10, 2) NOT NULL,
  current_quantity NUMERIC(10, 2) NOT NULL,
  cost_price NUMERIC(12, 2) NOT NULL,
  manufacture_date DATE NULL,
  expiry_date DATE NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  CONSTRAINT inventory_batches_pkey PRIMARY KEY (id),
  CONSTRAINT inventory_batches_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses (id) ON DELETE RESTRICT,
  CONSTRAINT inventory_batches_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients (id) ON DELETE RESTRICT,
  CONSTRAINT inventory_batches_po_detail_id_fkey FOREIGN KEY (po_detail_id) REFERENCES public.purchase_order_details (id) ON DELETE SET NULL
) TABLESPACE pg_default;

-- 10. BẢNG TỔNG HỢP TỒN KHO THỰC TẾ TRÊN TỪNG KHO
CREATE TABLE public.inventory_stock (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL,
  ingredient_id UUID NOT NULL,
  total_inventory NUMERIC(10, 2) NULL DEFAULT 0.00,
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  CONSTRAINT inventory_stock_pkey PRIMARY KEY (id),
  CONSTRAINT unique_warehouse_ingredient UNIQUE (warehouse_id, ingredient_id),
  CONSTRAINT inventory_stock_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses (id) ON DELETE CASCADE,
  CONSTRAINT inventory_stock_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- 11. BẢNG ĐỊNH LƯỢNG MÓN ĂN (Recipes - Đồng bộ với menu_items của bạn)
CREATE TABLE public.recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL, -- Liên kết trực tiếp tới bảng menu_items của bạn
  ingredient_id UUID NOT NULL,
  quantity_required NUMERIC(10, 4) NOT NULL, -- Định lượng tính bằng đơn vị cơ bản (g, ml)
  note TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  CONSTRAINT recipes_pkey PRIMARY KEY (id),
  CONSTRAINT unique_recipe_item UNIQUE (menu_item_id, ingredient_id),
  CONSTRAINT recipes_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items (id) ON DELETE CASCADE,
  CONSTRAINT recipes_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients (id) ON DELETE RESTRICT
) TABLESPACE pg_default;

-- 12. BẢNG NHẬT KÝ BIẾN ĐỘNG KHO (Audit Log)
CREATE TABLE public.inventory_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL,
  ingredient_id UUID NOT NULL,
  batch_id UUID NULL,
  transaction_type TEXT NOT NULL, -- 'IN_PURCHASE', 'OUT_SALE', 'OUT_WASTE', 'ADJUST'
  reference_id UUID NULL,
  quantity NUMERIC(10, 2) NOT NULL, -- Số dương khi nhập, số âm khi xuất
  uom_used TEXT NOT NULL,
  created_by UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  CONSTRAINT inventory_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT inventory_transactions_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses (id) ON DELETE RESTRICT,
  CONSTRAINT inventory_transactions_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients (id) ON DELETE RESTRICT,
  CONSTRAINT inventory_transactions_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.inventory_batches (id) ON DELETE SET NULL
) TABLESPACE pg_default;

-- Hàm xử lý quy đổi tự động trước khi lưu chi tiết phiếu nhập
CREATE OR REPLACE FUNCTION public.fn_auto_convert_uom_on_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_base_uom TEXT;
    v_factor NUMERIC(10,4);
BEGIN
    -- 1. Lấy đơn vị cơ bản của nguyên liệu
    SELECT base_uom INTO v_base_uom FROM public.ingredients WHERE id = NEW.ingredient_id;
    
    -- 2. Tính tổng thành tiền dòng hàng
    NEW.total_price := NEW.quantity_uom * NEW.price_per_uom;

    -- 3. Nếu đơn vị nhập trùng với đơn vị gốc -> không cần quy đổi
    IF NEW.uom_used = v_base_uom THEN
        NEW.base_quantity := NEW.quantity_uom;
        NEW.base_price := NEW.price_per_uom;
    ELSE
        -- Tìm tỷ lệ quy đổi trong bảng uom_conversions
        SELECT conversion_factor INTO v_factor 
        FROM public.uom_conversions 
        WHERE ingredient_id = NEW.ingredient_id AND alternative_uom = NEW.uom_used;
        
        -- Nếu tìm thấy hệ số quy đổi thì nhân/chia tự động
        IF FOUND THEN
            NEW.base_quantity := NEW.quantity_uom * v_factor;
            NEW.base_price := NEW.total_price / NEW.base_quantity;
        ELSE
            -- Nếu không thiết lập quy đổi, báo lỗi chặn insert để tránh sai dữ liệu kho
            RAISE EXCEPTION 'Chưa cấu hình quy đổi đơn vị từ % sang % cho nguyên liệu này.', NEW.uom_used, v_base_uom;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Gắn trigger vào bảng chi tiết phiếu nhập kho
CREATE TRIGGER trg_auto_convert_uom
BEFORE INSERT OR UPDATE ON public.purchase_order_details
FOR EACH ROW EXECUTE FUNCTION public.fn_auto_convert_uom_on_insert();
