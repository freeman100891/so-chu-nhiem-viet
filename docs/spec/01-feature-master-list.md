# SỔ CHỦ NHIỆM VIỆT OFFLINE — DANH MỤC TOÀN BỘ TÍNH NĂNG (FEATURE MASTER LIST)
> Mã tài liệu: `SPEC-01-FEATURE-MASTER-LIST`  
> Phiên bản hệ thống: `1.0.0`  
> Tổng số tính năng đã ánh xạ: **83 tính năng**  

---

## Bảng Danh Mục Tính Năng Chi Tiết (Feature Inventory Matrix)

| Mã ID | Module | Tên Tính Năng | Route / Vị trí | Bảng Dữ Liệu (IndexedDB / Storage) | Trạng Thái | Độ Hoàn Thiện |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **F-001** | ONBD | Khởi tạo hồ sơ giáo viên ban đầu | `/onboarding` | `teacherProfiles`, `settings` | STABLE | 100% |
| **F-002** | ONBD | Thiết lập năm học & lớp học đầu tiên | `/onboarding` | `academicYears`, `classes`, `settings` | STABLE | 100% |
| **F-003** | ONBD | Kiểm tra trạng thái Onboarding & Redirect | Global Router (`AppLayout`) | `settings`, `teacherProfiles` | STABLE | 100% |
| **F-004** | ONBD | Cập nhật hồ sơ & ảnh đại diện giáo viên | `/settings` | `teacherProfiles`, `settings` | STABLE | 100% |
| **F-005** | ONBD | Tùy biến xưng hô sư phạm (Thầy/Cô) | `/settings` | `teacherProfiles`, `settings` | STABLE | 100% |
| **F-006** | DASH | Lời chào sư phạm & Avatar giáo viên | `/dashboard` | `teacherProfiles`, `settings` | STABLE | 100% |
| **F-007** | DASH | Thống kê nhanh KPI lớp học | `/dashboard` | `classes`, `students`, `attendanceRecords`, `pointEntries` | STABLE | 100% |
| **F-008** | DASH | Lối tắt thao tác nhanh 1 chạm | `/dashboard` | Router Navigation | STABLE | 100% |
| **F-009** | DASH | Danh sách gương mặt nổi bật & cần hỗ trợ | `/dashboard` | `pointEntries`, `students`, `rankLevels` | STABLE | 100% |
| **F-010** | DASH | Lịch công tác & ghi chú sư phạm | `/dashboard` | `settings`, `studentNotes` | STABLE | 100% |
| **F-011** | AYER | Quản lý danh sách năm học | `/academic-years` | `academicYears` | STABLE | 100% |
| **F-012** | AYER | Quản lý học kỳ & kích hoạt kỳ hiện tại | `/academic-years` | `terms`, `settings` | STABLE | 100% |
| **F-013** | AYER | Cảnh báo ngoài thời gian học kỳ | Toàn hệ thống (`TermDateWarningBanner`) | `terms`, `settings` | STABLE | 100% |
| **F-014** | CLAS | Quản lý danh sách lớp học theo khối | `/classes` | `classes` | STABLE | 100% |
| **F-015** | CLAS | Tạo mới & Chỉnh sửa thông tin lớp | `/classes` (Modal) | `classes`, `auditLogs` | STABLE | 100% |
| **F-016** | CLAS | Lưu trữ / Khóa lớp học (Archive Class) | `/classes` | `classes`, `auditLogs` | STABLE | 100% |
| **F-017** | CLAS | Chi tiết lớp học & danh sách học sinh | `/classes/:classId` | `classes`, `classEnrollments`, `students` | STABLE | 100% |
| **F-018** | CLAS | Chuyển lớp học sinh & lưu lịch sử | `/classes/:classId`, `/students` | `classEnrollments`, `auditLogs` | STABLE | 100% |
| **F-019** | STUD | Danh sách hồ sơ học sinh & bộ lọc | `/students` | `students`, `classEnrollments` | STABLE | 100% |
| **F-020** | STUD | Thêm mới & Chỉnh sửa hồ sơ học sinh | `/students` (Modal) | `students`, `classEnrollments`, `auditLogs` | STABLE | 100% |
| **F-021** | STUD | Chuẩn hóa tự động họ tên tiếng Việt | `normalize.ts` | `students.normalizedName` | STABLE | 100% |
| **F-022** | STUD | Bộ sưu tập 31+ Avatar Vector SVG | Modal Avatar Picker | `avatarAssets`, `avatarCatalog` | STABLE | 100% |
| **F-023** | STUD | Hệ thống 5 Cấp bậc Avatar Tiến hóa | Toàn hệ thống (`StudentAvatar`) | `avatarAssets`, `rankLevels`, `pointEntries` | STABLE | 100% |
| **F-024** | STUD | Đổi Avatar nhanh học sinh | `/students`, `/students/:id` | `students.avatarUrl`, `auditLogs` | STABLE | 100% |
| **F-025** | STUD | Chi tiết hồ sơ học sinh & Dòng thời gian | `/students/:studentId` | `students`, `pointEntries`, `parentInteractions` | STABLE | 100% |
| **F-026** | STUD | Danh bạ & liên lạc phụ huynh học sinh | `/parent-contacts`, `/students/:id` | `parentContacts`, `parentInteractions` | STABLE | 100% |
| **F-027** | STUD | Hàng đợi gọi điện & gửi tin nhắn Zalo/SMS | `/parent-contacts` | `parentContacts` | STABLE | 100% |
| **F-028** | ATTD | Điểm danh 1 chạm theo ngày | `/attendance` | `attendanceSessions`, `attendanceRecords` | STABLE | 100% |
| **F-029** | ATTD | Khóa sổ & Mở khóa sổ điểm danh | `/attendance` | `attendanceSessions.isLocked` | STABLE | 100% |
| **F-030** | ATTD | Thống kê & lịch sử chuyên cần lớp | `/attendance` (History Tab) | `attendanceRecords`, `attendanceSessions` | STABLE | 100% |
| **F-031** | COND | Sổ điểm thi đua nề nếp học sinh | `/conduct` | `pointEntries`, `pointCategories` | STABLE | 100% |
| **F-032** | COND | Quản lý danh mục tiêu chí Cộng/Trừ | `/conduct` (Tab Cấu hình) | `pointCategories` | STABLE | 100% |
| **F-033** | COND | Chấm điểm thi đua đơn lẻ & nhiều học sinh | `/conduct` (Modal) | `pointEntries`, `auditLogs` | STABLE | 100% |
| **F-034** | COND | Chấm điểm thi đua theo nhóm | `/conduct`, `/live-classroom/:id` | `pointEntries`, `liveClassGroups` | STABLE | 100% |
| **F-035** | COND | Cơ chế Hoàn tác điểm (Undo Entry) | `/conduct`, `/live-classroom/:id` | `pointEntries`, `auditLogs` | STABLE | 100% |
| **F-036** | COND | Lọc & Thống kê điểm theo khoảng ngày | `/conduct` | `pointEntries` | STABLE | 100% |
| **F-037** | RANK | Khởi tạo 17 cấp bậc quân hàm mặc định | `rank-seed.service.ts` | `rankSystems`, `rankLevels` | STABLE | 100% |
| **F-038** | RANK | Tính toán cấp bậc tự động (Achievement Mode)| `rank-calculation.service.ts` | `rankLevels`, `pointEntries` | STABLE | 100% |
| **F-039** | RANK | Huy hiệu cấp bậc quân hàm & Tooltip | Toàn hệ thống (`EmulationRankBadge`) | `rankLevels` | STABLE | 100% |
| **F-040** | RANK | Phát hiện thăng cấp & ghi nhận sự kiện | `rank-promotion.service.ts` | `rankPromotionEvents`, `studentRankHistory` | STABLE | 100% |
| **F-041** | RANK | Hàng đợi chúc mừng thăng cấp (Queue Bar) | `/live-classroom/:id` | `levelUpCelebrationEvents` | STABLE | 100% |
| **F-042** | RANK | Modal vinh danh thăng cấp có pháo hoa | `PromotionCelebrationModal.tsx` | Canvas Confetti, Web Audio | STABLE | 100% |
| **F-043** | RANK | Bảng theo dõi học sinh sát ngưỡng thăng cấp | `/conduct` (Tab Cấp bậc) | `rankLevels`, `pointEntries` | STABLE | 100% |
| **F-044** | HNBD | Khởi tạo & Dọn dẹp 8 danh hiệu chuẩn | `honor-title-seed.service.ts` | `honorTitles` | STABLE | 100% |
| **F-045** | HNBD | Wizard tạo bảng vàng danh hiệu | `/conduct/honor-board/new` | `honorBoards`, `honorTitles` | STABLE | 100% |
| **F-046** | HNBD | Rule Engine tự động tính toán ứng viên | `honor-rule-engine.service.ts` | `pointEntries`, `attendanceRecords` | STABLE | 100% |
| **F-047** | HNBD | Modal giải quyết hòa điểm (Tie Resolution) | `TieResolutionModal.tsx` | `honorRecipients` | STABLE | 100% |
| **F-048** | HNBD | Phê duyệt & Công bố bảng vàng | `/conduct/honor-board/:id` | `honorBoards`, `honorRecipients` | STABLE | 100% |
| **F-049** | HNBD | Trình chiếu bảng vàng toàn màn hình | `/conduct/honor-board/:id/present` | BroadcastChannel, Sound Engine | STABLE | 100% |
| **F-050** | HNBD | Lịch sử & lưu trữ bảng vàng theo kỳ | `/conduct/honor-board/history` | `honorBoards`, `honorRecipients` | STABLE | 100% |
| **F-051** | EVAL | Quản lý đợt đánh giá theo TT22 & TT27 | `/evaluations` | `evaluations`, `evaluationItems` | STABLE | 100% |
| **F-052** | EVAL | Khởi tạo mẫu đánh giá theo cấp học | `evaluation-template-seed.service.ts` | `evaluationCommentTemplates` | STABLE | 100% |
| **F-053** | EVAL | Nhận xét phẩm chất chủ yếu (5 phẩm chất) | `/evaluations` | `evaluations`, `evaluationItems` | STABLE | 100% |
| **F-054** | EVAL | Nhận xét năng lực cốt lõi (3 năng lực) | `/evaluations` | `evaluations`, `evaluationItems` | STABLE | 100% |
| **F-055** | EVAL | Ngân hàng gợi ý nhận xét sư phạm | `/evaluations` (Drawer) | `evaluationCommentTemplates` | STABLE | 100% |
| **F-056** | EVAL | Kiểm tra & cảnh báo dữ liệu đánh giá | `evaluation-validation.service.ts` | `evaluations` | STABLE | 100% |
| **F-057** | GIFT | Danh mục quà tặng & điểm đổi thưởng | `/gifts` | `gifts`, `giftImages` | STABLE | 100% |
| **F-058** | GIFT | Quản lý kho quà & lịch sử nhập/xuất | `/gifts` (Tab Quản lý kho) | `giftStockMovements`, `gifts` | STABLE | 100% |
| **F-059** | GIFT | Đổi quà học sinh & trừ điểm tự động | `/gifts` (Tab Đổi quà) | `giftRedemptions`, `giftRedemptionItems` | STABLE | 100% |
| **F-060** | GIFT | Biên nhận đổi quà học sinh | `/gifts` (Modal) | `giftRedemptions` | STABLE | 100% |
| **F-061** | GIFT | Trình chiếu cửa hàng quà tặng | `/gifts/presentation` | `gifts`, BroadcastChannel | STABLE | 100% |
| **F-062** | LIVE | Tạo và mở phiên lớp học trực tuyến | `/live-classroom/new` | `liveClassSessions`, `liveClassParticipants` | STABLE | 100% |
| **F-063** | LIVE | Lưới thẻ học sinh Fluid Clamping | `/live-classroom/:sessionId` | `liveClassParticipants`, `students` | STABLE | 100% |
| **F-064** | LIVE | Bốc thăm ngẫu nhiên (Random Picker) | `RandomPickerTool.tsx` | Web Audio, Canvas Confetti | STABLE | 100% |
| **F-065** | LIVE | Hàng đợi giơ tay phát biểu | `HandRaisedQueueTool.tsx` | `liveClassEvents` | STABLE | 100% |
| **F-066** | LIVE | Bầu chọn & Khảo sát nhanh (Quick Poll) | `QuickPollTool.tsx` | `liveClassEvents` | STABLE | 100% |
| **F-067** | LIVE | Bảng trắng tương tác sư phạm | `WhiteboardTool.tsx` | Canvas 2D Context | STABLE | 100% |
| **F-068** | LIVE | Màn hình giải lao / Nghỉ giữa giờ | `BreakScreenTool.tsx` | Timer, Music/Sound | STABLE | 100% |
| **F-069** | LIVE | Trình tạo mã QR động bài giảng | `QrGeneratorTool.tsx` | `qr-generator.ts` | STABLE | 100% |
| **F-070** | LIVE | Chia nhóm học tập & chấm điểm nhóm | `/live-classroom/:sessionId` | `liveClassGroups`, `liveClassGroupMembers` | STABLE | 100% |
| **F-071** | LIVE | Đồng bộ 2 màn hình qua BroadcastChannel| `/live-classroom/:sessionId/present`| `BroadcastChannel API` | STABLE | 100% |
| **F-072** | LIVE | Đóng phiên & đồng bộ điểm vào sổ chính | `SessionSummaryModal.tsx` | `pointEntries`, `liveClassSessions` | STABLE | 100% |
| **F-073** | LIVE | Lịch sử các phiên học trực tuyến | `/live-classroom/history` | `liveClassSessions` | STABLE | 100% |
| **F-074** | REPO | Báo cáo tổng quan KPI lớp chủ nhiệm | `/reports` | `reports`, `report-aggregation.service.ts` | STABLE | 100% |
| **F-075** | REPO | Báo cáo chuyên cần & nhiệt độ đi học | `/reports/attendance` | `attendanceRecords`, `attendanceSessions` | STABLE | 100% |
| **F-076** | REPO | Báo cáo phân bố điểm & cấp bậc thi đua | `/reports/points-ranks` | `pointEntries`, `rankLevels` | STABLE | 100% |
| **F-077** | REPO | Đối sánh số liệu giữa các lớp chủ nhiệm| `/reports/compare` | `class.repository`, `report.service` | STABLE | 100% |
| **F-078** | REPO | Phiếu nhận xét cá nhân học sinh in ấn A4| `/reports/student/:studentId` | `students`, `evaluations`, `pointEntries` | STABLE | 100% |
| **F-079** | REPO | Trình chiếu báo cáo tự động chuyển slide| `/reports/presentation` | Auto-Slide Engine, Fullscreen API | STABLE | 100% |
| **F-080** | EXCL | Import học sinh từ file Excel (.xlsx) | `/students` (Import Modal) | ExcelJS, `student.service.ts` | STABLE | 100% |
| **F-081** | EXCL | Export sổ điểm danh, thi đua ra Excel | Toàn hệ thống | ExcelJS, `excel.service.ts` | STABLE | 100% |
| **F-082** | BACK | Sao lưu mã hóa & Khôi phục DB (.gvcn) | `/backup` | Web Crypto API, IndexedDB Bulk | STABLE | 100% |
| **F-083** | ONBD | Khôi phục toàn bộ hệ thống từ file sao lưu tại Onboarding | `/onboarding` (Dual-Option Screen) | Toàn bộ 30 bảng IndexedDB | STABLE | 100% |

