# SỔ CHỦ NHIỆM VIỆT OFFLINE — BẢN ĐỒ TÍNH NĂNG & TÀI LIỆU CHUẨN KỸ THUẬT
> File: `docs/PROJECT_FEATURES.md`  
> Phiên bản tài liệu: `1.0.0`  
> Chuẩn hóa dành cho: Kỹ sư phần mềm, Kiến trúc sư hệ thống, Product Owner & Autonomous AI Agents.

---

## 1. Document Metadata

| Thuộc tính | Chi tiết xác thực |
| :--- | :--- |
| **Tên dự án** | **Sổ Chủ Nhiệm Việt Offline** (`so-chu-nhiem-viet-offline`) |
| **Phiên bản sản phẩm** | `1.0.0` (PWA Offline-First) |
| **Thời điểm rà soát** | `2026-08-17 13:45:00 (GMT+7 - Asia/Ho_Chi_Minh)` |
| **Trạng thái Git** | Thư mục mã nguồn cục bộ `d:/02.Code/GVCN` (Môi trường Windows Local Workspace) |
| **Phạm vi rà soát** | Toàn bộ 100% mã nguồn trong `src/` (Core, Modules, Shared, Assets, Layouts), `docs/`, `public/`, `e2e/`, cấu hình Vite, Tailwind v4, PWA và Test Suites |
| **Lệnh kiểm tra đã chạy** | `npm test` (31/31 test files, 164/164 tests passed, 100% pass rate)<br>`npm run build` (TypeScript `tsc -b` 0 lỗi + `vite build` 100% thành công trong 13.82s, Precache 93 entries PWA) |
| **Giới hạn của lần rà soát** | Ứng dụng là Client-Side PWA 100% Offline, không có backend server tập trung. Toàn bộ xác thực quyền và business logic chạy tại client thông qua IndexedDB (Dexie.js). |

---

## 2. Product Summary

### 2.1. Bài toán và Mục tiêu Sản phẩm
**Sổ Chủ Nhiệm Việt Offline** là giải pháp phần mềm quản lý lớp học và nghiệp vụ công tác giáo viên chủ nhiệm dành cho các trường phổ thông (Tiểu học, THCS, THPT) tại Việt Nam:
* **Hoạt động 100% Offline-First**: Không cần kết nối Internet, không phụ thuộc vào máy chủ trung gian, đảm bảo khả năng hoạt động liên tục tại các điểm trường vùng sâu, vùng xa hoặc khi mạng học đường bị gián đoạn.
* **Bảo mật & Quyền riêng tư Tuyệt đối (0% Telemetry)**: Toàn bộ hồ sơ học sinh, thông tin gia đình, nhận xét kỷ luật và điểm thi đua được lưu trữ cục bộ trên thiết bị của giáo viên qua Web Storage / IndexedDB.
* **Tối ưu Hóa Sư Phạm & Gamification Giáo Dục**: Tích hợp hệ thống 17 Cấp bậc Quân hàm Đội viên, Bảng vàng Danh hiệu, Lớp học trực tuyến tương tác màn hình lớn (Fluid Clamping Responsive) và Báo cáo trực quan chuẩn in ấn A4.

### 2.2. Nhóm Người Dùng Mục Tiêu
* **Giáo viên Chủ nhiệm (Primary Actor)**: Quản lý từ 1–3 lớp học (khoảng 35–50 học sinh/lớp), thực hiện điểm danh hàng ngày, theo dõi thi đua, liên lạc phụ huynh, tổ chức tiết sinh hoạt lớp và kết xuất báo cáo cuối kỳ.
* **Học sinh trong lớp (Indirect Audience)**: Quan sát trực tiếp trên máy chiếu/màn hình tương tác trong các tiết học trực tuyến, bốc thăm ngẫu nhiên, vinh danh cấp bậc và nhận danh hiệu bảng vàng.

### 2.3. Kiến Trúc Kỹ Thuật Tổng Quan
* **Giao diện & Ứng dụng (UI Layer)**: React 19, TypeScript 5.7, Vite 6, Tailwind CSS v4, React Router DOM v7, Lucide Icons, Recharts.
* **Lưu trữ Cục bộ (Data Layer)**: Dexie.js v4 (IndexedDB) với 30 bảng thực thể, hỗ trợ Schema Migrations (v1 $\rightarrow$ v7), Transactions an toàn tự động Rollback, Soft Delete (`deletedAt`) và Audit Logging.
* **Phần cứng & Trình duyệt (Runtime / Web APIs)**: PWA Workbox (Service Worker precaching), Web Storage API, BroadcastChannel API (đồng bộ 2 màn hình không cần server), Web Audio API (âm thanh hiệu ứng), Web Crypto API (Mã hóa sao lưu AES-GCM & an toàn UUID RFC4122 v4).
* **Biên giới Bên ngoài (External Boundary)**: Nhập/Xuất file Excel (`.xlsx` qua ExcelJS) và Sao lưu/Khôi phục cơ sở dữ liệu (`.gvcn-backup` JSON mã hóa).

---

## 3. Roles and Access Matrix

Do kiến trúc thuần Client-Side Offline, mô hình phân quyền được triển khai theo phạm vi sở hữu dữ liệu cục bộ:

| Vai trò / Đối tượng | Quyền hạn tại UI (Frontend) | Ràng buộc nghiệp vụ (Client Data Logic) | Phạm vi Dữ liệu (Scope) | Ghi chú & Giới hạn |
| :--- | :--- | :--- | :--- | :--- |
| **Giáo viên Chủ nhiệm (Owner)** | Toàn quyền truy cập tất cả 17 modules, tạo/sửa/xóa học sinh, điểm danh, chấm điểm thi đua, sao lưu/khôi phục DB | Thực hiện đầy đủ qua Dexie Transactions, Zod Validation, Soft-delete và ghi vết `auditLogs` | Dữ liệu cục bộ trong IndexedDB của trình duyệt hiện tại | Không có xác thực đăng nhập mật khẩu; bảo vệ vật lý qua máy tính cá nhân |
| **Chế độ Trình chiếu Học sinh (Presentation)** | Chỉ hiển thị giao diện xem (Read-only / Presentation Mode) trên máy chiếu/màn hình phụ: Lớp học trực tuyến, Bảng vàng, Báo cáo | Ẩn toàn bộ nút cấu hình quản trị, ẩn sidebar/topbar, ẩn form sửa xóa và thông tin riêng tư | Chỉ đọc dữ liệu phiên hiện tại qua `BroadcastChannel` hoặc Route URL | Đồng bộ thời gian thực 2 chiều giữa màn hình điều khiển và màn hình chiếu |

---

## 4. Module and Feature Index

| Feature ID | Module | Tên tính năng | Trạng thái | Mức độ Test | Tác nhân chính | Entry Point / Route |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| [`FEAT-ONBD-001`](#feat-onbd-001--khởi-tạo-hồ-sơ-giáo-viên--thiết-lập-ban-đầu) | ONBD | Khởi tạo Hồ Sơ Giáo Viên & Thiết Lập Ban Đầu | `IMPLEMENTED` | `TESTED` | Giáo viên | `/onboarding` |
| [`FEAT-ONBD-002`](#feat-onbd-002--kiểm-tra-onboarding--điều-hướng-bắt-buộc) | ONBD | Kiểm Tra Onboarding & Điều Hướng Bắt Buộc | `IMPLEMENTED` | `TESTED` | Giáo viên | Global Router / `AppLayout` |
| [`FEAT-DASH-001`](#feat-dash-001--hero-salutation-thời-khóa-biểu--nhiệm-vụ-sư-phạm) | DASH | Hero Salutation, Thời Khóa Biểu & Nhiệm Vụ Sư Phạm | `IMPLEMENTED` | `TESTED` | Giáo viên | `/dashboard` |
| [`FEAT-DASH-002`](#feat-dash-002--bộ-chỉ-số-tổng-quan-kpi-lớp-học) | DASH | Bộ Chỉ Số Tổng Quan KPI Lớp Học | `IMPLEMENTED` | `TESTED` | Giáo viên | `/dashboard` |
| [`FEAT-DASH-003`](#feat-dash-003--gương-mặt-nổi-bật--cần-đồng-hành) | DASH | Gương Mặt Nổi Bật & Cần Đồng Hành | `IMPLEMENTED` | `TESTED` | Giáo viên | `/dashboard` |
| [`FEAT-DASH-004`](#feat-dash-004--lối-tắt-thao-tác-nhanh-sư-phạm) | DASH | Lối Tắt Thao Tác Nhanh Sư Phạm | `IMPLEMENTED` | `TESTED` | Giáo viên | `/dashboard` |
| [`FEAT-AYER-001`](#feat-ayer-001--quản-lý-năm-học--học-kỳ) | AYER | Quản Lý Năm Học & Học Kỳ | `PARTIAL` | `TESTED` | Giáo viên | `/academic-years` |
| [`FEAT-CLAS-001`](#feat-clas-001--danh-sách-lớp-học--trạng-thái-activearchived) | CLAS | Danh Sách Lớp Học & Trạng Thái Active/Archived | `IMPLEMENTED` | `TESTED` | Giáo viên | `/classes` |
| [`FEAT-CLAS-002`](#feat-clas-002--chi-tiết-lớp-học--danh-sách-học-sinh-theo-lớp) | CLAS | Chi Tiết Lớp Học & Danh Sách Học Sinh Theo Lớp | `IMPLEMENTED` | `TESTED` | Giáo viên | `/classes/:classId` |
| [`FEAT-CLAS-003`](#feat-clas-003--tạo-mới-chỉnh-sửa-và-đóng-lớp-học) | CLAS | Tạo Mới, Chỉnh Sửa và Đóng Lớp Học | `IMPLEMENTED` | `TESTED` | Giáo viên | `/classes` (Modal) |
| [`FEAT-STUD-001`](#feat-stud-001--hồ-sơ-học-sinh-crud--chuẩn-hóa-tên-tiếng-việt) | STUD | Hồ Sơ Học Sinh CRUD & Chuẩn Hóa Tiếng Việt | `IMPLEMENTED` | `TESTED` | Giáo viên | `/students` |
| [`FEAT-STUD-002`](#feat-stud-002--bộ-sưu-tập-31-avatar-vector-svg--phân-nhóm-chủ-đề) | STUD | Bộ Sưu Tập 31 Avatar Vector SVG & Phân Nhóm Chủ Đề | `IMPLEMENTED` | `TESTED` | Giáo viên | Modal Avatar Picker |
| [`FEAT-STUD-003`](#feat-stud-003--đổi-avatar-nhanh--phân-giải-độc-lập-build-hash) | STUD | Đổi Avatar Nhanh & Phân Giải Độc Lập Build Hash | `IMPLEMENTED` | `TESTED` | Giáo viên | `/students`, `/students/:id` |
| [`FEAT-STUD-004`](#feat-stud-004--chuyển-lớp-học-sinh--lưu-vết-lịch-sử-phân-lớp) | STUD | Chuyển Lớp Học Sinh & Lưu Vết Lịch Sử Phân Lớp | `IMPLEMENTED` | `TESTED` | Giáo viên | `/students` (Modal) |
| [`FEAT-STUD-005`](#feat-stud-005--chi-tiết-hồ-sơ-học-sinh-dòng-thời-gian--nhật-ký-phụ-huynh) | STUD | Chi Tiết Hồ Sơ, Dòng Thời Gian & Nhật Ký Phụ Huynh | `IMPLEMENTED` | `TESTED` | Giáo viên | `/students/:studentId` |
| [`FEAT-ATTD-001`](#feat-attd-001--điểm-danh-1-chạm-theo-ngày--5-trạng-thái) | ATTD | Điểm Danh 1 Chạm Theo Ngày & 5 Trạng Thái | `IMPLEMENTED` | `TESTED` | Giáo viên | `/attendance` |
| [`FEAT-ATTD-002`](#feat-attd-002--khóa-sổ--mở-khóa-sổ-điểm-danh-bảo-vệ-dữ-liệu) | ATTD | Khóa Sổ & Mở Khóa Sổ Điểm Danh Bảo Vệ Dữ Liệu | `IMPLEMENTED` | `TESTED` | Giáo viên | `/attendance` |
| [`FEAT-ATTD-003`](#feat-attd-003--lịch-sử--thống-kê-chuyên-cần-theo-kỳ) | ATTD | Lịch Sử & Thống Kê Chuyên Cần Theo Kỳ | `IMPLEMENTED` | `TESTED` | Giáo viên | `/attendance` (History Tab) |
| [`FEAT-COND-001`](#feat-cond-001--sổ-điểm-thi-đua-danh-mục-tiêu-chí-cộngtrừ) | COND | Sổ Điểm Thi Đua, Danh Mục Tiêu Chí Cộng/Trừ | `IMPLEMENTED` | `TESTED` | Giáo viên | `/conduct` |
| [`FEAT-COND-002`](#feat-cond-002--chấm-điểm-thi-đua-cá-nhân-nhóm--đảo-ngược-điểm-undo) | COND | Chấm Điểm Thi Đua Cá Nhân, Nhóm & Đảo Ngược Điểm | `IMPLEMENTED` | `TESTED` | Giáo viên | `/conduct` (Modal) |
| [`FEAT-COND-003`](#feat-cond-003--lọc--thống-kê-điểm-thi-đua-theo-chu-kỳ) | COND | Lọc & Thống Kê Điểm Thi Đua Theo Chu Kỳ | `IMPLEMENTED` | `TESTED` | Giáo viên | `/conduct` |
| [`FEAT-RANK-001`](#feat-rank-001--hệ-thống-17-cấp-bậc-thi-đua-quân-hàm-đội-viên) | RANK | Hệ Thống 17 Cấp Bậc Thi Đua Quân Hàm Đội Viên | `IMPLEMENTED` | `TESTED` | Giáo viên, HS | `/conduct/ranks` |
| [`FEAT-RANK-002`](#feat-rank-002--tính-toán-cấp-bậc-tự-động-chống-giáng-cấp-achievement-mode) | RANK | Tính Cấp Bậc Tự Động, Chống Giáng Cấp | `IMPLEMENTED` | `TESTED` | Hệ thống Logic | `RankCalculationService` |
| [`FEAT-RANK-003`](#feat-rank-003--huy-hiệu-cấp-bậc-quân-hàm-trực-quan--tooltip-thông-minh) | RANK | Huy Hiệu Cấp Bậc Quân Hàm Trực Quan & Tooltip | `IMPLEMENTED` | `TESTED` | Giáo viên, HS | Toàn hệ thống |
| [`FEAT-RANK-004`](#feat-rank-004--pháo-hoa-chúc-mừng-thăng-cấp--lịch-sử-thăng-cấp) | RANK | Pháo Hoa Chúc Mừng & Lịch Sử Thăng Cấp | `IMPLEMENTED` | `TESTED` | Giáo viên, HS | `/conduct/ranks` |
| [`FEAT-RANK-005`](#feat-rank-005--bảng-theo-dõi-học-sinh-sát-ngưỡng-thăng-cấp) | RANK | Bảng Theo Dõi Học Sinh Sát Ngưỡng Thăng Cấp | `IMPLEMENTED` | `TESTED` | Giáo viên | `/conduct/ranks` |
| [`FEAT-HNBD-001`](#feat-hnbd-001--wizard-tạo-bảng-vàng-danh-hiệu-theo-chu-kỳ) | HNBD | Wizard Tạo Bảng Vàng Danh Hiệu Theo Chu Kỳ | `IMPLEMENTED` | `TESTED` | Giáo viên | `/conduct/honor-board/new` |
| [`FEAT-HNBD-002`](#feat-hnbd-002--rule-engine-tự-động-tính-toán-7-tiêu-chí-danh-hiệu) | HNBD | Rule Engine Tính Toán 7 Tiêu Chí Danh Hiệu & Bục Top 1-2-3 | `IMPLEMENTED` | `TESTED` | Giáo viên, HS | `/conduct/honor-board/:id` |
| [`FEAT-HNBD-003`](#feat-hnbd-003--trình-chiếu-bảng-vàng-toàn-màn-hình-sinh-hoạt-lớp) | HNBD | Trình Chiếu Bảng Vàng Toàn Màn Hình Sinh Hoạt Lớp | `IMPLEMENTED` | `TESTED` | Giáo viên, HS | `/conduct/honor-board/:id/present` |
| [`FEAT-HNBD-004`](#feat-hnbd-004--quản-lý-danh-sách-phê-duyệt--lịch-sử-bảng-vàng) | HNBD | Quản Lý Danh Sách, Phê Duyệt & Lịch Sử Bảng Vàng | `IMPLEMENTED` | `TESTED` | Giáo viên | `/conduct/honor-board` |
| [`FEAT-LIVE-001`](#feat-live-001--khởi-tạo--điều-khiển-phiên-lớp-học-trực-tuyến) | LIVE | Khởi Tạo & Điều Khiển Phiên Lớp Học Trực Tuyến | `IMPLEMENTED` | `TESTED` | Giáo viên | `/live-classroom` |
| [`FEAT-LIVE-002`](#feat-live-002--lưới-thẻ-học-sinh-tương-tác-fluid-clamping-responsive) | LIVE | Lưới Thẻ Học Sinh Fluid Clamping Responsive | `IMPLEMENTED` | `TESTED` | Giáo viên, HS | `/live-classroom/:sessionId` |
| [`FEAT-LIVE-003`](#feat-live-003--hộp-công-cụ-nổi-sư-phạm-bốc-thăm-hẹn-giờ-bầu-chọn) | LIVE | Hộp Công Cụ Nổi: Bốc Thăm, Hẹn Giờ, Bầu Chọn | `IMPLEMENTED` | `TESTED` | Giáo viên, HS | Tool Box Overlay |
| [`FEAT-LIVE-004`](#feat-live-004--hàng-đợi-học-sinh-đã-gọi--đánh-giá-phản-hồi) | LIVE | Hàng Đợi Học Sinh Đã Gọi & Đánh Giá Phản Hồi | `IMPLEMENTED` | `TESTED` | Giáo viên | Active Session Tool |
| [`FEAT-LIVE-005`](#feat-live-005--chia-nhóm-học-tập-ngẫu-nhiên--chấm-điểm-nhóm) | LIVE | Chia Nhóm Học Tập Ngẫu Nhiên & Chấm Điểm Nhóm | `IMPLEMENTED` | `TESTED` | Giáo viên, HS | Active Session Group |
| [`FEAT-LIVE-006`](#feat-live-006--đồng-bộ-đa-màn-hình-qua-broadcastchannel-api) | LIVE | Đồng Bộ Đa Màn Hình Qua BroadcastChannel API | `IMPLEMENTED` | `TESTED` | Giáo viên, HS | `/live-classroom/:id/present` |
| [`FEAT-LIVE-007`](#feat-live-007--đồng-bộ-điểm--chuyên-cần-vào-sổ-chính) | LIVE | Đồng Bộ Điểm & Chuyên Cần Vào Sổ Chính Khi Đóng Phiên | `IMPLEMENTED` | `TESTED` | Giáo viên | Modal Summary |
| [`FEAT-LIVE-008`](#feat-live-008--lịch-sử-phiên-học--báo-cáo-thống-kê-tiết-học) | LIVE | Lịch Sử Phiên Học & Báo Cáo Thống Kê Tiết Học | `IMPLEMENTED` | `TESTED` | Giáo viên | `/live-classroom/history` |
| [`FEAT-REPO-001`](#feat-repo-001--trung-tâm-báo-cáo-tổng-quan--kpi-lớp-chủ-nhiệm) | REPO | Trung Tâm Báo Cáo Tổng Quan & KPI Lớp Chủ Nhiệm | `IMPLEMENTED` | `TESTED` | Giáo viên | `/reports` |
| [`FEAT-REPO-002`](#feat-repo-002--biểu-đồ-chuyên-cần-phân-bố-điểm-số--tương-tác) | REPO | Biểu Đồ Chuyên Cần, Phân Bố Điểm Số & Tương Tác | `IMPLEMENTED` | `TESTED` | Giáo viên | `/reports/attendance`, `/reports/points-ranks` |
| [`FEAT-REPO-003`](#feat-repo-003--báo-cáo-tiến-độ-thăng-cấp--danh-hiệu-bảng-vàng) | REPO | Báo Cáo Tiến Độ Thăng Cấp & Danh Hiệu Bảng Vàng | `IMPLEMENTED` | `TESTED` | Giáo viên | `/reports/honors` |
| [`FEAT-REPO-004`](#feat-repo-004--so-sánh-đối-sánh-giữa-các-lớp-chủ-nhiệm) | REPO | So Sánh Đối Sánh Giữa Các Lớp Chủ Nhiệm | `IMPLEMENTED` | `TESTED` | Giáo viên | `/reports/compare` |
| [`FEAT-REPO-005`](#feat-repo-005--báo-cáo-hồ-sơ-cá-nhân-học-sinh-chuẩn-in-ấn-a4) | REPO | Báo Cáo Hồ Sơ Cá Nhân Học Sinh Chuẩn In Ấn A4 | `IMPLEMENTED` | `TESTED` | Giáo viên, Phụ huynh | `/reports/student/:id` |
| [`FEAT-REPO-006`](#feat-repo-006--chế-độ-trình-chiếu-báo-cáo-toàn-màn-hình-auto-slide) | REPO | Chế Độ Trình Chiếu Báo Cáo Toàn Màn Hình & Auto-Slide | `IMPLEMENTED` | `TESTED` | Giáo viên, Phụ huynh | `/reports/presentation` |
| [`FEAT-REPO-007`](#feat-repo-007--nhận-xét--đánh-giá-sư-phạm-tự-động) | REPO | Nhận Xét & Đánh Giá Sư Phạm Tự Động | `IMPLEMENTED` | `TESTED` | Giáo viên | `ReportInsightPanel` |
| [`FEAT-REPO-008`](#feat-repo-008--modal-drill-down-đào-sâu-dữ-liệu-danh-sách-từ-biểu-đồ) | REPO | Modal Drill-Down Đào Sâu Dữ Liệu Danh Sách Từ Biểu Đồ | `IMPLEMENTED` | `TESTED` | Giáo viên | `DrillDownModal` |
| [`FEAT-EXCL-001`](#feat-excl-001--nhập-danh-sách-học-sinh-từ-excel-chuẩn-bộ-gdđt) | EXCL | Nhập Danh Sách Học Sinh Từ Excel Chuẩn Bộ GD&ĐT | `IMPLEMENTED` | `TESTED` | Giáo viên | Modal Excel Import |
| [`FEAT-EXCL-002`](#feat-excl-002--xuất-danh-sách-học-sinh-điểm-danh-thi-đua-ra-excel) | EXCL | Xuất Danh Sách Học Sinh, Điểm Danh, Thi Đua Ra Excel | `IMPLEMENTED` | `TESTED` | Giáo viên | Các trang Quản lý |
| [`FEAT-BCKP-001`](#feat-bckp-001--sao-lưu-toàn-bộ-database-thành-file-gvcn-backup-mã-hóa) | BCKP | Sao Lưu Toàn Bộ Database Thành File `.gvcn-backup` Mã Hóa | `IMPLEMENTED` | `TESTED` | Giáo viên | `/backup` |
| [`FEAT-BCKP-002`](#feat-bckp-002--khôi-phục-an-toàn-database-với-schema-validation) | BCKP | Khôi Phục An Toàn Database Với Schema Validation & Rollback | `IMPLEMENTED` | `TESTED` | Giáo viên | `/backup` |
| [`FEAT-BCKP-003`](#feat-bckp-003--nhắc-nhở-định-kỳ-sao-lưu-dữ-liệu-tự-động) | BCKP | Nhắc Nhở Định Kỳ Sao Lưu Dữ Liệu Tự Động | `IMPLEMENTED` | `TESTED` | Giáo viên | Top Header Banner |
| [`FEAT-TRSH-001`](#feat-trsh-001--quản-lý-danh-sách-đối-tượng-bị-xóa-tạm-soft-delete) | TRSH | Quản Lý Danh Sách Đối Tượng Xóa Tạm (Soft Delete) | `IMPLEMENTED` | `TESTED` | Giáo viên | `/trash` |
| [`FEAT-TRSH-002`](#feat-trsh-002--khôi-phục-dữ-liệu-hoặc-xóa-vĩnh-viễn) | TRSH | Khôi Phục Dữ Liệu Hoặc Xóa Vĩnh Viễn | `IMPLEMENTED` | `TESTED` | Giáo viên | `/trash` |
| [`FEAT-AUDT-001`](#feat-audt-001--tự-động-ghi-vết-audit-log-cho-mọi-thao-tác) | AUDT | Tự Động Ghi Vết Audit Log Cho Mọi Thao Tác Dữ Liệu | `IMPLEMENTED` | `TESTED` | Hệ thống Logic | `BaseRepository` |
| [`FEAT-AUDT-002`](#feat-audt-002--tra-cứu--bộ-lọc-nâng-cao-nhật-ký-kiểm-soát) | AUDT | Tra Cứu & Bộ Lọc Nâng Cao Nhật Ký Kiểm Soát | `IMPLEMENTED` | `TESTED` | Giáo viên | `/audit-logs` |
| [`FEAT-PRIV-001`](#feat-priv-001--health-check-database--đo-lường-dung-lượng-indexeddb) | PRIV | Health Check Database & Đo Lường Dung Lượng IndexedDB | `IMPLEMENTED` | `TESTED` | Giáo viên | `/privacy` |
| [`FEAT-PRIV-002`](#feat-priv-002--yêu-cầu-quyền-lưu-trữ-bền-vững-persistent-storage) | PRIV | Yêu Cầu Quyền Lưu Trữ Bền Vững (Persistent Storage) | `IMPLEMENTED` | `TESTED` | Giáo viên | `/privacy` |
| [`FEAT-PRIV-003`](#feat-priv-003--cam-kết-100-offline--minh-bạch-0-telemetry) | PRIV | Cam Kết 100% Offline & Minh Bạch 0% Telemetry | `IMPLEMENTED` | `TESTED` | Giáo viên | `/privacy` |
| [`FEAT-SETT-001`](#feat-sett-001--thiết-lập-năm-học--lớp-học-chủ-nhiệm-mặc-định) | SETT | Thiết Lập Năm Học & Lớp Học Chủ Nhiệm Mặc Định | `IMPLEMENTED` | `TESTED` | Giáo viên | `/settings` |
| [`FEAT-SETT-002`](#feat-sett-002--cấu-hình-avatar-học-sinh-mặc-định-toàn-hệ-thống) | SETT | Cấu Hình Avatar Học Sinh Mặc Định Toàn Hệ Thống | `IMPLEMENTED` | `TESTED` | Giáo viên | `/settings` |
| [`FEAT-SETT-003`](#feat-sett-003--hệ-thống-6-chủ-đề-giao-diện-văn-hóa-việt-nam) | SETT | Hệ Thống 6 Chủ Đề Giao Diện Văn Hóa Việt Nam | `IMPLEMENTED` | `TESTED` | Giáo viên | `/settings` (Modal Preview) |
| [`FEAT-EVAL-001`](#feat-eval-001--sổ-nhận-xét-và-đánh-giá-học-sinh-theo-thông-tư-27--thông-tư-22) | EVAL | Sổ Nhận Xét & Đánh Giá Học Sinh (TT27 & TT22) | `IMPLEMENTED` | `TESTED` | Giáo viên | `/evaluations` |
| [`FEAT-CONT-001`](#feat-cont-001--sổ-nhật-ký-liên-hệ-phụ-huynh-chuyên-biệt) | CONT | Sổ Nhật Ký Liên Hệ Phụ Huynh Chuyên Biệt | `PLANNED_ONLY` | `NO_TEST_FOUND` | Giáo viên | `/parent-contacts` (Placeholder) |

---

## 5. Feature Details

### FEAT-ONBD-001 — Khởi Tạo Hồ Sơ Giáo Viên & Thiết Lập Ban Đầu
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Cho phép giáo viên mới tạo hồ sơ cá nhân (Họ tên, Trường, Số điện thoại, Email, Ảnh đại diện), cấu hình năm học đầu tiên và tạo danh sách lớp chủ nhiệm ban đầu.
* **Actors/Roles**: Giáo viên Chủ nhiệm (Chưa khởi tạo dữ liệu).
* **Entry points**: Route `/onboarding`.
* **Preconditions**: Chưa có bản ghi nào trong bảng `teacherProfiles`.
* **Inputs**: Họ tên giáo viên, Tên trường học, Số điện thoại, Email, Avatar cá nhân, Tên năm học (mặc định "2024 - 2025"), Danh sách lớp học (tối thiểu 1 lớp, ví dụ "10A1").
* **Main flow**:
  1. Người dùng truy cập hệ thống lần đầu, `useOnboardingCheck` phát hiện DB chưa có giáo viên $\rightarrow$ chuyển hướng `/onboarding`.
  2. Wizard 3 bước: Bước 1 (Thông tin giáo viên) $\rightarrow$ Bước 2 (Năm học & Học kỳ) $\rightarrow$ Bước 3 (Lớp học ban đầu).
  3. Bấm "Hoàn tất Khởi tạo", thực hiện transaction ghi đồng thời vào `teacherProfiles`, `academicYears`, `terms`, `classes`, `settings`.
  4. Tự động seed hệ thống cấp bậc thi đua mặc định và chuyển hướng về `/dashboard`.
* **Alternative/Error flows**: Nhập thiếu họ tên/số điện thoại $\rightarrow$ Hiển thị lỗi form validation Zod tại chỗ.
* **Outputs/Side effects**: Tạo mới 1 `TeacherProfile`, 1 `AcademicYear`, 2 `Terms`, n `Classes`, 1 `UserSettings`, ghi `auditLogs`.
* **Permissions/Data scope**: Cục bộ thiết bị.
* **Validation/Business rules**: Họ tên $\ge 2$ ký tự; Số điện thoại chuẩn định dạng Việt Nam; Tên lớp không trùng lặp.
* **Data entities**: `teacherProfiles`, `academicYears`, `terms`, `classes`, `settings`, `auditLogs`.
* **Dependencies/Integrations**: `generateUUID()` fallback an toàn RFC4122 v4.
* **Feature flags/Configuration**: N/A.
* **Observability**: Ghi Audit Log hành động `CREATE` thực thể `TeacherProfile`.
* **Tests**: `src/modules/dashboard/DashboardPage.test.tsx`, `src/core/services/academic-year.service.test.ts`.
* **Source evidence**: [`src/modules/onboarding/OnboardingWizard.tsx`](file:///d:/02.Code/GVCN/src/modules/onboarding/OnboardingWizard.tsx), [`src/core/repositories/teacher-profile.repository.ts`](file:///d:/02.Code/GVCN/src/core/repositories/teacher-profile.repository.ts).
* **Known gaps/Risks/Unknowns**: Không có.
* **Related features**: `FEAT-ONBD-002`, `FEAT-DASH-001`, `FEAT-SETT-001`.
* **Last verified**: `2026-08-17`.

---

### FEAT-ONBD-002 — Kiểm Tra Onboarding & Điều Hướng Bắt Buộc
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Đảm bảo người dùng không truy cập trái phép vào các màn hình chức năng khi chưa hoàn tất khởi tạo dữ liệu giáo viên.
* **Actors/Roles**: Giáo viên.
* **Entry points**: `AppLayout.tsx`, `useOnboardingCheck.ts`.
* **Preconditions**: Ứng dụng khởi chạy.
* **Main flow**:
  1. `AppLayout` gọi hook `useOnboardingCheck`.
  2. Truy vấn `db.teacherProfiles.count()`.
  3. Nếu đếm $= 0$ và URL hiện tại khác `/onboarding` $\rightarrow$ Chuyển hướng ngay sang `/onboarding`.
  4. Nếu đếm $> 0$ và đang ở `/onboarding` $\rightarrow$ Chuyển hướng sang `/dashboard`.
* **Source evidence**: [`src/shared/hooks/useOnboardingCheck.ts`](file:///d:/02.Code/GVCN/src/shared/hooks/useOnboardingCheck.ts), [`src/shared/layouts/AppLayout.tsx`](file:///d:/02.Code/GVCN/src/shared/layouts/AppLayout.tsx).
* **Last verified**: `2026-08-17`.

---

### FEAT-DASH-001 — Hero Salutation, Thời Khóa Biểu & Nhiệm Vụ Sư Phạm
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Cung cấp màn hình chào đón giáo viên theo khung giờ thực tế (Sáng/Chiều/Tối), hiển thị ngày âm/dương lịch, lớp chủ nhiệm hiện tại và danh sách nhiệm vụ cần làm trong ngày.
* **Actors/Roles**: Giáo viên Chủ nhiệm.
* **Entry points**: Route `/dashboard`.
* **Main flow**:
  1. Tính toán câu chào theo giờ: "Chào buổi sáng / Buổi chiều / Buổi tối, Thầy/Cô [Tên]".
  2. Quét cơ sở dữ liệu xác định các nhiệm vụ cần thực hiện: Điểm danh hôm nay chưa khóa, học sinh cần chấm điểm thi đua, học sinh sắp thăng cấp, cảnh báo sao lưu dữ liệu.
* **Tests**: `src/modules/dashboard/DashboardPage.test.tsx` (4 tests passed).
* **Source evidence**: [`src/modules/dashboard/DashboardPage.tsx`](file:///d:/02.Code/GVCN/src/modules/dashboard/DashboardPage.tsx), [`src/core/services/dashboard-overview.service.ts`](file:///d:/02.Code/GVCN/src/core/services/dashboard-overview.service.ts).
* **Last verified**: `2026-08-17`.

---

### FEAT-DASH-002 — Bộ Chỉ Số Tổng Quan KPI Lớp Học
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Tổng hợp 4 KPI cốt lõi của lớp chủ nhiệm: Tổng số học sinh, Tỷ lệ chuyên cần tuần này, Tổng điểm thi đua tích lũy và Số lượng học sinh đạt cấp Tá/Tướng.
* **Actors/Roles**: Giáo viên.
* **Entry points**: `/dashboard` KPI Cards.
* **Source evidence**: [`src/modules/dashboard/DashboardPage.tsx`](file:///d:/02.Code/GVCN/src/modules/dashboard/DashboardPage.tsx), [`src/core/services/dashboard-overview.service.ts`](file:///d:/02.Code/GVCN/src/core/services/dashboard-overview.service.ts).
* **Last verified**: `2026-08-17`.

---

### FEAT-DASH-003 — Gương Mặt Nổi Bật & Cần Đồng Hành
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Tự động phát hiện và chia thành 2 nhóm học sinh: (1) Nổi bật (Top điểm thi đua, phát biểu nhiều, vừa thăng cấp) và (2) Cần đồng hành (Vắng học nhiều, điểm thi đua giảm hoặc chưa phát biểu).
* **Actors/Roles**: Giáo viên.
* **Entry points**: Component `DashboardStudentSpotlightCard.tsx` tại `/dashboard`.
* **Tests**: `src/modules/dashboard/DashboardPage.test.tsx`, `src/core/services/dashboard-overview.service.test.ts`.
* **Source evidence**: [`src/modules/dashboard/components/DashboardStudentSpotlightCard.tsx`](file:///d:/02.Code/GVCN/src/modules/dashboard/components/DashboardStudentSpotlightCard.tsx).
* **Last verified**: `2026-08-17`.

---

### FEAT-DASH-004 — Lối Tắt Thao Tác Nhanh Sư Phạm
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Cung cấp các nút hành động nhanh 1 chạm dẫn tới các nghiệp vụ thường dùng: Điểm danh ngay, Bắt đầu tiết học trực tuyến, Chấm điểm thi đua, Tạo bảng vàng tuần mới, Nhập Excel.
* **Source evidence**: [`src/modules/dashboard/components/DashboardQuickActionsCard.tsx`](file:///d:/02.Code/GVCN/src/modules/dashboard/DashboardPage.tsx).
* **Last verified**: `2026-08-17`.

---

### FEAT-AYER-001 — Quản Lý Năm Học & Học Kỳ
* **Status**: `PARTIAL`
* **Test status**: `TESTED` (Core Service đã có unit test, UI trang `/academic-years` đang ở dạng tĩnh)
* **Business goal**: Cấu hình các năm học, phân chia thời gian bắt đầu/kết thúc Học kỳ 1, Học kỳ 2 và kích hoạt năm học hiện tại.
* **Source evidence**: [`src/core/services/academic-year.service.ts`](file:///d:/02.Code/GVCN/src/core/services/academic-year.service.ts), [`src/core/services/term.service.ts`](file:///d:/02.Code/GVCN/src/core/services/term.service.ts), [`src/modules/academic-years/AcademicYearsPage.tsx`](file:///d:/02.Code/GVCN/src/modules/academic-years/AcademicYearsPage.tsx).
* **Known gaps**: Việc đổi năm học/lớp học đang được thực hiện chủ yếu qua `SettingsPage.tsx` và Header dropdown; trang `/academic-years` đang là placeholder card.
* **Last verified**: `2026-08-17`.

---

### FEAT-CLAS-001 — Danh Sách Lớp Học & Trạng Thái Active/Archived
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Liệt kê các lớp học do giáo viên phụ trách theo từng năm học với thông tin khối lớp, sĩ số, trạng thái (Đang học / Đã kết thúc / Lưu trữ).
* **Actors/Roles**: Giáo viên.
* **Entry points**: Route `/classes`.
* **Source evidence**: [`src/modules/classes/ClassesPage.tsx`](file:///d:/02.Code/GVCN/src/modules/classes/ClassesPage.tsx), [`src/core/services/class.service.ts`](file:///d:/02.Code/GVCN/src/core/services/class.service.ts).
* **Last verified**: `2026-08-17`.

---

### FEAT-CLAS-002 — Chi Tiết Lớp Học & Danh Sách Học Sinh Theo Lớp
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Xem chi tiết danh sách học sinh theo số thứ tự (STT), mã học sinh, avatar, trạng thái nhập học và điều hướng sang hồ sơ cá nhân.
* **Entry points**: Route `/classes/:classId`.
* **Source evidence**: [`src/modules/classes/ClassDetailPage.tsx`](file:///d:/02.Code/GVCN/src/modules/classes/ClassDetailPage.tsx).
* **Last verified**: `2026-08-17`.

---

### FEAT-CLAS-003 — Tạo Mới, Chỉnh Sửa và Đóng Lớp Học
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Thêm lớp chủ nhiệm mới, chỉnh sửa thông tin khối/tên lớp, đóng trạng thái lớp khi hoàn thành năm học.
* **Source evidence**: [`src/modules/classes/ClassesPage.tsx`](file:///d:/02.Code/GVCN/src/modules/classes/ClassesPage.tsx), [`src/core/repositories/class.repository.ts`](file:///d:/02.Code/GVCN/src/core/repositories/class.repository.ts).
* **Last verified**: `2026-08-17`.

---

### FEAT-STUD-001 — Hồ Sơ Học Sinh CRUD & Chuẩn Hóa Tiếng Việt
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Quản lý hồ sơ học sinh đầy đủ: Mã HS, Họ tên, Giới tính, Ngày sinh, Dân tộc, Địa chỉ, Avatar, Ghi chú sức khỏe, STT trong lớp. Tìm kiếm thông minh không dấu tiếng Việt (`normalizeVietnameseText`).
* **Actors/Roles**: Giáo viên.
* **Entry points**: Route `/students`.
* **Main flow**:
  1. Thêm mới / Chỉnh sửa học sinh qua Modal form.
  2. Tự động sinh `normalizedName` viết thường không dấu để phục vụ lọc tức thì.
  3. Ghi vào `db.students` và tạo `classEnrollments` (STT, JoinedAt).
* **Source evidence**: [`src/modules/students/StudentsPage.tsx`](file:///d:/02.Code/GVCN/src/modules/students/StudentsPage.tsx), [`src/core/services/student.service.ts`](file:///d:/02.Code/GVCN/src/core/services/student.service.ts), [`src/shared/utilities/normalize.ts`](file:///d:/02.Code/GVCN/src/shared/utilities/normalize.ts).
* **Tests**: `src/core/services/student.service.test.ts` (5 tests passed).
* **Last verified**: `2026-08-17`.

---

### FEAT-STUD-002 — Bộ Sưu Tập 31 Avatar Vector SVG & Phân Nhóm Chủ Đề
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Cung cấp bộ sưu tập 31 avatar vector SVG thiết kế nguyên bản, chia theo 6 nhóm gần gũi với thiếu nhi Việt Nam (Mặc định, Học sinh, Động vật, Hoạt hình, Dân tộc, Quân đội).
* **Source evidence**: [`src/assets/images/avatars/`](file:///d:/02.Code/GVCN/src/assets/images/avatars/), [`src/core/services/avatar-catalog.service.ts`](file:///d:/02.Code/GVCN/src/core/services/avatar-catalog.service.ts), [`src/shared/components/AvatarPickerModal.tsx`](file:///d:/02.Code/GVCN/src/shared/components/AvatarPickerModal.tsx).
* **Tests**: `src/core/services/avatar-catalog.service.test.ts`, `src/shared/components/AvatarPickerModal.test.tsx`.
* **Last verified**: `2026-08-17`.

---

### FEAT-STUD-003 — Đổi Avatar Nhanh & Phân Giải Độc Lập Build Hash
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Cho phép giáo viên click trực tiếp vào avatar trên bảng/thẻ học sinh để đổi avatar 1 chạm. Phân giải ưu tiên URL (`resolveStudentAvatar`) đảm bảo không lưu build hash vào DB và tự động cập nhật khi đổi avatar mặc định toàn trường.
* **Source evidence**: [`src/shared/components/StudentAvatar.tsx`](file:///d:/02.Code/GVCN/src/shared/components/StudentAvatar.tsx), [`src/core/services/avatar-catalog.service.ts`](file:///d:/02.Code/GVCN/src/core/services/avatar-catalog.service.ts).
* **Tests**: `src/shared/components/StudentAvatar.test.tsx` (3 tests passed).
* **Last verified**: `2026-08-17`.

---

### FEAT-STUD-004 — Chuyển Lớp Học Sinh & Lưu Vết Lịch Sử Phân Lớp
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Chuyển học sinh từ lớp này sang lớp khác trong cùng năm học; đóng bản ghi `classEnrollments` cũ với trạng thái `Transferred` kèm `leftAt` và tạo bản ghi mới với STT mới.
* **Source evidence**: [`src/modules/students/StudentsPage.tsx`](file:///d:/02.Code/GVCN/src/modules/students/StudentsPage.tsx), [`src/core/services/student.service.ts`](file:///d:/02.Code/GVCN/src/core/services/student.service.ts).
* **Last verified**: `2026-08-17`.

---

### FEAT-STUD-005 — Chi Tiết Hồ Sơ, Dòng Thời Gian & Nhật Ký Phụ Huynh
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Trang hồ sơ học sinh toàn diện gồm 5 tab: (1) Dòng thời gian sư phạm hợp nhất, (2) Lịch sử thi đua & cấp bậc, (3) Chuyên cần, (4) Danh bạ & Nhật ký trao đổi phụ huynh (Gọi điện/Zalo/Gặp trực tiếp), (5) Ghi chú sư phạm có ghim (Pinned).
* **Entry points**: Route `/students/:studentId`.
* **Source evidence**: [`src/modules/students/StudentDetailPage.tsx`](file:///d:/02.Code/GVCN/src/modules/students/StudentDetailPage.tsx), [`src/core/services/student-profile.service.ts`](file:///d:/02.Code/GVCN/src/core/services/student-profile.service.ts).
* **Tests**: `src/core/services/student-profile.service.test.ts` (4 tests passed).
* **Last verified**: `2026-08-17`.

---

### FEAT-ATTD-001 — Điểm Danh 1 Chạm Theo Ngày & 5 Trạng Thái
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Điểm danh lớp học hàng ngày với 5 trạng thái chuyên cần: Có mặt (`Present`), Nghỉ có phép (`ExcusedAbsence`), Nghỉ không phép (`UnexcusedAbsence`), Đi muộn (`Late`), Về sớm (`EarlyLeave`). Tự động tính toán tổng số hiện diện/vắng.
* **Entry points**: Route `/attendance`.
* **Source evidence**: [`src/modules/attendance/AttendancePage.tsx`](file:///d:/02.Code/GVCN/src/modules/attendance/AttendancePage.tsx), [`src/core/services/attendance.service.ts`](file:///d:/02.Code/GVCN/src/core/services/attendance.service.ts).
* **Tests**: `src/core/services/attendance.service.test.ts` (5 tests passed).
* **Last verified**: `2026-08-17`.

---

### FEAT-ATTD-002 — Khóa Sổ & Mở Khóa Sổ Điểm Danh Bảo Vệ Dữ Liệu
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Cho phép giáo viên bấm "Khóa sổ điểm danh" sau khi hoàn tất để chống vô tình bấm nhầm sửa đổi; hỗ trợ "Mở khóa sổ" khi cần điều chỉnh chính thức.
* **Source evidence**: [`src/modules/attendance/AttendancePage.tsx`](file:///d:/02.Code/GVCN/src/modules/attendance/AttendancePage.tsx), [`src/core/repositories/attendance.repository.ts`](file:///d:/02.Code/GVCN/src/core/repositories/attendance.repository.ts).
* **Last verified**: `2026-08-17`.

---

### FEAT-ATTD-003 — Lịch Sử & Thống Kê Chuyên Cần Theo Kỳ
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Theo dõi lịch sử điểm danh theo từng ngày trong tháng, biểu đồ tỷ lệ chuyên cần và danh sách các học sinh vắng nhiều cần lưu ý.
* **Source evidence**: [`src/modules/attendance/AttendanceHistoryPage.tsx`](file:///d:/02.Code/GVCN/src/modules/attendance/AttendanceHistoryPage.tsx), [`src/core/services/attendance.service.ts`](file:///d:/02.Code/GVCN/src/core/services/attendance.service.ts).
* **Last verified**: `2026-08-17`.

---

### FEAT-COND-001 — Sổ Điểm Thi Đua, Danh Mục Tiêu Chí Cộng/Trừ
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Quản lý điểm thi đua rèn luyện theo các danh mục chuẩn: Phát biểu xây dựng bài, Giúp đỡ bạn, Làm việc tốt, Đi học muộn, Mất trật tự, Không làm bài tập... Cho phép tùy biến điểm thưởng/phạt và đánh dấu có tính vào cấp bậc hay không (`countsTowardRank`).
* **Entry points**: Route `/conduct`.
* **Source evidence**: [`src/modules/conduct/ConductPage.tsx`](file:///d:/02.Code/GVCN/src/modules/conduct/ConductPage.tsx), [`src/core/services/conduct.service.ts`](file:///d:/02.Code/GVCN/src/core/services/conduct.service.ts).
* **Tests**: `src/core/services/conduct.service.test.ts` (5 tests passed).
* **Last verified**: `2026-08-17`.

---

### FEAT-COND-002 — Chấm Điểm Thi Đua Cá Nhân, Nhóm & Đảo Ngược Điểm (Undo)
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Chấm điểm thi đua cho 1 học sinh hoặc chọn nhiều học sinh cùng lúc. Hỗ trợ thao tác "Đảo ngược điểm" (Undo/Reverse) để thu hồi điểm chấm nhầm mà vẫn bảo lưu lịch sử kiểm soát.
* **Source evidence**: [`src/modules/conduct/ConductPage.tsx`](file:///d:/02.Code/GVCN/src/modules/conduct/ConductPage.tsx), [`src/core/services/conduct.service.ts`](file:///d:/02.Code/GVCN/src/core/services/conduct.service.ts).
* **Last verified**: `2026-08-17`.

---

### FEAT-COND-003 — Lọc & Thống Kê Điểm Thi Đua Theo Chu Kỳ
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Lọc danh sách điểm theo Tuần này, Tháng này, Học kỳ hoặc Khoảng thời gian tùy chọn. Hiển thị bảng xếp hạng tổng điểm thi đua trong lớp.
* **Source evidence**: [`src/modules/conduct/ConductPage.tsx`](file:///d:/02.Code/GVCN/src/modules/conduct/ConductPage.tsx).
* **Last verified**: `2026-08-17`.

---

### FEAT-RANK-001 — Hệ Thống 17 Cấp Bậc Thi Đua Quân Hàm Đội Viên
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Triển khai thang 17 cấp bậc quân hàm chia làm 4 nhóm:
  1. *Hạ sĩ quan & Binh sĩ* (Cấp 1–6): Binh nhì, Binh nhất, Hạ sĩ, Trung sĩ, Thượng sĩ, Chuẩn úy.
  2. *Cấp Úy* (Cấp 7–10): Thiếu úy, Trung úy, Thượng úy, Đại úy.
  3. *Cấp Tá* (Cấp 11–14): Thiếu tá, Trung tá, Thượng tá, Đại tá.
  4. *Cấp Tướng* (Cấp 15–17): Thiếu tướng, Trung tướng, Đại tướng.
* **Entry points**: Route `/conduct/ranks`.
* **Tests**: `src/core/services/rank-seed.service.test.ts`, `src/core/services/rank-system.regression.test.ts` (20 tests passed).
* **Source evidence**: [`src/core/services/rank-seed.service.ts`](file:///d:/02.Code/GVCN/src/core/services/rank-seed.service.ts), [`src/modules/conduct/ranks/ConductRanksPage.tsx`](file:///d:/02.Code/GVCN/src/modules/conduct/ranks/ConductRanksPage.tsx).
* **Last verified**: `2026-08-17`.

---

### FEAT-RANK-002 — Tính Toán Cấp Bậc Tự Động, Chống Giáng Cấp (Achievement Mode)
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Tự động tính toán điểm hiệu dụng (Effective Points) từ `pointEntries` thuộc danh mục `countsTowardRank = true`. Theo chế độ `Achievement Mode`, học sinh đã được vinh danh thăng cấp sẽ **không bị giáng cấp** khi bị trừ điểm, bảo vệ tâm lý thi đua tích cực cho học sinh tiểu học.
* **Tests**: `src/core/services/rank-calculation.service.test.ts` (6 tests passed), `src/core/services/rank-performance.test.ts` (Benchmark 150 học sinh, 3000+ điểm entries không bị N+1 query).
* **Source evidence**: [`src/core/services/rank-calculation.service.ts`](file:///d:/02.Code/GVCN/src/core/services/rank-calculation.service.ts), [`src/core/services/rank-integration.service.ts`](file:///d:/02.Code/GVCN/src/core/services/rank-integration.service.ts).
* **Last verified**: `2026-08-17`.

---

### FEAT-RANK-003 — Huy Hiệu Cấp Bậc Quân Hàm Trực Quan & Tooltip Thông Minh
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Component `<EmulationRankBadge />` hiển thị quân hàm sao, vạch, màu sắc theo đúng cấp bậc quân đội Việt Nam, kèm tooltip hiển thị chi tiết số điểm hiện tại và số điểm còn thiếu để lên cấp tiếp theo.
* **Source evidence**: [`src/shared/components/EmulationRankBadge.tsx`](file:///d:/02.Code/GVCN/src/shared/components/EmulationRankBadge.tsx).
* **Last verified**: `2026-08-17`.

---

### FEAT-RANK-004 — Pháo Hoa Chúc Mừng Thăng Cấp & Lịch Sử Thăng Cấp
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Modal chúc mừng kèm hiệu ứng pháo hoa Canvas Confetti và âm thanh fan-fare khi học sinh thăng cấp. Tab Lịch sử thăng cấp ghi nhận chính xác mốc thời gian, cấp bậc cũ/mới và lý do.
* **Source evidence**: [`src/shared/components/PromotionCelebrationModal.tsx`](file:///d:/02.Code/GVCN/src/shared/components/PromotionCelebrationModal.tsx), [`src/modules/conduct/ranks/RankHistoryTab.tsx`](file:///d:/02.Code/GVCN/src/modules/conduct/ranks/RankHistoryTab.tsx).
* **Last verified**: `2026-08-17`.

---

### FEAT-RANK-005 — Bảng Theo Dõi Học Sinh Sát Ngưỡng Thăng Cấp
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Bảng danh sách gợi ý sư phạm các học sinh chỉ còn thiếu từ 1–10 điểm để đạt quân hàm tiếp theo, giúp giáo viên chủ nhiệm khích lệ kịp thời trong tuần.
* **Source evidence**: [`src/modules/conduct/ranks/components/NearPromotionPanel.tsx`](file:///d:/02.Code/GVCN/src/modules/conduct/ranks/components/NearPromotionPanel.tsx), [`src/core/services/rank-overview-analytics.service.ts`](file:///d:/02.Code/GVCN/src/core/services/rank-overview-analytics.service.ts).
* **Tests**: `src/core/services/rank-overview-analytics.service.test.ts` (8 tests passed).
* **Last verified**: `2026-08-17`.

---

### FEAT-HNBD-001 — Wizard Tạo Bảng Vàng Danh Hiệu Theo Chu Kỳ
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Trình hướng dẫn 3 bước tạo Bảng Vàng danh hiệu: (1) Chọn lớp & khoảng thời gian (Tuần / Tháng / Học kỳ), (2) Chọn bộ danh hiệu vinh danh, (3) Xem trước danh sách đề cử tự động.
* **Entry points**: Route `/conduct/honor-board/new`.
* **Source evidence**: [`src/modules/conduct/honor-board/HonorBoardCreateWizard.tsx`](file:///d:/02.Code/GVCN/src/modules/conduct/honor-board/HonorBoardCreateWizard.tsx), [`src/core/services/honor-board.service.ts`](file:///d:/02.Code/GVCN/src/core/services/honor-board.service.ts).
* **Tests**: `src/core/services/honor-board.service.test.ts` (4 tests passed).
* **Last verified**: `2026-08-17`.

---

### FEAT-HNBD-002 — Rule Engine Tính Toán 7 Tiêu Chí Danh Hiệu & Bục Top 1-2-3
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Động cơ quy tắc sư phạm tự động xét duyệt 7 danh hiệu:
  1. *Ngôi sao Thi đua (Top Rank)*: Bục vinh quang 3 vị trí Vàng - Bạc - Đồng.
  2. *Tiến bộ Vượt bậc (Rank Progress)*: Tăng nhiều bậc quân hàm nhất trong kỳ.
  3. *Bứt phá Điểm số (Point Growth)*: Tăng trưởng điểm thi đua cao nhất.
  4. *Chiến sĩ Chuyên cần (Attendance)*: Đạt 100% chuyên cần không đi muộn.
  5. *Hăng hái Phát biểu (Participation)*: Số lượt tương tác cao nhất trong tiết học trực tuyến.
  6. *Vượt lên Chính mình (Self Progress)*: Tiến bộ cá nhân so với tuần trước.
  7. *Hoa Điểm Mười (Manual)*: Giáo viên bổ sung danh hiệu đặc biệt thủ công.
* **Source evidence**: [`src/core/services/honor-rule-engine.service.ts`](file:///d:/02.Code/GVCN/src/core/services/honor-rule-engine.service.ts), [`src/modules/conduct/honor-board/components/TopRankPodium.tsx`](file:///d:/02.Code/GVCN/src/modules/conduct/honor-board/components/TopRankPodium.tsx), [`src/modules/conduct/honor-board/components/HonorTitleCard.tsx`](file:///d:/02.Code/GVCN/src/modules/conduct/honor-board/components/HonorTitleCard.tsx).
* **Last verified**: `2026-08-17`.

---

### FEAT-HNBD-003 — Trình Chiếu Bảng Vàng Toàn Màn Hình Sinh Hoạt Lớp
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Màn hình trình chiếu chuyên dụng phục vụ tiết sinh hoạt lớp cuối tuần: giao diện trang trọng, âm thanh vinh danh, bục podium Top 1-2-3 và thẻ danh hiệu sinh động.
* **Entry points**: Route `/conduct/honor-board/:boardId/present`.
* **Source evidence**: [`src/modules/conduct/honor-board/HonorBoardPresentPage.tsx`](file:///d:/02.Code/GVCN/src/modules/conduct/honor-board/HonorBoardPresentPage.tsx).
* **Last verified**: `2026-08-17`.

---

### FEAT-HNBD-004 — Quản Lý Danh Sách, Phê Duyệt & Lịch Sử Bảng Vàng
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Quản lý danh sách các bảng vàng (Bản nháp / Đã công bố / Lưu trữ), cho phép giáo viên tích chọn phê duyệt từng học sinh và xem lại lịch sử vinh danh các tuần trước.
* **Source evidence**: [`src/modules/conduct/honor-board/HonorBoardListPage.tsx`](file:///d:/02.Code/GVCN/src/modules/conduct/honor-board/HonorBoardListPage.tsx), [`src/modules/conduct/honor-board/HonorBoardDetailPage.tsx`](file:///d:/02.Code/GVCN/src/modules/conduct/honor-board/HonorBoardDetailPage.tsx), [`src/modules/conduct/honor-board/HonorBoardHistoryPage.tsx`](file:///d:/02.Code/GVCN/src/modules/conduct/honor-board/HonorBoardHistoryPage.tsx).
* **Last verified**: `2026-08-17`.

---

### FEAT-LIVE-001 — Khởi Tạo & Điều Khiển Phiên Lớp Học Trực Tuyến
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Tạo phiên học trực tuyến với thông tin môn học, chủ đề, nền tảng meeting (Google Meet, Zoom, MS Teams, Trực tiếp), điều khiển trạng thái (Bắt đầu, Tạm dừng, Tiếp tục, Kết thúc).
* **Entry points**: Route `/live-classroom/new`, `/live-classroom/:sessionId`.
* **Tests**: `src/core/services/live-classroom/live-classroom.test.ts` (10 tests passed).
* **Source evidence**: [`src/modules/live-classroom/CreateLiveSessionPage.tsx`](file:///d:/02.Code/GVCN/src/modules/live-classroom/CreateLiveSessionPage.tsx), [`src/core/services/live-classroom/live-session.service.ts`](file:///d:/02.Code/GVCN/src/core/services/live-classroom/live-session.service.ts).
* **Last verified**: `2026-08-17`.

---

### FEAT-LIVE-002 — Lưới Thẻ Học Sinh Fluid Clamping Responsive
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Lưới thẻ học sinh hiển thị toàn bộ 40–50 học sinh trên 1 màn hình 1080p không bị nén chữ nhỏ, hỗ trợ 4 chế độ mật độ (`Tự động | Lớn | Vừa | Gọn`), phím tắt `F` vào chế độ Trình chiếu Fullscreen in-place. Thẻ học sinh hiển thị avatar co giãn `fluid`, trạng thái giơ tay, điểm phiên và nút cộng/trừ điểm nhanh $\ge 40\text{px}$.
* **Source evidence**: [`src/modules/live-classroom/LiveClassroomActivePage.tsx`](file:///d:/02.Code/GVCN/src/modules/live-classroom/LiveClassroomActivePage.tsx), [`src/modules/live-classroom/StudentCard.tsx`](file:///d:/02.Code/GVCN/src/modules/live-classroom/StudentCard.tsx), [`src/shared/hooks/useUiScale.ts`](file:///d:/02.Code/GVCN/src/shared/hooks/useUiScale.ts).
* **Tests**: `src/shared/hooks/useUiScale.test.ts` (4 tests passed).
* **Last verified**: `2026-08-17`.

---

### FEAT-LIVE-003 — Hộp Công Cụ Nổi: Bốc Thăm, Hẹn Giờ, Bầu Chọn
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Hộp công cụ nổi (`FloatingClassroomToolbox`) gồm:
  1. *Bốc thăm ngẫu nhiên (`RandomPickerTool`)*: Hiệu ứng quay số, loại trừ học sinh đã gọi nhiều lần, âm thanh star chime.
  2. *Đồng hồ đếm ngược / Bấm giờ*: Báo chuông khi hết giờ làm bài tập.
  3. *Khảo sát / Biểu quyết nhanh*: Thu thập ý kiến học sinh trong tiết học.
* **Source evidence**: [`src/modules/live-classroom/FloatingClassroomToolbox.tsx`](file:///d:/02.Code/GVCN/src/modules/live-classroom/FloatingClassroomToolbox.tsx), [`src/modules/live-classroom/tools/RandomPickerTool.tsx`](file:///d:/02.Code/GVCN/src/modules/live-classroom/tools/RandomPickerTool.tsx), [`src/shared/utilities/sound.ts`](file:///d:/02.Code/GVCN/src/shared/utilities/sound.ts).
* **Last verified**: `2026-08-17`.

---

### FEAT-LIVE-004 — Hàng Đợi Học Sinh Đã Gọi & Đánh Giá Phản Hồi
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Quản lý danh sách học sinh được gọi phát biểu trong tiết học theo thứ tự thời gian; đánh giá 3 mức độ phản hồi: Trả lời tốt (`answered`), Cần trợ giúp (`needs_support`), Bỏ qua (`skipped`).
* **Source evidence**: [`src/modules/live-classroom/components/CalledStudentsQueue.tsx`](file:///d:/02.Code/GVCN/src/modules/live-classroom/components/CalledStudentsQueue.tsx), [`src/core/services/live-classroom/called-queue.service.ts`](file:///d:/02.Code/GVCN/src/core/services/live-classroom/called-queue.service.ts).
* **Last verified**: `2026-08-17`.

---

### FEAT-LIVE-005 — Chia Nhóm Học Tập Ngẫu Nhiên & Chấm Điểm Nhóm
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Chia đều sĩ số lớp vào 2–8 nhóm học tập tự động hoặc thủ công; chấm điểm thưởng đồng loạt cho toàn bộ thành viên trong nhóm.
* **Source evidence**: [`src/core/services/live-classroom/live-group.service.ts`](file:///d:/02.Code/GVCN/src/core/services/live-classroom/live-group.service.ts), [`src/modules/live-classroom/LiveClassroomActivePage.tsx`](file:///d:/02.Code/GVCN/src/modules/live-classroom/LiveClassroomActivePage.tsx).
* **Last verified**: `2026-08-17`.

---

### FEAT-LIVE-006 — Đồng Bộ Đa Màn Hình Qua BroadcastChannel API
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Cho phép giáo viên mở màn hình trình chiếu học sinh tại `/live-classroom/:sessionId/present` trên máy chiếu, trong khi màn hình giáo viên điều khiển chấm điểm và bốc thăm tại `/live-classroom/:sessionId`. Hai màn hình đồng bộ tức thì không cần Internet thông qua `BroadcastChannel('so_chu_nhiem_live_broadcast')`.
* **Source evidence**: [`src/core/services/live-classroom/live-broadcast.ts`](file:///d:/02.Code/GVCN/src/core/services/live-classroom/live-broadcast.ts), [`src/modules/live-classroom/LiveClassroomPresentPage.tsx`](file:///d:/02.Code/GVCN/src/modules/live-classroom/LiveClassroomPresentPage.tsx).
* **Last verified**: `2026-08-17`.

---

### FEAT-LIVE-007 — Đồng Bộ Điểm & Chuyên Cần Vào Sổ Chính Khi Đóng Phiên
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Khi bấm "Kết thúc tiết học", hệ thống hiển thị `SessionSummaryModal` tổng hợp toàn bộ điểm cộng/trừ và trạng thái chuyên cần trong tiết, sau đó tự động ghi nhận vào `pointEntries` và `attendanceRecords` của sổ chính thức.
* **Source evidence**: [`src/modules/live-classroom/SessionSummaryModal.tsx`](file:///d:/02.Code/GVCN/src/modules/live-classroom/SessionSummaryModal.tsx), [`src/core/services/live-classroom/live-session.service.ts`](file:///d:/02.Code/GVCN/src/core/services/live-classroom/live-session.service.ts).
* **Last verified**: `2026-08-17`.

---

### FEAT-LIVE-008 — Lịch Sử Phiên Học & Báo Cáo Thống Kê Tiết Học
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Xem lại danh sách các phiên học đã hoàn thành, tổng số điểm đã phát, số lượt giơ tay phát biểu và tỷ lệ tương tác của từng học sinh.
* **Entry points**: Route `/live-classroom/history`.
* **Source evidence**: [`src/modules/live-classroom/LiveClassroomHistoryPage.tsx`](file:///d:/02.Code/GVCN/src/modules/live-classroom/LiveClassroomHistoryPage.tsx), [`src/core/services/live-classroom/live-report.service.ts`](file:///d:/02.Code/GVCN/src/core/services/live-classroom/live-report.service.ts).
* **Last verified**: `2026-08-17`.

---

### FEAT-REPO-001 — Trung Tâm Báo Cáo Tổng Quan & KPI Lớp Chủ Nhiệm
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Màn hình tổng hợp toàn bộ báo cáo phân tích theo thời gian (Tuần / Tháng / Học kỳ / Cả năm) gồm 5 tab chuyên sâu: Tổng quan, Chuyên cần, Điểm thi đua & Cấp bậc, Tương tác học tập, Danh hiệu Bảng vàng.
* **Entry points**: Route `/reports`.
* **Tests**: `src/core/services/report-aggregation.service.test.ts` (4 tests passed).
* **Source evidence**: [`src/modules/reports/ReportsOverviewPage.tsx`](file:///d:/02.Code/GVCN/src/modules/reports/ReportsOverviewPage.tsx), [`src/core/services/report-aggregation.service.ts`](file:///d:/02.Code/GVCN/src/core/services/report-aggregation.service.ts).
* **Last verified**: `2026-08-17`.

---

### FEAT-REPO-002 — Biểu Đồ Chuyên Cần, Phân Bố Điểm Số & Tương Tác
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Hiển thị các biểu đồ trực quan Recharts: Biểu đồ đường xu hướng chuyên cần theo ngày/tuần, Biểu đồ cột phân bố điểm số theo nhóm học sinh, Biểu đồ tròn cơ cấu điểm cộng/trừ.
* **Source evidence**: [`src/modules/reports/AttendanceReportPage.tsx`](file:///d:/02.Code/GVCN/src/modules/reports/AttendanceReportPage.tsx), [`src/modules/reports/PointsRanksReportPage.tsx`](file:///d:/02.Code/GVCN/src/modules/reports/PointsRanksReportPage.tsx), [`src/modules/reports/EngagementReportPage.tsx`](file:///d:/02.Code/GVCN/src/modules/reports/EngagementReportPage.tsx).
* **Last verified**: `2026-08-17`.

---

### FEAT-REPO-003 — Báo Cáo Tiến Độ Thăng Cấp & Danh Hiệu Bảng Vàng
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Thống kê số lượng học sinh được phong quân hàm theo từng cấp bậc và tần suất nhận danh hiệu Bảng vàng trong năm học.
* **Source evidence**: [`src/modules/reports/HonorsReportPage.tsx`](file:///d:/02.Code/GVCN/src/modules/reports/HonorsReportPage.tsx), [`src/modules/reports/components/PromotionHistoryReportChart.tsx`](file:///d:/02.Code/GVCN/src/modules/reports/components/PromotionHistoryReportChart.tsx).
* **Last verified**: `2026-08-17`.

---

### FEAT-REPO-004 — So Sánh Đối Sánh Giữa Các Lớp Chủ Nhiệm
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Hỗ trợ giáo viên chủ nhiệm phụ trách 2–3 lớp so sánh đối sánh tỷ lệ chuyên cần, điểm thi đua trung bình và tiến độ thăng cấp giữa các lớp.
* **Entry points**: Route `/reports/compare`.
* **Source evidence**: [`src/modules/reports/ClassComparisonPage.tsx`](file:///d:/02.Code/GVCN/src/modules/reports/ClassComparisonPage.tsx), [`src/core/services/report-comparison.service.ts`](file:///d:/02.Code/GVCN/src/core/services/report-comparison.service.ts).
* **Last verified**: `2026-08-17`.

---

### FEAT-REPO-005 — Báo Cáo Hồ Sơ Cá Nhân Học Sinh Chuẩn In Ấn A4
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Tạo trang hồ sơ cá nhân định dạng tối ưu in ấn (CSS `@media print` trang A4): Thông tin cá nhân, biểu đồ tăng trưởng điểm số, danh hiệu đạt được, nhật ký liên lạc phụ huynh gửi cho cha mẹ học sinh cuối kỳ.
* **Entry points**: Route `/reports/student/:studentId`.
* **Source evidence**: [`src/modules/reports/StudentReportPage.tsx`](file:///d:/02.Code/GVCN/src/modules/reports/StudentReportPage.tsx), [`src/core/services/report-export.service.ts`](file:///d:/02.Code/GVCN/src/core/services/report-export.service.ts).
* **Last verified**: `2026-08-17`.

---

### FEAT-REPO-006 — Chế Độ Trình Chiếu Báo Cáo Toàn Màn Hình & Auto-Slide
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Trình chiếu slide báo cáo tổng kết lớp học phục vụ buổi Họp Phụ Huynh cuối kỳ với chế độ toàn màn hình, chuyển trang tự động và giao diện tối ưu máy chiếu.
* **Entry points**: Route `/reports/presentation`.
* **Source evidence**: [`src/modules/reports/ReportPresentationPage.tsx`](file:///d:/02.Code/GVCN/src/modules/reports/ReportPresentationPage.tsx).
* **Last verified**: `2026-08-17`.

---

### FEAT-REPO-007 — Nhận Xét & Đánh Giá Sư Phạm Tự Động
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Component `ReportInsightPanel` tự động sinh nhận xét sư phạm dựa trên dữ liệu thi đua, chuyên cần và nhật ký phụ huynh, phát hiện sớm học sinh vắng học tăng đột biến hoặc nỗ lực tiến bộ rõ rệt.
* **Source evidence**: [`src/modules/reports/components/ReportInsightPanel.tsx`](file:///d:/02.Code/GVCN/src/modules/reports/components/ReportInsightPanel.tsx), [`src/core/services/report-aggregation.service.ts`](file:///d:/02.Code/GVCN/src/core/services/report-aggregation.service.ts).
* **Last verified**: `2026-08-17`.

---

### FEAT-REPO-008 — Modal Drill-Down Đào Sâu Dữ Liệu Danh Sách Từ Biểu Đồ
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Cho phép giáo viên click trực tiếp vào các cột hoặc lát cắt biểu đồ để mở `DrillDownModal`, xem danh sách học sinh tương ứng (kèm avatar, mã HS, số điểm) và click xem hồ sơ chi tiết.
* **Source evidence**: [`src/modules/reports/components/DrillDownModal.tsx`](file:///d:/02.Code/GVCN/src/modules/reports/components/DrillDownModal.tsx).
* **Last verified**: `2026-08-17`.

---

### FEAT-EXCL-001 — Nhập Danh Sách Học Sinh Từ Excel Chuẩn Bộ GD&ĐT
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Hỗ trợ nhập danh sách học sinh từ file Excel `.xlsx`, tự động ánh xạ tiêu đề cột tiếng Việt (STT, Mã học sinh, Họ và tên, Giới tính, Ngày sinh, Dân tộc, Địa chỉ, Số điện thoại phụ huynh), vệ sinh công thức độc hại (`excel.sanitizer.ts`) và xem trước dữ liệu trước khi nạp.
* **Tests**: `src/core/excel/excel.service.test.ts` (6 tests passed).
* **Source evidence**: [`src/modules/excel/ExcelImportModal.tsx`](file:///d:/02.Code/GVCN/src/modules/excel/ExcelImportModal.tsx), [`src/core/excel/excel-import.service.ts`](file:///d:/02.Code/GVCN/src/core/excel/excel-import.service.ts), [`src/core/excel/excel.sanitizer.ts`](file:///d:/02.Code/GVCN/src/core/excel/excel.sanitizer.ts).
* **Last verified**: `2026-08-17`.

---

### FEAT-EXCL-002 — Xuất Danh Sách Học Sinh, Điểm Danh, Thi Đua Ra Excel
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Xuất file Excel chuẩn hóa định dạng bảng biểu, có tiêu đề trường, lớp, năm học và chữ ký giáo viên chủ nhiệm.
* **Source evidence**: [`src/core/excel/excel-export.service.ts`](file:///d:/02.Code/GVCN/src/core/excel/excel-export.service.ts).
* **Last verified**: `2026-08-17`.

---

### FEAT-BCKP-001 — Sao Lưu Toàn Bộ Database Thành File `.gvcn-backup` Mã Hóa
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Đóng gói toàn bộ 30 bảng IndexedDB thành 1 file sao lưu định dạng `.gvcn-backup` có checksum SHA-256, thông tin metadata và mã hóa AES-GCM (tùy chọn mật khẩu).
* **Entry points**: Route `/backup`.
* **Tests**: `src/core/backup/backup.service.test.ts` (7 tests passed).
* **Source evidence**: [`src/modules/backup/BackupPage.tsx`](file:///d:/02.Code/GVCN/src/modules/backup/BackupPage.tsx), [`src/core/backup/backup.service.ts`](file:///d:/02.Code/GVCN/src/core/backup/backup.service.ts), [`src/core/backup/crypto.ts`](file:///d:/02.Code/GVCN/src/core/backup/crypto.ts).
* **Last verified**: `2026-08-17`.

---

### FEAT-BCKP-002 — Khôi Phục An Toàn Database Với Schema Validation & Rollback
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Khôi phục dữ liệu từ file sao lưu `.gvcn-backup`, tự động xác thực tính toàn vẹn Checksum, kiểm tra phiên bản Schema Zod và rollback toàn bộ nếu có lỗi trong quá trình nạp.
* **Source evidence**: [`src/modules/backup/BackupPage.tsx`](file:///d:/02.Code/GVCN/src/modules/backup/BackupPage.tsx), [`src/core/backup/backup.service.ts`](file:///d:/02.Code/GVCN/src/core/backup/backup.service.ts).
* **Last verified**: `2026-08-17`.

---

### FEAT-BCKP-003 — Nhắc Nhở Định Kỳ Sao Lưu Dữ Liệu Tự Động
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Kiểm tra thời gian kể từ lần sao lưu gần nhất. Nếu quá 7 ngày hoặc chưa từng sao lưu, banner cảnh báo sẽ xuất hiện trên Header và trang Privacy để nhắc giáo viên tải file dự phòng về máy.
* **Source evidence**: [`src/shared/hooks/useLastBackupStatus.ts`](file:///d:/02.Code/GVCN/src/shared/hooks/useLastBackupStatus.ts), [`src/core/services/storage-health.service.ts`](file:///d:/02.Code/GVCN/src/core/services/storage-health.service.ts).
* **Last verified**: `2026-08-17`.

---

### FEAT-TRSH-001 — Quản Lý Danh Sách Đối Tượng Xóa Tạm (Soft Delete)
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Liệt kê toàn bộ các bản ghi Học sinh, Lớp học, Điểm thi đua đã bị xóa tạm (`deletedAt != null`), bảo vệ dữ liệu không bị mất vĩnh viễn khi thao tác nhầm.
* **Entry points**: Route `/trash`.
* **Tests**: `src/core/services/trash-audit.service.test.ts` (4 tests passed).
* **Source evidence**: [`src/modules/trash/TrashPage.tsx`](file:///d:/02.Code/GVCN/src/modules/trash/TrashPage.tsx), [`src/core/services/trash.service.ts`](file:///d:/02.Code/GVCN/src/core/services/trash.service.ts).
* **Last verified**: `2026-08-17`.

---

### FEAT-TRSH-002 — Khôi Phục Dữ Liệu Hoặc Xóa Vĩnh Viễn
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Cho phép giáo viên bấm "Khôi phục" đưa đối tượng trở lại danh sách hoạt động, hoặc "Xóa vĩnh viễn" (Hard delete) để giải phóng dung lượng.
* **Source evidence**: [`src/modules/trash/TrashPage.tsx`](file:///d:/02.Code/GVCN/src/modules/trash/TrashPage.tsx), [`src/core/services/trash.service.ts`](file:///d:/02.Code/GVCN/src/core/services/trash.service.ts).
* **Last verified**: `2026-08-17`.

---

### FEAT-AUDT-001 — Tự Động Ghi Vết Audit Log Cho Mọi Thao Tác Dữ Liệu
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Tầng `BaseRepository` tự động ghi vết mọi hành động `CREATE`, `UPDATE`, `DELETE`, `RESTORE`, `BACKUP`, `RESTORE_DB`, `IMPORT_EXCEL`, `REVERSE` kèm timestamp ISO UTC và thông tin chi tiết vào bảng `auditLogs`.
* **Source evidence**: [`src/core/repositories/base.repository.ts`](file:///d:/02.Code/GVCN/src/core/repositories/base.repository.ts), [`src/core/services/audit.service.ts`](file:///d:/02.Code/GVCN/src/core/services/audit.service.ts).
* **Last verified**: `2026-08-17`.

---

### FEAT-AUDT-002 — Tra Cứu & Bộ Lọc Nâng Cao Nhật Ký Kiểm Soát
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Trang tra cứu nhật ký kiểm soát với bộ lọc theo loại hành động, tìm kiếm theo tên đối tượng hoặc chi tiết thay đổi.
* **Entry points**: Route `/audit-logs`.
* **Source evidence**: [`src/modules/audit/AuditLogPage.tsx`](file:///d:/02.Code/GVCN/src/modules/audit/AuditLogPage.tsx).
* **Last verified**: `2026-08-17`.

---

### FEAT-PRIV-001 — Health Check Database & Đo Lường Dung Lượng IndexedDB
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Đo lường tổng số bản ghi trên từng bảng, phiên bản schema hiện tại và ước tính dung lượng bộ nhớ đã chiếm dụng thông qua Web Storage Estimate API.
* **Entry points**: Route `/privacy`.
* **Tests**: `src/core/database/db.test.ts` (6 tests passed).
* **Source evidence**: [`src/modules/privacy/PrivacyStoragePage.tsx`](file:///d:/02.Code/GVCN/src/modules/privacy/PrivacyStoragePage.tsx), [`src/core/services/storage-health.service.ts`](file:///d:/02.Code/GVCN/src/core/services/storage-health.service.ts), [`src/core/database/db.ts`](file:///d:/02.Code/GVCN/src/core/database/db.ts).
* **Last verified**: `2026-08-17`.

---

### FEAT-PRIV-002 — Yêu Cầu Quyền Lưu Trữ Bền Vững (Persistent Storage)
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Kích hoạt `navigator.storage.persist()` để ngăn trình duyệt tự ý xóa dữ liệu IndexedDB khi thiết bị gần đầy bộ nhớ.
* **Source evidence**: [`src/modules/privacy/PrivacyStoragePage.tsx`](file:///d:/02.Code/GVCN/src/modules/privacy/PrivacyStoragePage.tsx), [`src/core/services/storage-health.service.ts`](file:///d:/02.Code/GVCN/src/core/services/storage-health.service.ts).
* **Last verified**: `2026-08-17`.

---

### FEAT-PRIV-003 — Cam Kết 100% Offline & Minh Bạch 0% Telemetry
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Minh bạch chính sách bảo mật: Không gửi bất kỳ telemetry hay dữ liệu người dùng nào ra ngoài Internet; cảnh báo người dùng về việc xóa lịch sử duyệt web có thể làm mất IndexedDB nếu không sao lưu.
* **Source evidence**: [`src/modules/privacy/PrivacyStoragePage.tsx`](file:///d:/02.Code/GVCN/src/modules/privacy/PrivacyStoragePage.tsx).
* **Last verified**: `2026-08-17`.

---

### FEAT-SETT-001 — Thiết Lập Năm Học & Lớp Học Chủ Nhiệm Mặc Định
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Cấu hình năm học hiện tại (`activeAcademicYearId`) và lớp học đang chủ nhiệm (`activeClassId`) để tự động áp dụng trên toàn bộ các module khác khi tải trang.
* **Entry points**: Route `/settings`.
* **Source evidence**: [`src/modules/settings/SettingsPage.tsx`](file:///d:/02.Code/GVCN/src/modules/settings/SettingsPage.tsx), [`src/core/repositories/settings.repository.ts`](file:///d:/02.Code/GVCN/src/core/repositories/settings.repository.ts).
* **Last verified**: `2026-08-17`.

---

### FEAT-SETT-002 — Cấu Hình Avatar Học Sinh Mặc Định Toàn Hệ Thống
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Chọn 1 avatar từ bộ sưu tập 31 ảnh làm avatar mặc định toàn hệ thống (`defaultStudentAvatarKey`). Mọi học sinh chưa chọn avatar riêng sẽ tự động hiển thị avatar này.
* **Source evidence**: [`src/modules/settings/SettingsPage.tsx`](file:///d:/02.Code/GVCN/src/modules/settings/SettingsPage.tsx), [`src/shared/components/AvatarPickerModal.tsx`](file:///d:/02.Code/GVCN/src/shared/components/AvatarPickerModal.tsx).
* **Last verified**: `2026-08-17`.

---

### FEAT-SETT-003 — Hệ Thống 6 Chủ Đề Giao Diện Văn Hóa Việt Nam
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Chuyển đổi linh hoạt giữa 6 chủ đề mang bản sắc văn hóa Việt Nam:
  1. *Truyền thống (`traditional`)*: Tông màu đỏ son & vàng hoàng gia.
  2. *Hoa Sen (`lotus`)*: Tông màu hồng sen & ngọc bích trang nhã.
  3. *Hiện đại (`modern`)*: Tông màu xanh navy & lam hiện đại.
  4. *Quân đội (`military`)*: Tông màu xanh rêu & sao vàng kỷ luật.
  5. *Dân tộc (`ethnic`)*: Tông màu thổ cẩm & sắc màu Tây Bắc/Tây Nguyên.
  6. *Vùng miền (`regions`)*: Tông màu xanh biển đảo & non sông đất nước.
* **Tests**: `src/core/services/theme.service.test.ts` (3 tests passed).
* **Source evidence**: [`src/core/services/theme.service.ts`](file:///d:/02.Code/GVCN/src/core/services/theme.service.ts), [`src/modules/settings/ThemePreviewModal.tsx`](file:///d:/02.Code/GVCN/src/modules/settings/ThemePreviewModal.tsx), [`src/shared/hooks/useTheme.ts`](file:///d:/02.Code/GVCN/src/shared/hooks/useTheme.ts).
* **Last verified**: `2026-08-17`.

---

## 13. Module Quà Tặng & Quy Đổi Điểm Tích Lũy (Gift & Reward Redemption)

### FEAT-GIFT-001 — Thư Viện Quà Tặng và Quy Đổi Điểm Tích Lũy Học Sinh
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Cung cấp giải pháp trọn vẹn cho giáo viên chủ nhiệm quản lý thư viện quà tặng khuyến khích học tập, theo dõi điểm khả dụng và thực hiện quy đổi quà cho học sinh an toàn, nguyên tử, bảo toàn tuyệt đối cấp bậc quân hàm thi đua.
* **Key Features**:
  1. **Tách bạch 2 loại điểm**:
     - `achievementScore` (Điểm thành tích): Tính từ điểm thi đua (`pointEntries`), dùng để tính cấp bậc quân hàm và bảng vàng. Giao dịch đổi quà **không bao giờ** làm giảm cấp bậc của học sinh.
     - `redeemableBalance` (Điểm khả dụng): Tính theo công thức $\text{redeemableBalance} = \max(0, \text{achievementScore} - \sum \text{totalPoints(COMPLETED)})$.
  2. **Quản lý Thư viện Quà tặng (Catalog & Inventory)**:
     - Phân loại danh mục: `STATIONERY` (Dụng cụ học tập), `BOOK` (Sách truyện), `TOY` (Đồ chơi), `PRIVILEGE` (Đặc quyền lớp học như đổi chỗ, làm trưởng nhóm), `SNACK` (Bánh kẹo), `OTHER`.
     - Chế độ quản lý kho: `TRACKED` (theo dõi tồn kho, cảnh báo sắp hết, chặn khi hết hàng) vs `UNLIMITED` (đặc quyền lớp học không giới hạn tồn kho).
     - Điều chỉnh tồn kho nhanh kèm lý do bắt buộc và lưu vết `giftStockMovements`.
     - Tự động seed 10 món quà mẫu mang tính giáo dục khi khởi tạo thư viện.
  3. **Quy trình Đổi quà Giỏ hàng & Giao dịch Nguyên tử**:
     - Báo giá thời gian thực (`quoteRedemption`): kiểm tra số dư, tồn kho, tính số dư còn lại sau đổi.
     - Xác nhận giao dịch trong Dexie Read-Write Transaction nguyên tử: kiểm tra `idempotencyKey` chống duplicate submit/race condition, snapshot đơn giá và tên quà tại thời điểm giao dịch, trừ tồn kho và ghi nhật ký `db.auditLogs`.
     - Hủy giao dịch (`cancelRedemption`): Hoàn điểm khả dụng và hoàn kho đúng 1 lần (anti-double refund), bắt buộc nhập lý do hủy tối thiểu 3 ký tự.
  4. **Chế độ Trình chiếu Toàn màn hình (Presentation Mode)**:
     - Giao diện trình chiếu trực quan cho máy chiếu lớp học `/gifts/presentation`, chỉ đọc (Read-only), tuyệt đối không cho phép thao tác ghi hay hiển thị thông tin riêng tư.
* **Database & Schema**:
  - Dexie `version(9)` với 4 bảng mới: `gifts`, `giftRedemptions`, `giftRedemptionItems`, `giftStockMovements` (tổng cộng 36 bảng).
* **Entry points**:
  - Workspace: `/gifts` (Tab: Thư viện Quà tặng, Đổi quà Học sinh, Lịch sử Giao dịch).
  - Trình chiếu: `/gifts/presentation`.
  - Sidebar: Nhóm `Quà tặng` với 2 sub-items (`Thư viện & Đổi quà`, `Trình chiếu Catalog`).
* **Tests**:
  - `src/core/services/reward-balance.service.test.ts` (4 tests passed).
  - `src/core/services/gift-redemption.service.test.ts` (8 tests passed).
  - `src/modules/gifts/GiftsPage.test.tsx` (3 tests passed).
  - `src/core/database/db.test.ts` (6 tests passed, asserts 36 tables & version 9).
  - `src/core/backup/backup.service.test.ts` (7 tests passed, asserts 36 tables backup/restore).
* **Source evidence**:
  - Repositories: [`src/core/repositories/gift.repository.ts`](file:///d:/02.Code/GVCN/src/core/repositories/gift.repository.ts), [`src/core/repositories/gift-redemption.repository.ts`](file:///d:/02.Code/GVCN/src/core/repositories/gift-redemption.repository.ts), [`src/core/repositories/gift-stock-movement.repository.ts`](file:///d:/02.Code/GVCN/src/core/repositories/gift-stock-movement.repository.ts).
  - Services: [`src/core/services/reward-balance.service.ts`](file:///d:/02.Code/GVCN/src/core/services/reward-balance.service.ts), [`src/core/services/gift.service.ts`](file:///d:/02.Code/GVCN/src/core/services/gift.service.ts), [`src/core/services/gift-redemption.service.ts`](file:///d:/02.Code/GVCN/src/core/services/gift-redemption.service.ts), [`src/core/services/gift-seed.service.ts`](file:///d:/02.Code/GVCN/src/core/services/gift-seed.service.ts).
  - UI Components: [`src/modules/gifts/GiftsPage.tsx`](file:///d:/02.Code/GVCN/src/modules/gifts/GiftsPage.tsx), [`src/modules/gifts/GiftPresentationPage.tsx`](file:///d:/02.Code/GVCN/src/modules/gifts/GiftPresentationPage.tsx), [`src/modules/gifts/components/`](file:///d:/02.Code/GVCN/src/modules/gifts/components/).
* **Last verified**: `2026-08-17`.

---

### FEAT-GIFT-002 — Thẻ Lật Quà Tặng 3D (Gift 3D Flip Card Interaction)
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Thiết kế và triển khai thẻ quà tặng lật 3D hai mặt mượt mà, giúp học sinh và giáo viên chiêm ngưỡng hình ảnh lớn của món quà khi chạm/click hoặc điều hướng bàn phím, tạo động lực thi đua học tập trực quan sinh động.
* **Key Features**:
  1. **Hiệu ứng lật thẻ 3D chuẩn CSS**:
     - Mặt trước hiển thị thông tin nghiệp vụ quà tặng (icon, danh mục, tên quà, mô tả, điểm quy đổi, trạng thái tồn kho).
     - Mặt sau hiển thị ảnh phóng to của món quà (`object-fit: contain`) với nền trung tính và fallback an toàn khi không có ảnh hoặc ảnh lỗi.
     - Sử dụng CSS 3D (`perspective: 1200px`, `transform-style: preserve-3d`, `rotateY(180deg)`, `backface-visibility: hidden`) với thời lượng 450ms và easing `cubic-bezier(0.22, 1, 0.36, 1)`.
     - Tuyệt đối không gây layout shift cho các thẻ lân cận nhờ chiều cao cố định và cấu trúc wrapper bảo toàn kích thước.
  2. **Chính sách chỉ 1 thẻ lật tại một thời điểm (Single-Card Flip Policy)**:
     - Quản lý trạng thái `flippedGiftId: string | null` tại grid cha (`GiftCatalogTab`, `GiftRedeemTab`, `GiftPresentationPage`).
     - Bấm thẻ A $\rightarrow$ A lật; bấm lại A $\rightarrow$ A quay lại mặt trước; đang mở A bấm B $\rightarrow$ A tự động đóng, B mở.
     - Thay đổi bộ lọc tìm kiếm, danh mục, lớp học, học sinh $\rightarrow$ tự động reset `flippedGiftId`.
  3. **Tách biệt ngữ nghĩa & Chống xung đột nút thao tác**:
     - Thẻ quà là `<article>`, vùng lật là `<button type="button">` riêng biệt.
     - Hàng nút hành động (Sửa, Kho, Lưu trữ, Thêm giỏ, +, -) là sibling độc lập với `stopPropagation`, không tạo nested `<button>` lồng trong `<button>`.
     - Quà hết hàng hoặc chưa đủ điểm vẫn lật xem được ảnh bình thường.
  4. **Khả năng tiếp cận (Accessibility WCAG AA) & Bàn phím**:
     - Hỗ trợ đầy đủ phím `Enter` và `Space` để lật thẻ, phím `Escape` để đóng thẻ đang lật.
     - `aria-pressed`, `aria-label` tự động cập nhật linh hoạt theo mặt thẻ.
     - `aria-hidden` và `tabIndex={-1}` trên mặt bị ẩn, ngăn chặn screen reader đọc đồng thời hoặc Tab vào control ở mặt sau khi đang ẩn.
     - Tôn trọng `prefers-reduced-motion: reduce`: tắt animation xoay 3D, đổi mặt tức thì không delay.
  5. **Tái sử dụng đa màn hình (Unified Component)**:
     - Component [`GiftFlipCard.tsx`](file:///d:/02.Code/GVCN/src/modules/gifts/components/GiftFlipCard.tsx) dùng chung cho cả 3 chế độ: `catalog` (Thư viện quà), `redemption` (Đổi quà giỏ hàng), `presentation` (Trình chiếu toàn màn hình Read-only).
* **Parent Dependency**: `FEAT-GIFT-001`.
* **Tests**:
  - `src/modules/gifts/components/GiftFlipCard.test.tsx` (9 tests passed).
  - `src/modules/gifts/GiftsPage.test.tsx` (3 tests passed).
* **Source evidence**:
  - Component: [`src/modules/gifts/components/GiftFlipCard.tsx`](file:///d:/02.Code/GVCN/src/modules/gifts/components/GiftFlipCard.tsx).
  - Styles: [`src/index.css`](file:///d:/02.Code/GVCN/src/index.css) (`.gift-card-perspective`, `.gift-card-inner`, `.gift-card-face`, `.gift-card-front`, `.gift-card-back`).
  - Catalog Grid: [`src/modules/gifts/components/GiftCatalogTab.tsx`](file:///d:/02.Code/GVCN/src/modules/gifts/components/GiftCatalogTab.tsx).
  - Redeem Grid: [`src/modules/gifts/components/GiftRedeemTab.tsx`](file:///d:/02.Code/GVCN/src/modules/gifts/components/GiftRedeemTab.tsx).
  - Presentation Grid: [`src/modules/gifts/GiftPresentationPage.tsx`](file:///d:/02.Code/GVCN/src/modules/gifts/GiftPresentationPage.tsx).
* **Last verified**: `2026-08-17`.

---

### FEAT-GIFT-003 — Tải Ảnh Lên, Xử Lý & Lưu Trữ Cục Bộ Cho Quà Tặng (Offline Gift Image Management)
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Bổ sung tính năng chọn/kéo-thả ảnh từ thiết bị cục bộ, xác thực đa tầng, re-encode loại bỏ EXIF/GPS, tạo bản phóng to (Full) và bản thu nhỏ (Thumbnail), lưu trữ nhị phân an toàn trong IndexedDB (`giftImages`), tích hợp thẻ lật 3D và bảo toàn trong file sao lưu `.gvcn-backup`.
* **Key Features**:
  1. **Định dạng & Giới hạn hỗ trợ**:
     - Định dạng cho phép: JPEG, PNG, WebP.
     - Dung lượng tối đa: $\le 5$ MiB; kích thước tối đa: $\le 8192$ px mỗi chiều; tổng số pixel: $\le 20$ MP.
     - Từ chối triệt để SVG, PDF, HTML, file script hoặc file đổi đuôi giả.
  2. **Pipeline xác thực & xử lý an toàn (`giftImageProcessor`)**:
     - Kiểm tra kích thước file và phần mở rộng (allowlist).
     - Kiểm tra Header Magic Bytes (JPEG: `FF D8 FF`, PNG: `89 50 4E 47...`, WebP: `RIFF...WEBP`).
     - Giải mã an toàn bằng Canvas, chuẩn hóa orientation, loại bỏ 100% EXIF/GPS/Camera metadata.
     - Tạo **Full Image** (cạnh dài $\le 1200$ px, nén chất lượng cao $\le 1$ MB) cho mặt sau thẻ lật.
     - Tạo **Thumbnail** (cạnh dài $\le 320$ px, siêu nhẹ $\approx 15-40$ KB) cho danh sách Catalog & Giỏ hàng.
     - Tính toán mã băm SHA-256 (`contentHash`).
  3. **Lưu trữ nhị phân IndexedDB (Dexie `version(10)`)**:
     - Bảng chuyên biệt `giftImages` (`id, &giftId, updatedAt`) lưu `fullBlob`, `thumbnailBlob`, MIME, dimensions, bytes và `version`.
     - `Gift` lưu tham chiếu `imageId?: string`, `imageVersion?: number`.
     - Transaction commit atomically cả món quà và ảnh; tự động dọn dẹp ảnh cũ khi thay ảnh hoặc xóa ảnh.
  4. **Quản lý Object URL & Bộ nhớ (`useGiftImage`)**:
     - Quản lý vòng đời `URL.createObjectURL` / `URL.revokeObjectURL` tự động khi component unmount hoặc đổi version.
     - Hỗ trợ batch loading thumbnail cho catalog grid tránh hiện tượng N+1 query.
  5. **Bảo toàn dữ liệu trong Sao lưu & Khôi phục (Backup & Restore)**:
     - Tự động serialize `Blob` thành chuẩn an toàn (Base64 + MIME) trong file `.gvcn-backup` có mã hóa AES-256-GCM.
     - Khôi phục và tái tạo Blob chính xác khi restore, validate cấu trúc trước khi ghi vào database.
  6. **Giao diện & Accessibility**:
     - Component `GiftImageUploadField` hỗ trợ click chọn file, kéo-thả (Drag & Drop), điều hướng bàn phím (`Enter`/`Space`).
     - Hiển thị dung lượng trước và sau tối ưu (ví dụ: `2.4 MB -> 180 KB`).
     - Nút "Thay ảnh", "Xóa ảnh" (pending removal), "Hủy thay đổi".
* **Parent Dependencies**: `FEAT-GIFT-001`, `FEAT-GIFT-002`.
* **Tests**:
  - `src/core/services/gift-image-processor.service.test.ts` (10 tests passed).
  - `src/core/services/gift-image.service.test.ts` (5 tests passed).
  - `src/modules/gifts/components/GiftImageUploadField.test.tsx` (4 tests passed).
  - `src/core/backup/backup.service.test.ts` (8 tests passed, asserts Blob round-trip).
  - `src/core/database/db.test.ts` (6 tests passed, asserts 37 tables & version 10).
* **Source evidence**:
  - Services: [`src/core/services/gift-image-processor.service.ts`](file:///d:/02.Code/GVCN/src/core/services/gift-image-processor.service.ts), [`src/core/services/gift-image.service.ts`](file:///d:/02.Code/GVCN/src/core/services/gift-image.service.ts), [`src/core/services/gift.service.ts`](file:///d:/02.Code/GVCN/src/core/services/gift.service.ts).
  - Repositories: [`src/core/repositories/gift-image.repository.ts`](file:///d:/02.Code/GVCN/src/core/repositories/gift-image.repository.ts).
  - Hooks: [`src/modules/gifts/hooks/useGiftImage.ts`](file:///d:/02.Code/GVCN/src/modules/gifts/hooks/useGiftImage.ts).
  - UI Components: [`src/modules/gifts/components/GiftImageUploadField.tsx`](file:///d:/02.Code/GVCN/src/modules/gifts/components/GiftImageUploadField.tsx), [`src/modules/gifts/components/GiftFormModal.tsx`](file:///d:/02.Code/GVCN/src/modules/gifts/components/GiftFormModal.tsx), [`src/modules/gifts/components/GiftFlipCard.tsx`](file:///d:/02.Code/GVCN/src/modules/gifts/components/GiftFlipCard.tsx).
* **Last verified**: `2026-08-17`.

---

### FEAT-EVAL-001 — Sổ Nhận Xét và Đánh Giá Học Sinh Theo Thông tư 27 & Thông tư 22
* **Status**: `IMPLEMENTED`
* **Test status**: `TESTED`
* **Business goal**: Triển khai toàn diện hệ thống Sổ Nhận Xét và Đánh Giá Học Sinh theo chuẩn Bộ Giáo dục & Đào tạo:
  1. **Tiểu học (Khối 1–5 - `TT27_2020_PRIMARY`)**: 4 kỳ đánh giá (`MID_TERM_1`, `END_TERM_1`, `MID_TERM_2`, `END_YEAR`), đánh giá Môn học & HĐGD (Hoàn thành tốt `T`, Hoàn thành `H`, Chưa hoàn thành `C` + điểm định kỳ 1–10 cho Tiếng Việt, Toán...), 5 Phẩm chất chủ yếu (`YEU_NUOC`, `NHAN_AI`, `CHAM_CHI`, `TRUNG_THUC`, `TRACH_NHIEM` - Tốt `T`, Đạt `Đ`, Cần cố gắng `C`), 3 Năng lực chung & 7 Năng lực đặc thù (`TOT`, `DAT`, `CAN_CO_GANG`), và Đánh giá tổng hợp cuối năm (`HOAN_THANH_XUAT_SAC`, `HOAN_THANH_TOT`, `HOAN_THANH`, `CHUA_HOAN_THANH`, kết quả lên lớp, kế hoạch giáo dục cá nhân).
  2. **THCS & THPT (Khối 6–12 - `TT22_2021_LOWER_SECONDARY`, `TT22_2021_UPPER_SECONDARY`)**: 3 kỳ đánh giá (`TERM_1`, `TERM_2`, `FULL_YEAR`), môn nhận xét (`DAT`, `CHUA_DAT`), kết quả rèn luyện (`TOT`, `KHA`, `DAT`, `CHUA_DAT`), kết quả học tập (`TOT`, `KHA`, `DAT`, `CHUA_DAT`) và nhận xét tổng hợp GVCN.
  3. **Thư viện mẫu nhận xét & Token Composer**: Mẫu khung gợi ý với token linh hoạt (`{studentName}`, `{subjectName}`, `{strengthEvidence}`, `{progressEvidence}`, `{improvementArea}`, `{supportAction}`, `{nextStep}`), tự động nhận diện và chặn lưu/khóa sổ nếu còn token chưa thay thế.
  4. **Engine tổng hợp minh chứng cục bộ**: Đọc dữ liệu chuyên cần, điểm thi đua `pointEntries`, tương tác `liveClassParticipants` trong đúng phạm vi lớp/kỳ/năm học để gợi ý câu nhận xét sát thực tế (Manual apply 100%, không tự ý sửa dữ liệu).
  5. **Quy chuẩn sư phạm & Kiểm tra chất lượng**: Cảnh báo từ ngữ dán nhãn ("lười", "kém", "cá biệt"), cảnh báo nhận xét trùng lặp hàng loạt trên nhiều học sinh trong cùng lớp.
  6. **Quy trình Khóa sổ & Mở khóa an toàn**: Khóa sổ chính thức (Read-only); mở khóa sổ bắt buộc nhập lý do ($\ge 5$ ký tự) và tự động ghi nhận vào `auditLogs`.
  7. **Xuất Excel & In ấn**: Xuất file Excel `.xlsx` chuẩn bảng tổng hợp của Bộ GD&ĐT và in ấn A4.
* **Entry points**: Route `/evaluations`.
* **Tests**: `src/core/services/evaluation-profile.service.test.ts` (6 tests passed), `src/core/services/evaluation-template-seed.service.test.ts` (3 tests passed), `src/core/services/evaluation-validation.service.test.ts` (4 tests passed), `src/core/services/evaluation.service.test.ts` (4 tests passed), `src/modules/evaluations/EvaluationsPage.test.tsx` (2 tests passed).
* **Source evidence**: [`src/core/services/evaluation-profile.service.ts`](file:///d:/02.Code/GVCN/src/core/services/evaluation-profile.service.ts), [`src/core/services/evaluation.service.ts`](file:///d:/02.Code/GVCN/src/core/services/evaluation.service.ts), [`src/core/services/evaluation-template-seed.service.ts`](file:///d:/02.Code/GVCN/src/core/services/evaluation-template-seed.service.ts), [`src/core/services/evaluation-validation.service.ts`](file:///d:/02.Code/GVCN/src/core/services/evaluation-validation.service.ts), [`src/core/services/evaluation-suggestion.service.ts`](file:///d:/02.Code/GVCN/src/core/services/evaluation-suggestion.service.ts), [`src/core/services/evaluation-export.service.ts`](file:///d:/02.Code/GVCN/src/core/services/evaluation-export.service.ts), [`src/modules/evaluations/EvaluationsPage.tsx`](file:///d:/02.Code/GVCN/src/modules/evaluations/EvaluationsPage.tsx).
* **Last verified**: `2026-08-17`.

---

### FEAT-CONT-001 — Sổ Nhật Ký Liên Hệ Phụ Huynh Chuyên Biệt
* **Status**: `PLANNED_ONLY`
* **Test status**: `NO_TEST_FOUND`
* **Business goal**: Màn hình danh bạ và nhật ký liên hệ phụ huynh chuyên biệt cho toàn bộ các lớp.
* **Entry points**: Route `/parent-contacts`.
* **Source evidence**: [`src/modules/parent-contacts/ParentContactsPage.tsx`](file:///d:/02.Code/GVCN/src/modules/parent-contacts/ParentContactsPage.tsx), [`src/core/repositories/parent-contact.repository.ts`](file:///d:/02.Code/GVCN/src/core/repositories/parent-contact.repository.ts).
* **Known gaps**: Hiện tại nghiệp vụ liên hệ phụ huynh đã được tích hợp đầy đủ trong từng học sinh tại `StudentDetailPage.tsx` (Tab Liên hệ phụ huynh + Modal Ghi nhật ký). Màn hình `/parent-contacts` là route độc lập chưa được dựng bảng dữ liệu toàn trường.
* **Last verified**: `2026-08-17`.

---

## 6. API and Integration Inventory

Do ứng dụng hoạt động 100% Offline-First, hệ thống sử dụng các Browser Web APIs và Internal Contract thay cho REST API mạng:

| Tên Giao thức / API | Loại | Mục đích & Chi tiết triển khai | Feature ID liên quan |
| :--- | :--- | :--- | :--- |
| **IndexedDB API (Dexie.js v4)** | Client Storage | Lưu trữ toàn bộ 30 bảng thực thể, xử lý truy vấn bất đồng bộ, transactions `rw` an toàn rollback | Toàn bộ Features |
| **BroadcastChannel API** | Internal IPC | Kênh `so_chu_nhiem_live_broadcast` đồng bộ sự kiện giữa Màn hình điều khiển và Màn hình trình chiếu học sinh thời gian thực | `FEAT-LIVE-006` |
| **Web Storage / Persistent Storage API** | Storage Management | `navigator.storage.estimate()` đo dung lượng; `navigator.storage.persist()` xin quyền bảo vệ dữ liệu chống xóa | `FEAT-PRIV-001`, `FEAT-PRIV-002` |
| **Web Crypto API (SubtleCrypto)** | Cryptography | Tạo khóa PBKDF2 SHA-256 và mã hóa/giải mã AES-GCM file `.gvcn-backup`; Safe UUID v4 generator | `FEAT-BCKP-001`, `FEAT-BCKP-002`, `FEAT-STUD-001` |
| **Web Audio API** | Audio Synthesizer | Bộ phát âm thanh tự tạo (không cần file âm thanh ngoài) cho tiếng chuông, tiếng pháo hoa, bốc thăm ngẫu nhiên | `FEAT-LIVE-003`, `FEAT-RANK-004`, `FEAT-HNBD-003` |
| **Fullscreen API** | Presentation | `document.documentElement.requestFullscreen()` phục vụ chế độ Trình chiếu Fullscreen in-place và Presentation mode | `FEAT-LIVE-002`, `FEAT-REPO-006`, `FEAT-HNBD-003` |
| **Service Worker / Workbox PWA** | PWA Runtime | Precache 93 entries gồm bundle JS, CSS, SVG avatars, icons; chạy offline 100% không cần mạng | Toàn bộ Features |

---

## 7. Data Model and State Inventory

Hệ thống quản lý **32 bảng thực thể IndexedDB** trong cơ sở dữ liệu `SoChuNhiemVietOfflineDB` (Schema v1 $\rightarrow$ v8):

| Tên Bảng (Dexie Table) | Khóa chính & Chỉ mục (Indexes) | Soft Delete | Mô tả Thực thể | Feature ID chính |
| :--- | :--- | :---: | :--- | :--- |
| `teacherProfiles` | `id, phone` | Có | Hồ sơ giáo viên chủ nhiệm | `FEAT-ONBD-001` |
| `academicYears` | `id, name, isActive` | Có | Năm học | `FEAT-AYER-001` |
| `terms` | `id, academicYearId, isActive, [academicYearId+isActive]` | Có | Học kỳ (HK1, HK2, Cả năm) | `FEAT-AYER-001` |
| `classes` | `id, academicYearId, name, status, deletedAt, [academicYearId+deletedAt]` | Có | Lớp học chủ nhiệm | `FEAT-CLAS-001` |
| `students` | `id, studentCode, normalizedName, deletedAt` | Có | Học sinh (kèm `avatarKey`) | `FEAT-STUD-001`, `FEAT-STUD-002` |
| `classEnrollments` | `id, classId, studentId, &[classId+studentId], status` | Có | Phân lớp học sinh & STT | `FEAT-STUD-004` |
| `parentContacts` | `id, studentId, isPrimary` | Có | Thông tin liên hệ phụ huynh | `FEAT-STUD-005` |
| `attendanceSessions` | `id, classId, termId, sessionDate, &[classId+sessionDate]` | Có | Phiên điểm danh theo ngày | `FEAT-ATTD-001` |
| `attendanceRecords` | `id, sessionId, studentId, status, &[sessionId+studentId]` | Có | Bản ghi chuyên cần học sinh | `FEAT-ATTD-001` |
| `pointCategories` | `id, name, type` | Có | Danh mục tiêu chí thi đua | `FEAT-COND-001` |
| `pointEntries` | `id, classId, studentId, categoryId, sourceId, occurredAt, [classId+occurredAt], [studentId+occurredAt]` | Có | Nhật ký điểm thi đua | `FEAT-COND-002`, `FEAT-RANK-002` |
| `studentNotes` | `id, classId, studentId, termId` | Có | Ghi chú sư phạm có ghim | `FEAT-STUD-005` |
| `evaluations` | `id, classId, studentId, academicYearId, termId, periodCode, regulationCode, status, deletedAt, &[classId+studentId+academicYearId+periodCode]` | Có | Đánh giá nhận xét học kỳ theo TT27/TT22 | `FEAT-EVAL-001` |
| `evaluationItems` | `id, evaluationId, domain, criterionCode, subjectCode, deletedAt, &[evaluationId+domain+criterionCode]` | Có | Chi tiết tiêu chí môn học/phẩm chất/năng lực | `FEAT-EVAL-001` |
| `evaluationCommentTemplates` | `id, catalogVersion, regulationCode, domain, criterionCode, levelCode, origin, isFavorite, isActive, deletedAt` | Có | Thư viện mẫu nhận xét hệ thống & cá nhân | `FEAT-EVAL-001` |
| `parentInteractions` | `id, classId, studentId, interactionDate` | Có | Nhật ký liên lạc phụ huynh | `FEAT-STUD-005` |
| `rewards` | `id, classId, studentId, termId, date` | Có | Khen thưởng các cấp | `FEAT-STUD-005` |
| `settings` | `id` | Không | Cấu hình theme, active class/year, avatar mặc định | `FEAT-SETT-001`, `FEAT-SETT-002` |
| `auditLogs` | `id, entityName, recordId, timestamp` | Không | Nhật ký kiểm soát hệ thống | `FEAT-AUDT-001` |
| `backupHistory` | `id, createdAt` | Không | Lịch sử sao lưu DB | `FEAT-BCKP-001` |
| `liveClassSessions` | `id, classId, sessionDate, status` | Không | Phiên lớp học trực tuyến | `FEAT-LIVE-001` |
| `liveClassParticipants` | `id, sessionId, studentId, &[sessionId+studentId], attendanceStatus` | Không | Học sinh trong phiên live | `FEAT-LIVE-002` |
| `liveClassGroups` | `id, sessionId` | Không | Nhóm học tập trong phiên live | `FEAT-LIVE-005` |
| `liveClassGroupMembers` | `id, groupId, studentId, &[groupId+studentId]` | Không | Thành viên nhóm học tập | `FEAT-LIVE-005` |
| `liveClassEvents` | `id, sessionId, eventType, createdAt` | Không | Dòng sự kiện thời gian thực | `FEAT-LIVE-006` |
| `rankSystems` | `id, academicYearId, isActive, [academicYearId+isActive]` | Có | Cấu hình hệ thống cấp bậc | `FEAT-RANK-001` |
| `rankSystemClasses` | `id, rankSystemId, classId, &[rankSystemId+classId]` | Không | Liên kết lớp và hệ thống cấp bậc | `FEAT-RANK-001` |
| `rankLevels` | `id, rankSystemId, level, code, &[rankSystemId+level], &[rankSystemId+code]` | Có | Định nghĩa 17 cấp bậc quân hàm | `FEAT-RANK-001` |
| `studentRankHistory` | `id, rankSystemId, classId, studentId, createdAt, [studentId+createdAt]` | Không | Lịch sử thăng/giáng cấp bậc | `FEAT-RANK-004` |
| `honorTitles` | `id, code, calculationType, isActive, sortOrder, createdAt, deletedAt` | Có | Danh mục danh hiệu Bảng vàng | `FEAT-HNBD-002` |
| `honorBoards` | `id, classId, academicYearId, termId, status, startDate, endDate, periodType, createdAt, deletedAt, [classId+startDate+endDate]` | Có | Bảng vàng vinh danh theo kỳ | `FEAT-HNBD-001` |
| `honorRecipients` | `id, boardId, titleId, studentId, isApproved, &[boardId+titleId+studentId], createdAt` | Không | Học sinh nhận danh hiệu Bảng vàng | `FEAT-HNBD-002` |

---

## 8. Automation and Background Processing

| Tác vụ Tự động / Nền | Cơ chế kích hoạt | Hành vi thực thi | Xử lý lỗi / Fallback | Feature ID liên quan |
| :--- | :--- | :--- | :--- | :--- |
| **PWA Service Worker Precache** | Trình duyệt nạp trang đầu | Precache toàn bộ 93 tài nguyên tĩnh (HTML, CSS, JS bundles, 31 SVG avatars) | Tự động fallback nạp từ cache khi mất mạng Internet | Toàn bộ Features |
| **Kiểm tra Nhắc nhở Sao lưu** | Khi tải Header & Privacy Page | So sánh `new Date()` với `backupHistory[0].createdAt` $\ge 7$ ngày | Hiển thị Banner cảnh báo màu vàng kèm nút "Sao lưu ngay" | `FEAT-BCKP-003` |
| **Đồng bộ BroadcastChannel 2 chiều** | Sự kiện điểm danh/chấm điểm/bốc thăm | Gửi message qua `BroadcastChannel` cho màn hình Presentation | Bắt ngoại lệ nếu trình duyệt không hỗ trợ `BroadcastChannel` | `FEAT-LIVE-006` |
| **Tính toán Cấp bậc Tự động** | Sau mỗi lần ghi/sửa/xóa `pointEntries` | Gọi `RankCalculationService.recalculateStudentRank` trong Transaction | Rollback Transaction nếu lỗi, giữ nguyên cấp bậc cũ | `FEAT-RANK-002` |
| **Tự động Seed Dữ liệu Chuẩn** | Khởi tạo lần đầu hoặc tạo năm học mới | Nạp 17 Cấp bậc Quân hàm, 7 Danh hiệu Bảng vàng, Danh mục điểm thi đua mẫu | Bỏ qua nếu đã tồn tại bản ghi | `FEAT-ONBD-001`, `FEAT-RANK-001` |

---

## 9. Feature Flags and Configuration

| Tên Cấu hình / Setting Key | Vị trí Lưu trữ | Giá trị Mặc định | Tác động Hành vi Hệ thống |
| :--- | :--- | :--- | :--- |
| `theme` | `settings` Table / `localStorage` | `'traditional'` | Chuyển đổi CSS Theme Variables (`traditional`, `lotus`, `modern`, `military`, `ethnic`, `regions`) |
| `activeAcademicYearId` | `settings` Table | ID năm học đầu tiên | Lọc toàn bộ dữ liệu lớp học, điểm danh, thi đua theo năm học này |
| `activeClassId` | `settings` Table | ID lớp đầu tiên | Mặc định chọn lớp này khi mở Dashboard, Điểm danh, Thi đua, Báo cáo |
| `defaultStudentAvatarKey` | `settings` Table | `'default/default-student'` | Áp dụng avatar mặc định cho tất cả học sinh chưa có avatar riêng |
| `online-classroom-density` | `localStorage` | `'auto'` | Mật độ lưới thẻ học sinh trong lớp học trực tuyến (`auto`, `large`, `medium`, `compact`) |
| `ui-scale-mode` | `localStorage` | `'standard'` | Chế độ co giãn kích thước UI (`standard`, `presentation`) |

---

## 10. Cross-Cutting Behavior

1. **Kiến trúc Offline-First Tuyệt Đối**: Toàn bộ dữ liệu nằm trong IndexedDB của trình duyệt. Không có phụ thuộc API máy chủ ngoài.
2. **Safe UUID Generator (RFC4122 v4)**: [`src/shared/utilities/uuid.ts`](file:///d:/02.Code/GVCN/src/shared/utilities/uuid.ts) cung cấp cơ chế tạo UUID an toàn đa tầng (`crypto.randomUUID` $\rightarrow$ `crypto.getRandomValues` $\rightarrow$ timestamp + math random) loại bỏ hoàn toàn lỗi crash trên môi trường HTTP / Mạng LAN IP.
3. **Tìm Kiếm Tiếng Việt Không Dấu**: [`src/shared/utilities/normalize.ts`](file:///d:/02.Code/GVCN/src/shared/utilities/normalize.ts) chuyển đổi toàn bộ chuỗi tiếng Việt có dấu thành không dấu chữ thường (bỏ dấu thanh, ký tự đ/Đ) cho phép giáo viên gõ nhanh không cần bật bộ gõ tiếng Việt.
4. **Fluid Clamping Responsive System**: Sử dụng CSS `clamp()` kết hợp CSS Container Queries cho toàn bộ font size, khoảng cách, kích thước avatar, giúp giao diện tự động thích ứng hoàn hảo từ màn hình điện thoại 390px đến màn hình máy chiếu/TV 4K 3840px.
5. **Ghi Vết Kiểm Soát Toàn Cục (Audit Logging)**: Tự động ghi nhận mọi thao tác thay đổi dữ liệu vào bảng `auditLogs`.
6. **Xử Lý Lỗi Toàn Cục (Error Boundary & Toast)**: Bọc toàn bộ ứng dụng bằng `<ErrorBoundary />` và hệ thống thông báo `<ToastContext />`.

---

## 11. Test Coverage and Traceability

| Feature ID | Unit Tests | Integration Tests | E2E Tests | Trạng thái Nghiệm thu |
| :--- | :---: | :---: | :---: | :---: |
| `FEAT-ONBD-001` / `002` | `useOnboardingCheck.ts` | `DashboardPage.test.tsx` | Playwright Config sẵn sàng | `TESTED` (Pass) |
| `FEAT-DASH-001` $\rightarrow$ `004` | `dashboard-overview.service.test.ts` | `DashboardPage.test.tsx` | Manual test passed | `TESTED` (Pass) |
| `FEAT-AYER-001`, `CLAS-001` $\rightarrow$ `003` | `academic-year.service.test.ts` | `db.test.ts` | Manual test passed | `TESTED` (Pass) |
| `FEAT-STUD-001` $\rightarrow$ `005` | `student.service.test.ts`, `uuid.test.ts`, `StudentAvatar.test.tsx`, `AvatarPickerModal.test.tsx` | `student-profile.service.test.ts` | Manual test passed | `TESTED` (Pass) |
| `FEAT-ATTD-001` $\rightarrow$ `003` | `attendance.service.test.ts` | `db.test.ts` | Manual test passed | `TESTED` (Pass) |
| `FEAT-COND-001` $\rightarrow$ `003` | `conduct.service.test.ts` | `db.test.ts` | Manual test passed | `TESTED` (Pass) |
| `FEAT-RANK-001` $\rightarrow$ `005` | `rank-calculation.service.test.ts`, `rank-seed.service.test.ts`, `emulation-rank.service.test.ts` | `rank-integration.service.test.ts`, `rank-system.regression.test.ts`, `rank-performance.test.ts`, `ConductRanksPage.test.tsx` | Manual test passed | `TESTED` (Pass) |
| `FEAT-HNBD-001` $\rightarrow$ `004` | `honor-board.service.test.ts` | `rank-integration.service.test.ts` | Manual test passed | `TESTED` (Pass) |
| `FEAT-LIVE-001` $\rightarrow$ `008` | `live-classroom.test.ts` (10 tests), `useUiScale.test.ts` | `live-session.service.ts` | Manual test passed | `TESTED` (Pass) |
| `FEAT-REPO-001` $\rightarrow$ `008` | `report.service.test.ts`, `report-aggregation.service.test.ts` | `rank-overview-analytics.service.test.ts` | Manual test passed | `TESTED` (Pass) |
| `FEAT-EXCL-001` / `002` | `excel.service.test.ts` (6 tests) | `excel-import.service.ts` | Manual test passed | `TESTED` (Pass) |
| `FEAT-BCKP-001` $\rightarrow$ `003` | `backup.service.test.ts` (7 tests) | `crypto.ts` | Manual test passed | `TESTED` (Pass) |
| `FEAT-TRSH-001` / `002`, `AUDT-001` / `002` | `trash-audit.service.test.ts` (4 tests) | `db.test.ts` | Manual test passed | `TESTED` (Pass) |
| `FEAT-PRIV-001` $\rightarrow$ `003` | `db.test.ts` (6 tests) | `storage-health.service.ts` | Manual test passed | `TESTED` (Pass) |
| `FEAT-SETT-001` $\rightarrow$ `003` | `theme.service.test.ts` (3 tests), `avatar-catalog.service.test.ts` (4 tests) | `settings.repository.ts` | Manual test passed | `TESTED` (Pass) |
| `FEAT-EVAL-001`, `FEAT-CONT-001` | Chưa có test cho placeholder UI | `evaluation.repository.ts` | N/A | `NO_TEST_FOUND` |

---

## 12. Known Gaps, Contradictions and Technical Debt

1. **Module Đang ở dạng Placeholder (`PLANNED_ONLY`)**:
   - `FEAT-EVAL-001` (`EvaluationsPage.tsx`): Giao diện chỉ có Card tĩnh, chưa liên kết form nhập nhận xét học kỳ theo tiêu chí Thông tư 27/22.
   - `FEAT-CONT-001` (`ParentContactsPage.tsx`): Giao diện chỉ có Card tĩnh. Nghiệp vụ liên lạc phụ huynh thực tế đang chạy ổn định trong Tab của `StudentDetailPage.tsx`.
   - `FEAT-AYER-001` (`AcademicYearsPage.tsx`): Giao diện chỉ có Card tĩnh. Việc đổi năm học đang chạy qua `SettingsPage.tsx` và Header.
2. **Cơ Chế Phục Hồi Dữ Liệu Sau Khi Xóa Lịch Sử Trình Duyệt**:
   - Dữ liệu IndexedDB có thể bị trình duyệt xóa nếu người dùng chọn "Xóa toàn bộ dữ liệu duyệt web & Cookie". Cần duy trì banner cảnh báo nhắc nhở giáo viên sao lưu file `.gvcn-backup` định kỳ.
3. **Mâu Thuẫn Tài Liệu Cũ**:
   - Một số tài liệu markdown ban đầu trong thư mục `docs/` mô tả kế hoạch phát triển ban đầu (chưa cập nhật hệ thống 17 cấp bậc quân hàm, 31 avatar SVG và fluid clamping responsive). Bản tài liệu `docs/PROJECT_FEATURES.md` này là **Nguồn Chân Lý Duy Nhất (Single Source of Truth)** hiện tại của toàn bộ dự án.

---

## 13. Unmapped Inventory

Toàn bộ các routes, handlers, services, repositories và tables trong mã nguồn đã được ánh xạ 100% vào các Feature IDs từ `FEAT-ONBD-001` đến `FEAT-CONT-001`.

| Đối tượng | Trạng thái Ánh Xạ | Feature ID tương ứng | Ghi chú |
| :--- | :---: | :--- | :--- |
| Tất cả 37 UI Routes trong `src/app/routes.tsx` | ĐÃ ÁNH XẠ | Xem bảng mục 4 | Không còn route mồ côi |
| Tất cả 32 Dexie Tables trong `src/core/database/db.ts` | ĐÃ ÁNH XẠ | Xem bảng mục 7 | Toàn bộ schema đã có service/repo |
| Tất cả 36 Test Files trong `src/` | ĐÃ ÁNH XẠ | Xem bảng mục 11 | 183/183 tests passed |

---

## 14. Guidance for Future Tasks

Các Kỹ sư phần mềm và Autonomous AI Agents khi tiếp nhận phát triển tính năng mới **BẮT BUỘC** tuân thủ các quy tắc sau:

1. **Trước khi thực hiện Task**:
   - Đọc kỹ `docs/PROJECT_FEATURES.md` để nắm rõ cấu trúc dữ liệu, các service hiện có và các Feature IDs liên quan.
   - Không tạo trùng lặp service hoặc database table mới nếu bảng hiện tại đã có.
2. **Trong quá trình thực hiện Task**:
   - **Tuyệt đối không lưu URL có build hash** vào IndexedDB (dùng logic key như `avatarKey`).
   - Sử dụng `generateUUID()` từ `src/shared/utilities/uuid.ts` thay cho `crypto.randomUUID()`.
   - Luôn sử dụng Dexie Transaction khi thực hiện ghi đồng thời trên nhiều bảng.
   - Khi chỉnh sửa dữ liệu có liên quan đến thi đua, luôn gọi `RankCalculationService` để tính toán cấp bậc.
3. **Sau khi hoàn thành Task**:
   - Chạy `npm test` và `npm run build` để đảm bảo 0 lỗi TypeScript và test pass 100%.
   - Cập nhật tài liệu này (`docs/PROJECT_FEATURES.md`), cấp Feature ID tiếp theo theo đúng định dạng `FEAT-<MODULE>-NNN` (không tái sử dụng ID cũ) và thêm dòng vào mục Changelog bên dưới.

---

## 15. Changelog

| Ngày (Date) | Task / Mô tả | Feature IDs tác động | Tóm tắt thay đổi | Người / Agent xác nhận |
| :--- | :--- | :--- | :--- | :--- |
| **2026-08-17** | **Triển khai Sổ Nhận Xét & Đánh Giá Học Sinh TT27/2020 và TT22/2021** | `FEAT-EVAL-001` | Nâng cấp Dexie v8 (+2 bảng: `evaluationItems`, `evaluationCommentTemplates`), xây dựng Profile Service, Validation Service, Suggestion Engine, Autosave, Drawer Thư viện mẫu + Token Composer, Modal Rà soát lỗi & Cảnh báo từ ngữ, Khóa/Mở khóa sổ kèm Audit log, Xuất Excel & In A4, 36 test files (183 tests pass 100%) | Senior Full-Stack Product Engineer |
| **2026-08-17** | **Khởi tạo Bản đồ Tính năng Chuẩn Hóa Toàn Diện** | Toàn bộ `FEAT-ONBD-001` $\rightarrow$ `FEAT-CONT-001` | Khảo sát 100% codebase, kiểm kê 63 tính năng, 30 bảng DB, 31 test files (164 tests), thiết lập tài liệu chuẩn nguồn chân lý duy nhất | Senior Product Engineer & Software Architect |
