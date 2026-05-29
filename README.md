Bước 1 — Cập nhật code mới nhất:
- git checkout main
- git pull origin main

Bước 2 — Tạo nhánh mới cho tính năng đang làm:
- git checkout -b feature/ten-tinh-nang
Ví dụ tên nhánh theo phân công:
feature/dang-nhap        ← thành viên làm đăng nhập

feature/kitchen-kds      ← thành viên làm bếp

feature/thanh-toan       ← thành viên làm thanh toán

feature/gui-bep          ← nhóm trưởng làm gửi bếp

Bước 3 — Lưu tiến độ thường xuyên
- git add .
- git commit -m "mô tả ngắn việc vừa làm"

Bước 4 — Đẩy code lên GitHub:
- git push origin feature/ten-tinh-nang

Bước 5 — Tạo Pull Request trên GitHub:
- Vào repo GitHub → thấy thông báo vàng "Compare & pull request"
- Nhấn vào đó
- Viết mô tả ngắn đã làm gì
- Nhấn "Create pull request"
- Nhắn nhóm trưởng vào review

Nhóm trưởng review và merge
Bước 6 — Review Pull Request:
- Vào GitHub → tab "Pull requests"
- Xem code thay đổi
- Nếu ổn → nhấn "Merge pull request"
- Nếu cần sửa → nhấn "Request changes" và comment chỗ cần sửa

Khi thành viên khác merge xong
Bước 7 — Cập nhật code mới về máy:
- git checkout main
- git pull origin main
- git checkout feature/ten-tinh-nang-cua-ban
- git merge develop

