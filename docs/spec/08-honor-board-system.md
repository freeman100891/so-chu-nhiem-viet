# ĐẶC TẢ CHI TIẾT: BẢNG VÀNG DANH HIỆU (F-044 -> F-050)
> Mã tài liệu: `SPEC-08-HONOR-BOARD`  
> Phân hệ: 8 Danh Hiệu Sư Phạm, Rule Engine, Giải Quyết Hòa Điểm & Trình Chiếu  

---

## F-044 & F-045 — 8 Danh Hiệu Sư Phạm Chuẩn & Wizard Tạo Bảng Vàng

### 1. Mục đích
Tạo Bảng Vàng định kỳ (Tuần, Tháng, Học kỳ, Năm học) để vinh danh các cá nhân tiêu biểu trong tiết sinh hoạt lớp cuối tuần hoặc lễ sơ kết, tổng kết.

### 2. Danh Mục 8 Danh Hiệu Chuẩn Hóa

| STT | Mã Code | Tên Danh Hiệu | Loại Tính Toán | Chỉ Tiêu | Mô Tả Sư Phạm |
| :---: | :--- | :--- | :--- | :---: | :--- |
| **1** | `top_rank` | **Dẫn đầu cấp bậc** | Tự động | Tối đa 3 HS | Đạt cấp bậc và tổng điểm thi đua cao nhất lớp trong kỳ xét |
| **2** | `rank_progress` | **Thăng cấp ấn tượng**| Tự động | Tối đa 3 HS | Thăng nhiều cấp bậc quân hàm nhất trong kỳ |
| **3** | `point_growth` | **Ngôi sao bứt phá** | Tự động | Tối đa 3 HS | Điểm thi đua ròng tăng trưởng nhiều nhất trong kỳ |
| **4** | `attendance` | **Ngôi sao chuyên cần**| Tự động | Tối đa 5 HS | Tỷ lệ đi học chuyên cần và đúng giờ xuất sắc ($100\%$) |
| **5** | `participation`| **Tích cực phát biểu** | Tự động | Tối đa 3 HS | Có nhiều lượt phát biểu, tương tác sôi nổi trong lớp |
| **6** | `manual_teammate`|**Đồng đội tuyệt vời** | Đề cử GV | Tối đa 3 HS | Tinh thần giúp đỡ bạn bè, đoàn kết tập thể |
| **7** | `manual_persistence`|**Nỗ lực bền bỉ** | Đề cử GV | Tối đa 3 HS | Kiên trì khắc phục khó khăn, rèn luyện nề nếp mỗi ngày |
| **8** | `self_progress`| **Gương mặt tiến bộ** | Tự động | Tối đa 3 HS | Tiến bộ vượt bậc so với kết quả của chính mình kỳ trước |

### 3. Wizard 4 Bước Tạo Bảng Vàng (`HonorBoardCreateWizard.tsx`)
- **Bước 1: Kỳ xét & Lớp học**: Chọn Lớp, Loại chu kỳ (Tuần, Tháng, Học kỳ), Ngày bắt đầu - Ngày kết thúc.
- **Bước 2: Chọn danh hiệu**: Bật/tắt 8 danh hiệu phù hợp với kế hoạch thi đua của lớp.
- **Bước 3: Duyệt ứng viên**: Rule Engine tính toán tự động danh sách đề xuất; Giáo viên có thể duyệt, loại bớt hoặc bổ sung học sinh.
- **Bước 4: Hoàn tất & Công bố**: Xem trước giao diện Bảng Vàng và bấm "Công bố (Publish)" hoặc "Lưu bản nháp (Save Draft)".

---

## F-046 & F-047 — Rule Engine Tự Động & Modal Xử Lý Hòa Điểm (TieResolutionModal)

### 1. Thuật Toán Rule Engine (`honor-rule-engine.service.ts`)
- Quét toàn bộ dữ liệu điểm danh (`attendanceRecords`) và điểm thi đua (`pointEntries`) trong khoảng thời gian `[startDate, endDate]`.
- Phân tích và xếp hạng học sinh theo từng thuật toán chuyên biệt tương ứng với mỗi `calculationType`.

### 2. Xử Lý Trường Hợp Hòa Điểm (Tie Resolution)
Khi có nhiều hơn `maxRecipients` học sinh có cùng điểm số hoặc cùng thành tích ngang nhau:
- Hệ thống đánh dấu `hasTie: true` và bật `TieResolutionModal`.
- Giáo viên có 3 lựa chọn linh hoạt theo tình huống sư phạm thực tế:
  1. **Chấp nhận tất cả (Accept All)**: Cho phép vượt chỉ tiêu để khích lệ tinh thần đồng đều của các em.
  2. **Tăng chỉ tiêu danh hiệu (Increase Limit)**: Tăng số lượng chỉ tiêu của danh hiệu này lên tương ứng.
  3. **Chọn thủ công (Select Manual)**: Giáo viên tự tay tích chọn những học sinh xứng đáng nhất dựa trên các tiêu chí phụ (như thái độ, đạo đức).

---

## F-049 — Trình Chiếu Bảng Vàng Toàn Màn Hình (`HonorBoardPresentPage.tsx`)

### 1. Trải Nghiệm Màn Hình Lớn
- Giao diện Fullscreen 16:9 với hiệu ứng ánh hào quang và pháo hoa nhẹ nhàng.
- Bục vinh danh Top 1, Top 2, Top 3 và lưới danh hiệu từng hạng mục.
- Tích hợp phát âm thanh vinh danh chúc mừng khi chuyển trang trình chiếu.

---

## 🎨 Đồng Bộ Hệ Thống 5 Cấp Bậc Avatar với Cài Đặt (Avatar System Synchronization)
Toàn bộ các thành phần trong Phân hệ Bảng Vàng Danh Hiệu đều được đồng bộ chặt chẽ với Hệ thống Avatar 5 Cấp độ cấu hình tại Cài đặt (`/settings`):
- **Bục Vinh Danh Top Rank Podium** (`TopRankPodium.tsx`): Hiển thị Avatar tiến hóa theo điểm số thực tế của Quán quân, Á quân 1, Á quân 2 trên cả Desktop và Mobile.
- **Thẻ Danh Hiệu** (`HonorTitleCard.tsx`): Render `StudentAvatar` đồng bộ với theme toàn cục (Quân đội, Hoàng gia, Game thủ, Vũ trụ, Hoa sen...) và ảnh tải lên tùy chỉnh của từng cấp.
- **Trình Chiếu 16:9** (`HonorBoardPresentPage.tsx`): Hiển thị Avatar kích thước lớn độ nét cao với vòng sáng hào quang tương ứng cấp bậc của học sinh.
- **Wizard Tạo Bảng Vàng & Modal Xử Lý Đồng Hạng** (`HonorBoardCreateWizard.tsx`, `TieResolutionModal.tsx`): Tích hợp Avatar học sinh mini trực quan giúp giáo viên nhận diện học sinh dễ dàng.
- **Widget Bảng Vàng Dashboard** (`DashboardHonorBoardWidget.tsx`): Hiển thị Avatar học sinh tiêu biểu đạt giải trong tuần.

