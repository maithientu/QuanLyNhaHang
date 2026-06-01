-- Chỉ cho phép ĐỌC (SELECT) dữ liệu từ phía giao diện
CREATE POLICY "Allow read access to authenticated users" ON public.ingredients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated users" ON public.warehouses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated users" ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated users" ON public.ingredient_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to authenticated users" ON public.recipes FOR SELECT TO authenticated USING (true);
