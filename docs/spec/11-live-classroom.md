# ĐẶC TẢ CHI TIẾT: ĐIỀU HÀNH LỚP HỌC TRỰC TUYẾN (F-062 -> F-073)
> Mã tài liệu: `SPEC-11-LIVE-CLASSROOM`  
> Phân hệ: Lớp Học Trực Tuyến Thời Gian Thực, Hộp Công Cụ Sư Phạm & Đồng Bộ Đa Màn Hình  

---

## F-062 & F-063 — Phiên Lớp Học Trực Tuyến & Lưới Thẻ Học Sinh Fluid Clamping

### 1. Mục đích
Tạo môi trường quản trị và tương tác lớp học sống động trong các tiết sinh hoạt lớp, tiết học bộ môn hoặc tiết hoạt động trải nghiệm, trình chiếu trực tiếp lên tivi hoặc máy chiếu.

### 2. Vị trí & Route
- Khởi tạo: `/live-classroom/new` (`CreateLiveSessionPage.tsx`)
- Phiên đang chạy: `/live-classroom/:sessionId` (`LiveClassroomActivePage.tsx`)
- Trình chiếu máy chiếu: `/live-classroom/:sessionId/present` (`LiveClassroomPresentPage.tsx`)
- Lịch sử: `/live-classroom/history` (`LiveClassroomHistoryPage.tsx`)

### 3. Lưới Thẻ Học Sinh Co Giãn Linh Hoạt (Fluid Clamping Responsive)
- Thiết kế đặc biệt bằng CSS Grid tự động co giãn (`minmax(clamp(...))`), tự động căn chỉnh số cột từ 4 cột (màn hình nhỏ) đến 8–10 cột (màn hình 4K) để luôn nhìn rõ toàn bộ 35–50 học sinh trong 1 màn hình mà không cần cuộn trang.
- Mỗi thẻ hiển thị: Avatar tiến hóa 5 cấp, Họ tên học sinh, Huy hiệu quân hàm, Điểm thi đua hiện tại, Trạng thái điểm danh (Có mặt / Vắng) và Trạng thái tương tác (Đang giơ tay, Đã gọi).

---

## F-064 -> F-069 — Hộp Công Cụ Sư Phạm Nổi (FloatingClassroomToolbox)

Hộp công cụ nổi (`FloatingClassroomToolbox.tsx`) neo ở cạnh phải màn hình với các tiện ích:

### 1. Bốc Thăm Ngẫu Nhiên (Random Picker — `RandomPickerTool.tsx`)
- Quay số học sinh ngẫu nhiên với hiệu ứng vòng quay kịch tính và âm thanh hồi hộp (`tick sound`).
- Khi dừng lại: Hiển thị thẻ học sinh trúng giải lớn giữa màn hình kèm pháo hoa và âm thanh chúc mừng (`tada / victory`).
- Tùy chọn sư phạm: Tự động loại trừ học sinh đã được gọi trong tiết học để đảm bảo công bằng cơ hội cho mọi học sinh.

### 2. Hàng Đợi Giơ Tay Phát Biểu (Hand Raised Queue — `HandRaisedQueueTool.tsx`)
- Giáo viên có thể ghi nhận nhanh các học sinh xung phong phát biểu.
- Hiển thị thứ tự giơ tay $(1, 2, 3...)$ và cho phép gọi lần lượt kèm nút cộng điểm thưởng nhanh $+10$đ ngay trên hàng đợi.

### 3. Bầu Chọn & Khảo Sát Nhanh (Quick Poll — `QuickPollTool.tsx`)
- Tạo nhanh câu hỏi bình chọn (ví dụ: bầu ban cán sự, chọn bài hát sinh hoạt, khảo sát ý kiến).
- Học sinh biểu quyết $\rightarrow$ Giáo viên cập nhật số phiếu $\rightarrow$ Biểu đồ cột tự động hiển thị tỷ lệ % trực quan.

### 4. Bảng Trắng Tương Tác (Whiteboard — `WhiteboardTool.tsx`)
- Vẽ viết tự do trên màn hình cảm ứng / chuột: Bút viết, tẩy, chọn màu sắc, chèn hình khối, ghi chú bài giảng nhanh.

### 5. Màn Hình Giải Lao / Nghỉ Giữa Giờ (Break Screen — `BreakScreenTool.tsx`)
- Đồng hồ đếm ngược giờ giải lao (5 phút, 10 phút, 15 phút).
- Tự động phát nhạc không lời thư giãn và chuông báo khi hết giờ.

### 6. Trình Tạo Mã QR Động (QR Generator — `QrGeneratorTool.tsx`)
- Giáo viên dán link bài tập, tài liệu học tập hoặc form khảo sát $\rightarrow$ Hệ thống sinh mã QR sắc nét trên màn hình máy chiếu để học sinh/phụ huynh quét bằng điện thoại.

---

## F-070 -> F-073 — Chia Nhóm, Đồng Bộ 2 Màn Hình & Chốt Phiên Vào Sổ Chính

### 1. Chia Nhóm Học Tập Ngẫu Nhiên
- Giáo viên chọn số lượng nhóm (vd 4 nhóm, 6 nhóm) $\rightarrow$ Hệ thống thuật toán ngẫu nhiên phân chia học sinh đồng đều nam/nữ.
- Chấm điểm nhóm: Cộng/trừ điểm 1 lần sẽ áp dụng cho tất cả thành viên của nhóm đó.

### 2. Đồng Bộ 2 Màn Hình Không Dây (`BroadcastChannel API`)
- Không cần server trung gian, giáo viên mở tab Điều khiển trên laptop và tab Trình chiếu trên máy chiếu.
- Mọi thao tác (bốc thăm, chấm điểm, mở bảng trắng, bật pháo hoa) ở tab điều khiển sẽ phát sóng qua kênh `BroadcastChannel('live_classroom_channel')` và tab máy chiếu cập nhật ngay lập tức với độ trễ $<10$ms.

### 3. Đóng Phiên & Đồng Bộ Vào Sổ Chính (`SessionSummaryModal.tsx`)
- Khi kết thúc tiết học, giáo viên bấm "Kết thúc phiên học".
- Modal hiển thị bảng tổng kết: Tổng số lượt phát biểu, Top học sinh tích cực nhất, Danh sách điểm cộng/trừ trong phiên.
- Bấm "Lưu vào sổ chính": Hệ thống đồng bộ toàn bộ điểm vào `pointEntries` và cập nhật cấp bậc của học sinh.
