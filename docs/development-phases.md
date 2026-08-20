# Lộ Trình Phát Triển Sản Phẩm (Development Phases)

Dự án **Sổ Chủ Nhiệm Việt Offline** được chia làm 4 giai đoạn triển khai chi tiết:

---

## 🟢 Giai Đoạn 1: Khởi Tạo Dự Án & Kiến Trúc Cốt Lõi (Đã Hoàn Thành)
- Cấu hình dự án React + TypeScript strict mode + Vite + Tailwind CSS + PWA Service Worker.
- Cấu hình IndexedDB Dexie (10 bảng: `teacherProfile`, `academicYears`, `classes`, `students`, `attendance`, `conductLogs`, `evaluations`, `parentContacts`, `changeLogs`, `settings`).
- Xây dựng hệ thống Repositories (`BaseRepository`, Soft Delete, Audit log transaction).
- Xây dựng bộ Zod Validation Schemas và utilities ngày tháng `YYYY-MM-DD`.
- Thiết lập 3 chủ đề giao diện Việt Nam (Truyền Thống, Hoa Sen, Hiện Đại) và bộ UI components chuẩn touch target >=44px.
- Đăng ký đầy đủ 12 Route khung, cài đặt ESLint, Error Boundary toàn cục và khung kiểm thử Vitest / Playwright.

---

## 🟡 Giai Đoạn 2: Quản Lý Hồ Sơ Giáo Viên, Năm Học/Lớp Học, Học Sinh & ExcelJS (Tiếp Theo)
- **Hồ sơ Giáo viên:** Tạo, chỉnh sửa thông tin giáo viên chủ nhiệm.
- **Năm học & Học kỳ:** Khởi tạo năm học mới (VD: 2024-2025), chọn năm học hiện tại, quản lý danh sách học kỳ (HK1, HK2).
- **Lớp học:** Quản lý các lớp chủ nhiệm (tối đa 2-3 lớp/giáo viên), chuyển đổi lớp làm việc active trên Header.
- **Hồ sơ Học sinh:** Quản lý danh sách học sinh (tối đa ~50 học sinh/lớp), chi tiết sơ yếu lý lịch, thông tin phụ huynh.
- **Nhập/Xuất ExcelJS:**
  - Nhập danh sách học sinh từ file Excel mẫu (validate dữ liệu bằng Zod trước khi lưu DB).
  - Xuất danh sách học sinh ra file Excel định dạng đẹp.

---

## 🔵 Giai Đoạn 3: Nghiệp Vụ Hàng Ngày & Đánh Giá (Daily Operations)
- **Điểm danh Hàng ngày:** Bảng điểm danh ngày (CoMat, Phep, KhongPhep, Tre), điểm danh nhanh nguyên lớp, ghi chú lý do nghỉ, thống kê theo tháng.
- **Thi đua & Nề nếp:** Ghi nhận điểm cộng/trừ thi đua (khen thưởng, vi phạm, phong trào), tự động tính tổng điểm nề nếp của lớp.
- **Nhận xét & Đánh giá:** Sổ đánh giá học lực, rèn luyện theo tháng / học kỳ, lưu trữ các lời nhận xét chi tiết.
- **Nhật ký Liên hệ Phụ huynh:** Ghi nhận lịch sử cuộc gọi, trao đổi trực tiếp, Zalo với phụ huynh học sinh.

---

## 🔴 Giai Đoạn 4: Báo Cáo, Sao Lưu/Khôi Phục, Thùng Rác & Hoàn Thiện PWA
- **Báo cáo & Thống kê:** Báo cáo tỷ lệ chuyên cần, thống kê nề nếp, xuất file báo cáo PDF / Excel in ấn.
- **Sao lưu & Khôi phục Dữ liệu:** Xuất toàn bộ cơ sở dữ liệu IndexedDB ra file JSON mã hóa/định dạng an toàn và khôi phục khi chuyển thiết bị.
- **Thùng rác & Log:** Giao diện Thùng rác khôi phục dữ liệu đã xóa tạm, xem lịch sử nhật ký audit log.
- **Hoàn thiện PWA & Testing:** Audit PWA offline, kiểm thử E2E bằng Playwright trên môi trường Mobile & Desktop.
