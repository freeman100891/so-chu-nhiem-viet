# Nhật Ký Thay Đổi (CHANGELOG)

## [1.3.0] - 2026-08-14

### Bổ Sung Mới (Added)
- **Hệ Thống 17 Cấp Bậc Thi Đua (Emulation Rank System):**
  - Chuẩn hóa đúng **17 cấp bậc thi đua sư phạm** từ *Binh nhì (0đ)* đến *Đại tướng (800đ)* qua 4 nhóm cấp: *Hạ sĩ quan & Binh sĩ, Cấp Úy, Cấp Tá, Cấp Tướng*.
  - Bộ huy hiệu Insignia 100% Pure Vector SVG sắc nét, không tải tài nguyên từ Internet, tương thích trọn vẹn 3 chủ đề văn hóa.
  - Cơ chế **Single Source of Truth**: điểm tính toán động từ `pointEntries`, tuyệt đối không lưu cột tĩnh trong `students`.
  - Tự động thăng cấp tức thời sau khi ghi nhận điểm thi đua thành công qua `RankIntegrationService`.
  - Hộp thoại Vinh danh Thăng cấp (`PromotionCelebrationModal`) với hiệu ứng Pháo hoa Confetti Canvas, hỗ trợ `prefers-reduced-motion` và âm thanh Fanfare tổng hợp từ Web Audio API.
  - Đồng bộ sự kiện thăng cấp sang màn hình Trình chiếu lớp học (`LiveClassroomPresentPage`) bảo mật thông tin riêng tư (không hiển thị điểm trừ, hạ cấp hay ghi chú nhạy cảm).
  - Trang Quản lý Cấp Bậc 4 Tab chuyên sâu tại `/conduct/ranks`:
    1. *Tổng quan:* Thẻ KPI 4 nhóm cấp, cấp phổ biến nhất, học sinh vừa thăng cấp, học sinh gần đạt cấp mới, biểu đồ phân bố 17 cấp.
    2. *Học sinh:* Bảng học sinh với bộ lọc đa chiều (lớp, nhóm cấp, cấp cụ thể, gần thăng cấp, vừa thăng cấp) và modal chi tiết.
    3. *Cấu hình:* Bảng chỉnh sửa ngưỡng 17 cấp, chọn phạm vi tính điểm, chọn lớp áp dụng, chọn Achievement / Dynamic mode, nút xem trước tác động (`previewConfigurationImpact`) và sinh ngưỡng đều.
    4. *Lịch sử:* Nhật ký audit log các lượt thăng/hạ cấp với bộ lọc thời gian và loại thay đổi.
  - Hiển thị cấp bậc đồng bộ tại Hồ sơ học sinh (`StudentDetailPage`), Danh sách học sinh (`StudentsPage`), Hàng đợi đã gọi (`CalledStudentsQueue`) và Bảng điều khiển (`DashboardPage`).
  - Nâng cấp hệ thống Sao lưu & Khôi phục (`.gvcn-backup`): bảo tồn toàn vẹn 4 bảng rank, tự động tương thích ngược cho file backup cũ và cơ chế Auto Pre-Restore Rollback.

### Nâng Cấp Schema (Database Migration)
- Mở rộng cơ sở dữ liệu IndexedDB bổ sung 4 bảng: `rankSystems`, `rankSystemClasses`, `rankLevels`, `studentRankHistory` và thuộc tính `countsTowardRank` trong `pointCategories`.

---

## [1.2.0] - 2026-08-14

### Bổ Sung Mới (Added)
- **Module Lớp Học Trực Tuyến (Live Classroom):**
  - Khởi tạo phiên dạy trực tuyến 8 bước hỗ trợ Google Meet, Zoom, MS Teams.
  - Bảng điều khiển Giáo viên (Teacher Console) & Màn hình chiếu Học sinh (Presentation View).
  - Tích hợp 8 công cụ trực quan: Quay tên ngẫu nhiên Web Crypto (không lặp vòng), Đồng hồ đếm giờ/bấm giờ chính xác khi reload, Chia nhóm nhanh, Hàng đợi giơ tay phát biểu, Câu hỏi nhanh A/B/C/D, Bảng viết canvas xuất PNG, Tạo mã QR tài liệu 100% cục bộ, Màn hình nghỉ giải lao.
  - Floating Tool Dock bar & Phím tắt bàn phím (`F`, `R`, `T`, `G`, `Escape`).
  - Thao tác nhanh trực tiếp trên thẻ học sinh (`+1`, `+2`, `+🗣`, `-`), Multi-select chọn hàng loạt, Nút Hoàn tác 10s.
  - Đồng bộ trạng thái điểm danh sang Sổ điểm danh chính không gây trùng lặp.
  - Xuất báo cáo chi tiết Excel (`.xlsx`) và PDF tóm tắt 100% offline.
  - Phục hồi sự cố phiên chưa kết thúc (Disaster Recovery).
  - Tối ưu hiệu năng render 50 học sinh bằng `React.memo(StudentCard)`.

### Nâng Cấp Schema (Database Migration)
- Tăng phiên bản cơ sở dữ liệu IndexedDB từ `v5` lên `v6` bổ sung 5 bảng: `liveClassSessions`, `liveClassParticipants`, `liveClassGroups`, `liveClassGroupMembers`, `liveClassEvents`.
