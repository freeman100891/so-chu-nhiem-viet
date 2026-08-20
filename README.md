# 🇻🇳 Sổ Chủ Nhiệm Việt Offline (PWA) - Phiên bản v1.0.0

> **Ứng dụng Web PWA Offline độc lập dành cho Giáo viên Chủ nhiệm quản lý từ 2–3 lớp học và 150 học sinh tại Việt Nam.**  
> **100% Lưu trữ Nội bộ (IndexedDB) • KHÔNG phụ thuộc Internet • KHÔNG Telemetry/Analytics • Bảo mật Tuyệt đối.**

---

## 🌟 Tính Năng Nổi Bật

1. **Cài Đặt & Hoạt Động Offline 100% (PWA):**
   - Tải nhanh tức thì sau lần truy cập đầu tiên.
   - Hoạt động hoàn toàn không cần kết nối mạng Internet.
   - Precache Service Worker tự động bảo vệ dữ liệu.

2. **Quản Lý Lớp Học & Nhập/Xuất Excel (ExcelJS):**
   - Quản lý từ 2-3 lớp, tối đa 150 học sinh.
   - Nhập danh sách học sinh từ file Excel `.xlsx` với Wizard 4 bước trực quan.
   - Tự động phòng chống **Formula Injection** (`=`, `+`, `-`, `@`), xử lý **Excel Serial Date Number** (e.g. `39448` ➔ `2008-01-01`).
   - Đọc & nhập dữ liệu trong Dexie Transaction với cơ chế Rollback 100% nếu có lỗi.

3. **Điểm Danh Hằng Ngày & Tỷ Lệ Chuyên Cần:**
   - Khống chế duy nhất 1 phiên điểm danh per Lớp/Ngày (`&[classId+sessionDate]`).
   - Mặc định 100% Có mặt. Thao tác 1-touch màu sắc trực quan (*Có mặt, Vắng có phép, Vắng không phép, Đi muộn, Về sớm*).
   - Tự động khóa phiên (`isLocked: true`) và tính tỷ lệ chuyên cần.

4. **Hệ Thống 17 Cấp Bậc Thi Đua (Emulation Rank System):**
   - Đúng **17 cấp bậc thi đua sư phạm** từ *Binh nhì (0đ)* đến *Đại tướng (800đ)* phân bổ qua 4 nhóm cấp bậc: *Hạ sĩ quan & Binh sĩ, Cấp Úy, Cấp Tá, Cấp Tướng*.
   - 100% Vector SVG Insignia sắc nét, thuần offline, tương thích cả 3 chủ đề văn hóa.
   - Tính toán động từ `pointEntries` (Zero N+1 Query, Single Source of Truth).
   - Tự động thăng cấp tức thời kèm hiệu ứng Pháo hoa Confetti, âm thanh Fanfare Web Audio và Modal chúc mừng sư phạm.
   - Màn hình Trình chiếu (Presentation View) đồng bộ vinh danh thăng cấp thời gian thực và bảo vệ quyền riêng tư tuyệt đối.
   - Hai chế độ linh hoạt: *Achievement Mode* (Thành tích, không tự động hạ cấp) và *Dynamic Mode* (Cấp bậc biến động theo điểm).
   - Quản lý 4 Tab chuyên sâu tại `/conduct/ranks`: *Tổng quan, Danh sách học sinh, Cấu hình ngưỡng 17 cấp & Lịch sử audit log*.

5. **Hồ Sơ Học Sinh Toàn Diện & Sổ Liên Lạc Phụ Huynh:**
   - 7 Phân loại ghi chú (*Học tập, Nề nếp, Năng lực, Phẩm chất, Sức khỏe, Hoàn cảnh, Khác*).
   - Ghim ghi chú quan trọng lên đầu. Tự động ẩn ghi chú *Sức khỏe* và *Hoàn cảnh* khỏi bảng công khai để bảo vệ quyền riêng tư.
   - Danh bạ phụ huynh đa liên hệ (`isPrimary`) & Nhật ký trao đổi phụ huynh trực tuyến.

6. **Sao Lưu & Khôi Phục Mã Hóa An Toàn (`.gvcn-backup`):**
   - Mã hóa chuẩn **PBKDF2 (100.000 vòng lặp)** & **AES-GCM 256-bit** với mật khẩu tùy chọn.
   - Tự động Pre-Restore Backup trước khi khôi phục dữ liệu.
   - Tùy chọn File System Access API hoặc tải file truyền thống.

7. **3 Chủ Đề Giao Diện Văn Hóa Việt Nam (Design Tokens):**
   - **Hành Quân Tri Thức (`military`):** Xanh rêu, Kaki, Đỏ cờ & Vàng sao.
   - **Sắc Màu 54 Dân Tộc (`ethnic`):** Chàm, Đỏ đất, Vàng ấm & Xanh ngọc.
   - **Đất Nước Ba Miền (`regions`):** Xanh núi / Đồng ruộng, Đỏ gạch & Vàng nắng.

8. **Module Lớp Học Trực Tuyến (Live Classroom):**
   - Hỗ trợ dạy trực tuyến qua Google Meet, Zoom, MS Teams.
   - Bảng điều khiển Giáo viên & Màn hình chiếu Tuyên dương Học sinh (BroadcastChannel API).
   - 8 Công cụ trực quan: Quay tên ngẫu nhiên Web Crypto không lặp vòng, Đồng hồ đếm giờ chuẩn khi F5, Chia nhóm nhanh, Hàng đợi giơ tay phát biểu, Câu hỏi nhanh A/B/C/D, Bảng viết canvas xuất PNG, Tạo mã QR 100% cục bộ, Màn hình nghỉ giải lao.
   - Nút hoàn tác 10s, đồng bộ sổ điểm danh chính, xuất báo cáo Excel/PDF 100% offline.

---

## 📱 Hướng Dẫn Cài Đặt Ứng Dụng PWA

### 1. Trên Máy Tính (Desktop - Chrome / Edge)
1. Mở trình duyệt Chrome hoặc Microsoft Edge và truy cập ứng dụng.
2. Bấm vào biểu tượng **Cài đặt (Install)** trên thanh địa chỉ (URL bar) hoặc góc phải trình duyệt.
3. Chọn **Cài đặt (Install)**. Ứng dụng sẽ xuất hiện dưới dạng một cửa sổ ứng dụng độc lập trên Desktop.

### 2. Trên Điện Thoại Android (Chrome)
1. Mở Chrome trên Android.
2. Bấm nút **Menu 3 chấm** ở góc trên bên phải.
3. Chọn **"Thêm vào Màn hình chính" (Add to Home Screen)** hoặc **"Cài đặt ứng dụng"**.

### 3. Trên iPhone / iPad (Safari)
1. Mở Safari trên iOS.
2. Bấm vào biểu tượng **Chia sẻ (Share)** ở thanh công cụ phía dưới.
3. Cuộn xuống và chọn **"Thêm vào Màn hình chính" (Add to Home Screen)**.

---

## 🛡️ Hướng Dẫn Sao Lưu & Khôi Phục Dữ Liệu

1. **Thao tác Sao lưu (Backup):**
   - Truy cập mục **Sao lưu** từ menu chính.
   - Nhập mật khẩu bảo vệ tùy chọn (Khuyên dùng để mã hóa AES-GCM 256-bit).
   - Bấm **"Tải File Sao Lưu Về Máy"**. File có định dạng `SoChuNhiem_YYYY-MM-DD_HH-mm.gvcn-backup`.

2. **Thao tác Khôi phục (Restore):**
   - Chọn file `.gvcn-backup` từ máy tính.
   - Nhập mật khẩu đã đặt khi sao lưu (nếu có).
   - Hệ thống sẽ tự động tạo một bản **Pre-Restore Auto-Backup** trước khi khôi phục để đảm bảo an toàn tuyệt đối.

---

## ❓ Xử Lý Sự Cố (Troubleshooting)

- **Sự cố: Trình duyệt tự xóa bộ nhớ IndexedDB khi hết đĩa.**
  - *Khắc phục:* Vào mục **Quản lý lưu trữ & Bảo mật** -> Bấm **"Yêu cầu Lưu trữ Bền Vững (Persistent Storage)"** để trình duyệt bảo vệ bộ nhớ ứng dụng.
- **Sự cố: Quên mật khẩu mã hóa file sao lưu.**
  - *Khắc phục:* Do nguyên tắc bảo mật zero-knowledge, ứng dụng không lưu mật khẩu. Vui lòng sử dụng file sao lưu không mật khẩu hoặc nhớ chính xác mật khẩu đã đặt.

---

## 📄 License & Version
- **Version:** v1.0.0 (Production Release)
- **License:** MIT License. Dành riêng cho giáo viên Việt Nam.
