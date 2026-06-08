-- 1. Bổ sung cột lương theo giờ vào bảng profiles hiện tại của bạn
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC NOT NULL DEFAULT 0;

-- COMMENT giải thích cho cột mới
COMMENT ON COLUMN public.profiles.hourly_rate IS 'Mức lương theo giờ của nhân viên (VND)';


-- 2. Tạo bảng danh mục Ca làm việc (Shifts)
CREATE TABLE public.shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  shift_name TEXT NOT NULL,                -- Ví dụ: Ca Sáng, Ca Chiều, Ca Gãy
  start_time TIME NOT NULL,                -- Giờ bắt đầu (Ví dụ: 06:00:00)
  end_time TIME NOT NULL,                  -- Giờ kết thúc (Ví dụ: 12:00:00)
  total_hours NUMERIC(4,2) NOT NULL,       -- Tổng số giờ tính công (Ví dụ: 6.0 hoặc 5.5)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT shifts_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;


-- 3. Tạo bảng Nhật ký chấm công hàng ngày (Attendance Logs)
CREATE TABLE public.attendance_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL,               -- ID nhân viên được chấm công
  shift_id UUID NOT NULL,                  -- ID ca làm việc
  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE, -- Ngày chấm công
  
  -- Trạng thái: present (đúng giờ), late (đi muộn), absent_excused (vắng có phép), absent_unexcused (vắng không phép)
  status TEXT NOT NULL DEFAULT 'present',  
  late_minutes INT NOT NULL DEFAULT 0,     -- Số phút đi muộn (nếu có)
  note TEXT NULL,                          -- Ghi chú/Lý do đi muộn hoặc vắng
  
  approved_by UUID NULL,                   -- ID người quản lý duyệt (Nối với profiles.id)
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,-- TRUE khi đã "Chốt công ngày", không cho sửa nữa
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT attendance_logs_pkey PRIMARY KEY (id),
  
  -- Khóa ngoại liên kết tới các bảng khác
  CONSTRAINT attendance_logs_employee_fkey FOREIGN KEY (employee_id) REFERENCES public.profiles (id) ON DELETE CASCADE,
  CONSTRAINT attendance_logs_shift_fkey FOREIGN KEY (shift_id) REFERENCES public.shifts (id) ON DELETE RESTRICT,
  CONSTRAINT attendance_logs_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.profiles (id) ON DELETE SET NULL,
  
  -- Ràng buộc tránh việc 1 nhân viên bị chấm trùng 1 ca trong cùng 1 ngày
  CONSTRAINT unique_employee_shift_date UNIQUE (employee_id, shift_id, attendance_date)
) TABLESPACE pg_default;

-- Tự động cập nhật updated_at cho bảng attendance_logs
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_attendance_logs_modtime
    BEFORE UPDATE ON public.attendance_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

INSERT INTO public.shifts (shift_name, start_time, end_time, total_hours)
VALUES 
  ('Ca Sáng', '06:00:00', '12:00:00', 6.0),
  ('Ca Chiều', '12:00:00', '18:00:00', 6.0),
  ('Ca Tối', '18:00:00', '23:00:00', 5.0);

-- 1. Tạo kiểu dữ liệu Enum mới cho trạng thái chấm công
CREATE TYPE public.attendance_status AS ENUM (
  'present',           -- Đúng giờ
  'late',              -- Đi muộn
  'absent_excused',    -- Vắng có phép
  'absent_unexcused'   -- Vắng không phép
);

-- 2. Tạm thời xóa giá trị mặc định 'present' cũ (đang là dạng TEXT) để chuẩn bị đổi kiểu dữ liệu
ALTER TABLE public.attendance_logs 
ALTER COLUMN status DROP DEFAULT;

-- 3. Chuyển đổi kiểu dữ liệu của cột 'status' từ TEXT sang Enum 'attendance_status'
ALTER TABLE public.attendance_logs 
ALTER COLUMN status TYPE public.attendance_status 
USING status::public.attendance_status;

-- 4. Thiết lập lại giá trị mặc định cho cột là 'present' (nhưng giờ là kiểu Enum)
ALTER TABLE public.attendance_logs 
ALTER COLUMN status SET DEFAULT 'present'::public.attendance_status;