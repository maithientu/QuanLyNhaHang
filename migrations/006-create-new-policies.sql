-- =============================================================================
-- 1. CHÈN NHÓM NGUYÊN LIỆU (Tự sinh UUID và trả về ID bằng lệnh RETURNING)
-- =============================================================================
WITH inserted_categories AS (
  INSERT INTO public.ingredient_categories (name, description) VALUES
    ('Thịt tươi sống', 'Các loại thịt gia súc, gia cầm tươi'),
    ('Hải sản tươi', 'Tôm, cua, cá, mực tươi sống'),
    ('Rau củ quả tươi', 'Rau ăn kèm, rau lẩu và trái cây pha chế'),
    ('Gia vị & Hàng khô', 'Các loại phô mai, mật ong, hàng khô đóng gói'),
    ('Đồ uống & Giải khát', 'Bia, nước ngọt, nước đóng chai')
  ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name -- Chống trùng lặp tên nhóm
  RETURNING id, name
),

-- =============================================================================
-- 2. CHÈN NGUYÊN LIỆU GỐC (Bốc UUID của nhóm nguyên liệu ở trên đập vào khóa ngoại)
-- =============================================================================
inserted_ingredients AS (
  INSERT INTO public.ingredients (category_id, code, name, base_uom, min_stock_level) VALUES
    ((SELECT id FROM inserted_categories WHERE name = 'Thịt tươi sống'), 'NL-BO', 'Thịt bò thắt lưng', 'g', 5000),
    ((SELECT id FROM inserted_categories WHERE name = 'Thịt tươi sống'), 'NL-GA', 'Gà ta nguyên con', 'g', 10000),
    ((SELECT id FROM inserted_categories WHERE name = 'Thịt tươi sống'), 'NL-HEO', 'Thịt heo nạc xay', 'g', 5000),
    ((SELECT id FROM inserted_categories WHERE name = 'Hải sản tươi'), 'NL-TOMHUM', 'Tôm hùm bông', 'g', 2000),
    ((SELECT id FROM inserted_categories WHERE name = 'Hải sản tươi'), 'NL-CUA', 'Cua biển Cà Mau', 'g', 3000),
    ((SELECT id FROM inserted_categories WHERE name = 'Hải sản tươi'), 'NL-TOM', 'Tôm thẻ lột vỏ', 'g', 3000),
    ((SELECT id FROM inserted_categories WHERE name = 'Hải sản tươi'), 'NL-MUC', 'Mực ống tươi', 'g', 2000),
    ((SELECT id FROM inserted_categories WHERE name = 'Rau củ quả tươi'), 'NL-BOQUA', 'Quả bơ sáp', 'g', 3000),
    ((SELECT id FROM inserted_categories WHERE name = 'Rau củ quả tươi'), 'NL-CAM', 'Quả cam sành', 'g', 5000),
    ((SELECT id FROM inserted_categories WHERE name = 'Đồ uống & Giải khát'), 'NL-BIATIGER', 'Bia Tiger', 'lon', 48),
    ((SELECT id FROM inserted_categories WHERE name = 'Gia vị & Hàng khô'), 'NL-MATONG', 'Mật ong rừng', 'ml', 1000),
    ((SELECT id FROM inserted_categories WHERE name = 'Gia vị & Hàng khô'), 'NL-PHOMAI', 'Phô mai Mozzarella', 'g', 2000),
    ((SELECT id FROM inserted_categories WHERE name = 'Gia vị & Hàng khô'), 'NL-BANHTRANG', 'Bánh tráng cuốn', 'cái', 200)
  ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name -- Chống trùng lặp mã vật tư
  RETURNING id, name, base_uom
),

-- =============================================================================
-- 3. CHÈN QUY ĐỔI ĐƠN VỊ TÍNH (Bốc UUID nguyên liệu ở trên làm khóa ngoại)
-- =============================================================================
inserted_uoms AS (
  INSERT INTO public.uom_conversions (ingredient_id, alternative_uom, conversion_factor) VALUES
    ((SELECT id FROM inserted_ingredients WHERE name = 'Bia Tiger'), 'Thùng', 24.0000),
    ((SELECT id FROM inserted_ingredients WHERE name = 'Thịt bò thắt lưng'), 'Kg', 1000.0000),
    ((SELECT id FROM inserted_ingredients WHERE name = 'Gà ta nguyên con'), 'Kg', 1000.0000),
    ((SELECT id FROM inserted_ingredients WHERE name = 'Tôm thẻ lột vỏ'), 'Kg', 1000.0000)
  ON CONFLICT (ingredient_id, alternative_uom) DO NOTHING
)

-- =============================================================================
-- 4. CHÈN THÔNG TIN ĐỐI TÁC NHÀ CUNG CẤP & KHO
-- =============================================================================
INSERT INTO public.suppliers (name, phone, address, current_debt) VALUES
  ('Tổng kho Thực phẩm & Hải sản tươi sống sạch Đông Hải', '0912345678', 'Chợ đầu mối Bình Điền, Quận 8, TP. HCM', 0.00),
  ('大 lý Rau củ quả & Trái cây nhiệt đới Mekong', '0987654321', 'Chợ đầu mối Thủ Đức, TP. Thủ Đức', 0.00),
  ('Nhà phân phối Nước giải khát & Bia Sài Gòn - Chợ Lớn', '02838555666', 'Đường Trần Hưng Đạo, Quận 5, TP. HCM', 0.00);

INSERT INTO public.warehouses (name, address) VALUES
  ('Kho Tổng Tại Quán', 'Khu vực bếp tầng trệt');


-- =============================================================================
-- 1. BẢNG QUY ĐỔI ĐƠN VỊ TÍNH (uom_conversions)
-- =============================================================================
DROP POLICY IF EXISTS "Allow read access for authenticated" ON public.uom_conversions;
DROP POLICY IF EXISTS "Allow insert access for authenticated" ON public.uom_conversions;
CREATE POLICY "Allow read access for authenticated" ON public.uom_conversions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert access for authenticated" ON public.uom_conversions FOR INSERT TO authenticated WITH CHECK (true);

-- =============================================================================
-- 2. BẢNG PHIẾU NHẬP KHO (purchase_orders)
-- =============================================================================
DROP POLICY IF EXISTS "Allow read access for authenticated" ON public.purchase_orders;
DROP POLICY IF EXISTS "Allow insert access for authenticated" ON public.purchase_orders;
CREATE POLICY "Allow read access for authenticated" ON public.purchase_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert access for authenticated" ON public.purchase_orders FOR INSERT TO authenticated WITH CHECK (true);

-- =============================================================================
-- 3. BẢNG CHI TIẾT PHIẾU NHẬP KHO (purchase_order_details)
-- =============================================================================
DROP POLICY IF EXISTS "Allow read access for authenticated" ON public.purchase_order_details;
DROP POLICY IF EXISTS "Allow insert access for authenticated" ON public.purchase_order_details;
CREATE POLICY "Allow read access for authenticated" ON public.purchase_order_details FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert access for authenticated" ON public.purchase_order_details FOR INSERT TO authenticated WITH CHECK (true);

-- =============================================================================
-- 4. BẢNG LÔ HÀNG HẠN SỬ DỤNG (inventory_batches)
-- =============================================================================
DROP POLICY IF EXISTS "Allow read access for authenticated" ON public.inventory_batches;
DROP POLICY IF EXISTS "Allow insert access for authenticated" ON public.inventory_batches;
CREATE POLICY "Allow read access for authenticated" ON public.inventory_batches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert access for authenticated" ON public.inventory_batches FOR INSERT TO authenticated WITH CHECK (true);

-- =============================================================================
-- 5. BẢNG TỔNG HỢP TỒN KHO THỰC TẾ (inventory_stock)
-- =============================================================================
DROP POLICY IF EXISTS "Allow read access for authenticated" ON public.inventory_stock;
DROP POLICY IF EXISTS "Allow insert_update access for authenticated" ON public.inventory_stock;
CREATE POLICY "Allow read access for authenticated" ON public.inventory_stock FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert_update access for authenticated" ON public.inventory_stock FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================================================
-- 6. BẢNG SỔ CÁI BIẾN ĐỘNG CÔNG NỢ (supplier_debt_ledger)
-- =============================================================================
DROP POLICY IF EXISTS "Allow read access for authenticated" ON public.supplier_debt_ledger;
DROP POLICY IF EXISTS "Allow insert access for authenticated" ON public.supplier_debt_ledger;
CREATE POLICY "Allow read access for authenticated" ON public.supplier_debt_ledger FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert access for authenticated" ON public.supplier_debt_ledger FOR INSERT TO authenticated WITH CHECK (true);

-- =============================================================================
-- 7. BẢNG NHẬT KÝ BIẾN ĐỘNG KHO AUDIT LOG (inventory_transactions)
-- =============================================================================
DROP POLICY IF EXISTS "Allow read access for authenticated" ON public.inventory_transactions;
DROP POLICY IF EXISTS "Allow insert access for authenticated" ON public.inventory_transactions;
CREATE POLICY "Allow read access for authenticated" ON public.inventory_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow insert access for authenticated" ON public.inventory_transactions FOR INSERT TO authenticated WITH CHECK (true);

-- =============================================================================
-- 8. BỔ SUNG LUẬT GHI CHO CÁC BẢNG DANH MỤC GỐC ĐÃ CÓ LUẬT ĐỌC (Ingredients, Suppliers, Recipes)
-- =============================================================================
DROP POLICY IF EXISTS "Allow insert access for authenticated" ON public.ingredients;
DROP POLICY IF EXISTS "Allow insert access for authenticated" ON public.suppliers;
DROP POLICY IF EXISTS "Allow insert_all access for authenticated" ON public.recipes;

CREATE POLICY "Allow insert access for authenticated" ON public.ingredients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow insert access for authenticated" ON public.suppliers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow insert_all access for authenticated" ON public.recipes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Chạy lệnh này để bổ sung 2 trường quản lý chiết khấu chuyên nghiệp
ALTER TABLE public.purchase_orders 
ADD COLUMN discount_rate numeric(12, 2) NULL DEFAULT 0.00,
ADD COLUMN discount_type text NULL DEFAULT 'cash';

-- Ép Supabase làm mới bộ nhớ đệm để API nhận cột mới ngay lập tức
NOTIFY pgrst, 'reload schema';

CREATE POLICY "Allow update access for authenticated" 
ON public.suppliers
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- =========================================================================
-- 🔑 1. BỔ SUNG QUYỀN UPDATE CHO BẢNG PURCHASE_ORDERS (ĐỂ ĐỔI MÀU TRẠNG THÁI PHIẾU)
-- =========================================================================
CREATE POLICY "Allow update access for authenticated" 
ON public.purchase_orders
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- 1. Cấp quyền giảm số lượng tổng tồn kho (Sửa dòng)
CREATE POLICY "Allow update access for authenticated" 
ON public.inventory_stock FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 2. Cấp quyền xóa các lô hàng thuộc phiếu bị hủy (Xóa dòng)
CREATE POLICY "Allow delete access for authenticated" 
ON public.inventory_batches FOR DELETE TO authenticated USING (true);

-- 3. Cấp quyền cập nhật trạng thái phiếu gốc sang VOIDED (Sửa dòng)
CREATE POLICY "Allow update status for authenticated" 
ON public.purchase_orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 4. Cấp quyền cập nhật giảm trừ số dư nợ tổng của đối tác (Sửa dòng)
CREATE POLICY "Allow update debt for authenticated" 
ON public.suppliers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 5. Cấp quyền ghi nhận dòng giảm nợ vào Sổ cái chi tiết (Thêm dòng)
CREATE POLICY "Allow insert ledger for authenticated" 
ON public.supplier_debt_ledger FOR INSERT TO authenticated WITH CHECK (true);

-- 🔑 Cấp quyền UPDATE (sửa số lượng lô về 0) cho bảng lô hàng
CREATE POLICY "Allow update access for authenticated" 
ON public.inventory_batches
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- 🔑 Cấp quyền UPDATE cho bảng lịch sử biến động (Nếu sau này cần hiệu chỉnh)
CREATE POLICY "Allow update access for authenticated" 
ON public.inventory_transactions
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- Ép Supabase xóa cache để nhận diện Policy mới ngay lập tức
NOTIFY pgrst, 'reload schema';
