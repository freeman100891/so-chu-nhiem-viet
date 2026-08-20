# SỔ CHỦ NHIỆM VIỆT OFFLINE — BỘ ĐẶC TẢ KỸ THUẬT TOÀN DIỆN HỆ THỐNG
## COMPREHENSIVE SYSTEM SPECIFICATION MANUAL
> **Tài liệu chuẩn hóa chính thức dành cho:** Product Owner, Solution Architect, Senior Developers, QA Engineers & Autonomous AI Agents.  
> **Phiên bản:** `1.0.0 (PWA Offline-First)`  
> **Thời điểm xác lập:** `20/08/2026`  
> **Độ bao phủ:** 100% Mã nguồn (`37 Routes`, `83 Features`, `30 IndexedDB Tables`, `25 Modals`, `70 Test Suites / 365 Tests Passed 100%`).  

---

## 📑 MỤC LỤC BỘ TÀI LIỆU ĐẶC TẢ (SPECIFICATION SITEMAP)

Tài liệu được cấu trúc phân tầng khoa học và phân bổ thành các chương chuyên sâu tại thư mục [`docs/spec/`](file:///d:/02.Code/03.Edu/New%20folder/GVCN/docs/spec/):

1. **[SPEC-00: Tổng Quan Kiến Trúc & Bản Đồ Hệ Thống](file:///d:/02.Code/03.Edu/New%20folder/GVCN/docs/spec/00-system-overview.md)**
   - Triết lý thiết kế: 100% Offline-First, 0% Telemetry, Gamification Sư phạm.
   - Sơ đồ kiến trúc phân tầng: UI Layer $\rightarrow$ State Sync $\rightarrow$ Core Services $\rightarrow$ IndexedDB.
   - Sơ đồ cây chức năng toàn hệ thống (System Feature Tree).

2. **[SPEC-01: Bảng Danh Mục 83 Tính Năng Toàn Hệ Thống (Feature Master List)](file:///d:/02.Code/03.Edu/New%20folder/GVCN/docs/spec/01-feature-master-list.md)**
   - Bảng tra cứu mã định danh `F-001` đến `F-083` kèm Route, Bảng dữ liệu và Độ hoàn thiện (100% Stable).

3. **[SPEC-02: Phân Hệ Onboarding & Hồ Sơ Giáo Viên (F-001 -> F-005, F-083)](file:///d:/02.Code/03.Edu/New%20folder/GVCN/docs/spec/02-authentication-onboarding.md)**
   - Khởi tạo hồ sơ, danh xưng sư phạm, ảnh đại diện giáo viên, điều hướng bắt buộc và **Khôi phục toàn bộ hệ thống từ file backup (.gvcn-backup) ngay tại Onboarding (F-083)**.

4. **[SPEC-03: Phân Hệ Năm Học, Học Kỳ & Lớp Học (F-011 -> F-018)](file:///d:/02.Code/03.Edu/New%20folder/GVCN/docs/spec/03-academic-years-classes.md)**
   - Quản lý năm học, học kỳ, cảnh báo ngoài khoảng thời gian, chi tiết lớp học và chuyển lớp học sinh.

5. **[SPEC-04: Phân Hệ Hồ Sơ Học Sinh & Phụ Huynh (F-019 -> F-027)](file:///d:/02.Code/03.Edu/New%20folder/GVCN/docs/spec/04-students-parent-contacts.md)**
   - Chuẩn hóa họ tên tiếng Việt, bộ sưu tập 31+ Avatar Vector SVG, hệ thống 5 Cấp bậc Avatar Tiến hóa đồng bộ, danh bạ phụ huynh và hàng đợi gọi khẩn cấp.

6. **[SPEC-05: Phân Hệ Điểm Danh Chuyên Cần (F-028 -> F-030)](file:///d:/02.Code/03.Edu/New%20folder/GVCN/docs/spec/05-attendance-system.md)**
   - Điểm danh 1 chạm với 5 trạng thái chuyên cần, khóa sổ bảo vệ dữ liệu và biểu đồ nhiệt chuyên cần.

7. **[SPEC-06: Phân Hệ Nề Nếp & Điểm Thi Đua (F-031 -> F-036)](file:///d:/02.Code/03.Edu/New%20folder/GVCN/docs/spec/06-conduct-score-system.md)**
   - Sổ điểm thi đua, danh mục tiêu chí Cộng/Trừ, chấm điểm đơn lẻ/nhóm và cơ chế Hoàn tác điểm (Undo).

8. **[SPEC-07: Phân Hệ Cấp Bậc Quân Hàm & Vinh Danh (F-037 -> F-043)](file:///d:/02.Code/03.Edu/New%20folder/GVCN/docs/spec/07-rank-system-avatar-sync.md)**
   - 17 Cấp bậc Quân hàm Đội viên, thuật toán chống giáng cấp (Achievement Mode), hàng đợi vinh danh và modal pháo hoa rực rỡ.

9. **[SPEC-08: Phân Hệ Bảng Vàng Danh Hiệu (F-044 -> F-050)](file:///d:/02.Code/03.Edu/New%20folder/GVCN/docs/spec/08-honor-board-system.md)**
   - 8 Danh hiệu sư phạm chuẩn hóa, Wizard 4 bước, Rule Engine tự động tính toán, modal xử lý hòa điểm (Tie Resolution) và trình chiếu Fullscreen.

10. **[SPEC-09: Phân Hệ Đánh Giá Học Sinh Theo TT22 & TT27 (F-051 -> F-056)](file:///d:/02.Code/03.Edu/New%20folder/GVCN/docs/spec/09-evaluations-tt22-tt27.md)**
    - Đánh giá phẩm chất (5 tiêu chí), năng lực (3 tiêu chí) theo Thông tư 22/2021 & 27/2020 của Bộ GD&ĐT, ngân hàng mẫu nhận xét sư phạm thông minh.

11. **[SPEC-10: Phân Hệ Cửa Hàng Quà Tặng & Đổi Thưởng (F-057 -> F-061)](file:///d:/02.Code/03.Edu/New%20folder/GVCN/docs/spec/10-gifts-rewards-system.md)**
    - Danh mục quà tặng, quản lý tồn kho, đổi quà tự động trừ điểm, biên nhận đổi quà và trình chiếu showcase.

12. **[SPEC-11: Phân Hệ Lớp Học Trực Tuyến Tương Tác (F-062 -> F-073)](file:///d:/02.Code/03.Edu/New%20folder/GVCN/docs/spec/11-live-classroom.md)**
    - Lưới thẻ học sinh Fluid Clamping, hộp công cụ nổi (Bốc thăm ngẫu nhiên, Bầu chọn, Giơ tay, Bảng trắng, Giờ nghỉ, QR Code), đồng bộ 2 màn hình qua BroadcastChannel API và chốt sổ cuối tiết.

13. **[SPEC-12: Phân Hệ Báo Cáo & Thống Kê Sư Phạm (F-074 -> F-079)](file:///d:/02.Code/03.Edu/New%20folder/GVCN/docs/spec/12-reports-analytics.md)**
    - Trung tâm báo cáo KPI, đối sánh giữa các lớp, phiếu nhận xét cá nhân in ấn A4 chuẩn mực và trình chiếu họp phụ huynh tự động chuyển slide.

14. **[SPEC-13: Phân Hệ Nhập Xuất Excel, Sao Lưu & Bảo Trì (F-080 -> F-082)](file:///d:/02.Code/03.Edu/New%20folder/GVCN/docs/spec/13-import-export-backup.md)**
    - ExcelJS import/export thông minh, sao lưu mã hóa AES-GCM 256-bit (`.gvcn-backup`), Thùng rác khôi phục xóa mềm (Soft delete) và Nhật ký kiểm toán (Audit logs).

15. **[SPEC-14: Đặc Tả Data Model & Schema IndexedDB (v1 -> v14)](file:///d:/02.Code/03.Edu/New%20folder/GVCN/docs/spec/14-data-model-indexeddb.md)**
    - Chi tiết 30 bảng dữ liệu, khóa chính, chỉ mục đánh index, sơ đồ quan hệ thực thể ERD và lịch sử nâng cấp schema.

16. **[SPEC-15: Kiến Trúc Lưu Trữ, Source of Truth & Khóa Đồng Thời](file:///d:/02.Code/03.Edu/New%20folder/GVCN/docs/spec/15-storage-sync-architecture.md)**
    - Ma trận lưu trữ (IndexedDB, LocalStorage, React Context), nguyên tắc Single Source of Truth, ACID Transactions và In-Flight Promise Locks.

17. **[SPEC-16: Giao Diện, Modal, Bộ Tổng Hợp Âm Thanh & Hiệu Ứng](file:///d:/02.Code/03.Edu/New%20folder/GVCN/docs/spec/16-modals-audio-ui.md)**
    - Danh mục 25 Modals toàn hệ thống, Web Audio Synthesizer không phụ thuộc file ngoài, Canvas Confetti và UI Scale.

18. **[SPEC-17: Ma Trận Phân Quyền & 4 Luồng Nghiệp Vụ Cốt Lõi](file:///d:/02.Code/03.Edu/New%20folder/GVCN/docs/spec/17-permissions-user-flows.md)**
    - Phân quyền Giáo viên vs Trình chiếu Học sinh; 4 Sequence & Flow Diagrams (Đầu ngày, Tiết học, Cuối tuần, Cuối kỳ).

19. **[SPEC-18: Ma Trận Phụ Thuộc, Kiểm Toán Mã Nguồn & Bảng Truy Vết File](file:///d:/02.Code/03.Edu/New%20folder/GVCN/docs/spec/18-dependency-traceability-audit.md)**
    - Feature Dependency Matrix, Báo cáo kiểm toán kỹ thuật và Bảng ánh xạ mã nguồn từng tính năng tới File Page / Service / Repository / Test.

---

## 🎯 TỔNG KẾT HỆ THỐNG (SYSTEM EXECUTIVE SUMMARY)

| Hạng mục | Số lượng | Chi tiết thống kê |
| :--- | :---: | :--- |
| **Tổng số Routes** | **37** | 1 Onboarding + 36 AppLayout routes (Dashboard, Students, Conduct, Live, Reports...) |
| **Tổng số Tính năng đã đặc tả** | **83** | Mã định danh từ `F-001` đến `F-083` |
| **Tổng số Bảng Cơ sở dữ liệu** | **30** | IndexedDB (`SoChuNhiemVietOfflineDB`) Schema v1 $\rightarrow$ v14 |
| **Tổng số Modals & Tool Windows** | **25** | Tích hợp xác nhận an toàn, form dữ liệu, công cụ sư phạm |
| **Hệ thống Cấp bậc Quân hàm** | **17** | Từ Binh nhì (0đ) đến Đại tướng (800đ) |
| **Hệ thống Avatar Tiến hóa** | **5 Cấp** | Novice, Apprentice, Adept, Master, Grandmaster |
| **Danh hiệu Bảng Vàng Chuẩn** | **8** | Dẫn đầu cấp bậc, Thăng cấp ấn tượng, Ngôi sao bứt phá... |
| **Quy định Đánh giá Nhà nước** | **2** | Thông tư 22/2021/TT-BGDĐT & Thông tư 27/2020/TT-BGDĐT |
| **Chỉ số Kiểm thử (Vitest Suites)** | **70 / 70** | **365 / 365 tests passed (100% Pass Rate)** |
| **Kiểm tra Kiểu dữ liệu (TypeScript)** | **0 Lỗi** | `npm run typecheck` (`tsc -b`) hoàn toàn sạch sẽ |

