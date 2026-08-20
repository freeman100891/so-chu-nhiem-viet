# ĐẶC TẢ CHI TIẾT: TRUNG TÂM BÁO CÁO & THỐNG KÊ (F-074 -> F-079)
> Mã tài liệu: `SPEC-12-REPORTS`  
> Phân hệ: Báo Cáo KPI, Biểu Đồ Thống Kê, So Sánh Đối Sánh & Hồ Sơ In Ấn A4  

---

## F-074 -> F-077 — Trung Tâm Báo Cáo Tổng Quan & Đối Sánh Lớp Học

### 1. Mục đích
Cung cấp bức tranh toàn cảnh và số liệu thống kê khoa học về mọi mặt hoạt động của lớp chủ nhiệm phục vụ họp phụ huynh, họp liên tịch và sơ kết chuyên môn.

### 2. Vị trí & Route
- Layout báo cáo: `/reports` (`ReportsLayoutPage.tsx`)
- Tổng quan KPI: `/reports` (`ReportsOverviewPage.tsx`)
- Báo cáo chuyên cần: `/reports/attendance` (`AttendanceReportPage.tsx`)
- Báo cáo điểm & cấp bậc: `/reports/points-ranks` (`PointsRanksReportPage.tsx`)
- Báo cáo thi đua bảng vàng: `/reports/honors` (`HonorsReportPage.tsx`)
- So sánh đối sánh các lớp: `/reports/compare` (`ClassComparisonPage.tsx`)
- Service: `src/core/services/report-aggregation.service.ts`, `src/core/services/report-comparison.service.ts`

### 3. Các Chỉ Số & Biểu Đồ Phân Tích Chuyên Sâu
1. **Chỉ số Sĩ số & Biến động**: Tổng số học sinh, nam/nữ, học sinh mới chuyển đến, học sinh chuyển đi.
2. **Nhiệt độ Chuyên cần**: Biểu đồ đường xu hướng chuyên cần theo tuần/tháng, tỷ lệ đi học đúng giờ ($98.5\%$).
3. **Phân bố Cấp bậc Quân hàm**: Biểu đồ cột phân nhóm 4 khối quân hàm (Hạ sĩ quan, Cấp Úy, Cấp Tá, Cấp Tướng).
4. **Cơ cấu Tiêu chí Thi đua**: Biểu đồ tròn thể hiện tỷ trọng các tiêu chí được cộng điểm nhiều nhất (Phát biểu $40\%$, Bài tập $30\%$, Giúp bạn $20\%$, Hoạt động $10\%$).
5. **So sánh Đối sánh Lớp học**: Bảng so sánh trực quan giữa các lớp chủ nhiệm của cùng 1 giáo viên về sĩ số, điểm trung bình thi đua và tỷ lệ chuyên cần.

---

## F-078 — Phiếu Nhận Xét & Hồ Sơ Cá Nhân Học Sinh Chuẩn In Ấn A4

### 1. Mục đích
Xuất phiếu thông tin và kết quả rèn luyện của từng học sinh để gửi cho phụ huynh hoặc lưu trữ vào học bạ.

### 2. Định Dạng In Ấn Chuẩn A4
- Route: `/reports/student/:studentId` (`StudentReportPage.tsx`)
- Sử dụng CSS Media Query `@media print` căn chỉnh chính xác lề trang in ($15\text{mm}$), ẩn toàn bộ thanh menu/nút bấm, chỉ giữ lại khung báo cáo trang trọng có tiêu ngữ Quốc hiệu, biểu trưng trường học, chữ ký giáo viên chủ nhiệm và chữ ký phụ huynh.
- Tích hợp biểu đồ Radar 5 phẩm chất - 3 năng lực và bảng thống kê chuyên cần, khen thưởng trong kỳ.

---

## F-079 — Chế Độ Trình Chiếu Báo Cáo Toàn Màn Hình (`ReportPresentationPage.tsx`)

- Dành cho các buổi **Họp Phụ Huynh Học Sinh Đầu Năm / Cuối Kỳ**.
- Tự động trình chiếu lần lượt các slide báo cáo (Tổng quan lớp $\rightarrow$ Kết quả thi đua $\rightarrow$ Vinh danh Bảng vàng $\rightarrow$ Kế hoạch kỳ tới) với thời gian chuyển slide tùy chỉnh (5s, 10s, 15s hoặc chuyển bằng phím mũi tên / Remote).
- Tích hợp chế độ bảo vệ quyền riêng tư: Ẩn điểm số nhạy cảm của các em học sinh cá biệt, chỉ tôn vinh sự tiến bộ của cả tập thể.
