# Kiến Trúc Hệ Thống: Sổ Chủ Nhiệm Việt Offline

## 1. Tổng Quan Kiến Trúc
Ứng dụng **Sổ Chủ Nhiệm Việt Offline** được thiết kế theo mô hình **Local-First PWA**:
- **Trình duyệt (Browser):** Chạy 100% ứng dụng Single Page Application (React + Vite + TypeScript).
- **Lưu trữ dữ liệu:** Trực tiếp trên thiết bị người dùng qua **IndexedDB** (Thư viện Dexie.js).
- **Không backend / Serverless:** Đảm bảo dữ liệu riêng tư tối đa cho giáo viên và học sinh, hoạt động trơn tru khi không có kết nối Internet.

---

## 2. Các Module Chính
1. **Quản lý học sinh & Hồ sơ:** Lưu trữ lý lịch, thông tin phụ huynh, tình trạng sức khỏe, hoàn cảnh.
2. **Sổ Điểm Danh Chính:** Quản lý điểm danh hàng ngày, theo dõi lý do vắng và xuất báo cáo.
3. **Sổ Thi Đua & Nề Nếp:** Ghi nhận điểm cộng/trừ thi đua theo danh mục tích cực và vi phạm.
4. **Lớp Học Trực Tuyến (Live Classroom):** Bảng điều khiển giảng dạy từ xa qua Meet/Zoom/Teams với đồng hồ thời gian thực, quay số ngẫu nhiên không lặp vòng, công cụ bảng viết canvas, mã QR tài liệu và đồng bộ màn hình chiếu Presentation View bằng BroadcastChannel API.
5. **Sao lưu & Khôi phục (Backup & Restore):** Đóng gói toàn bộ cơ sở dữ liệu IndexedDB thành file JSON đính kèm checksum MD5/SHA256, hỗ trợ khôi phục an toàn.
