-- Tạo bảng categories
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Kích hoạt RLS cho bảng categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Cho phép tất cả người dùng (bao gồm anonymous) đọc categories
CREATE POLICY "Public categories are viewable by everyone."
ON public.categories FOR SELECT
USING (true);

-- Cho phép người dùng đã xác thực (auth.uid() is not null) tạo, cập nhật, xóa categories
-- Sẽ cần refined hơn với vai trò (roles) sau
CREATE POLICY "Authenticated users can manage categories."
ON public.categories FOR ALL
USING (auth.uid() IS NOT NULL);


-- Tạo bảng menu_items
CREATE TABLE public.menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL, -- Xóa category thì set null
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (name, category_id) -- Đảm bảo tên món ăn là duy nhất trong một category
);

-- Kích hoạt RLS cho bảng menu_items
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Cho phép tất cả người dùng đọc menu_items
CREATE POLICY "Public menu_items are viewable by everyone."
ON public.menu_items FOR SELECT
USING (true);

-- Cho phép người dùng đã xác thực tạo, cập nhật, xóa menu_items
-- Sẽ cần refined hơn với vai trò (roles) sau
CREATE POLICY "Authenticated users can manage menu_items."
ON public.menu_items FOR ALL
USING (auth.uid() IS NOT NULL);

-- Thêm một index cho category_id để cải thiện hiệu suất truy vấn
CREATE INDEX idx_menu_items_category_id ON public.menu_items (category_id);