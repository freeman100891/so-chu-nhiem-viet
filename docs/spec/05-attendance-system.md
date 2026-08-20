# ĐẶC TẢ CHI TIẾT: PHÂN HỆ ĐIỂM DANH HỌC SINH (F-028 -> F-030)
> Mã tài liệu: `SPEC-05-ATTENDANCE`  
> Phân hệ: Điểm danh chuyên cần, Khóa sổ bảo vệ & Thống kê  

---

## F-028 — Điểm Danh 1 Chạm Theo Ngày & 5 Trạng Thái

### 1. Mục đích
Cho phép giáo viên chủ nhiệm thực hiện điểm danh cả lớp chỉ trong vài giây đầu giờ học với 5 trạng thái chuyên cần chuẩn hóa.

### 2. Vị trí & Route
- Route: `/attendance`
- Component: `src/modules/attendance/AttendancePage.tsx`
- Service: `src/core/services/attendance.service.ts`
- Repository: `src/core/repositories/attendance.repository.ts`

### 3. Năm Trạng Thái Điểm Danh Chuẩn
1. **Có mặt (`Present`)**: Mặc định cho toàn bộ học sinh khi bắt đầu phiên. Màu xanh lá (`emerald-500`).
2. **Đi trễ (`Late`)**: Học sinh vào lớp sau giờ quy định. Màu cam (`amber-500`).
3. **Nghỉ có phép (`Excused`)**: Có đơn xin phép của phụ huynh. Màu xanh dương (`blue-500`).
4. **Nghỉ không phép (`Unexcused`)**: Vắng mặt không có lý do/báo trước. Màu đỏ (`rose-500`).
5. **Về sớm (`EarlyLeave`)**: Học sinh xin phép về sớm giữa buổi. Màu tím (`purple-500`).

### 4. Luồng thao tác
1. Giáo viên mở trang `/attendance`. Hệ thống tự động chọn lớp hiện tại và ngày hôm nay.
2. Tự động kiểm tra: Nếu ngày hôm nay chưa có phiên điểm danh (`AttendanceSession`), hệ thống tự động khởi tạo với tất cả học sinh ở trạng thái `Present`.
3. Giáo viên bấm vào biểu tượng trạng thái của học sinh có biến động (Trễ / Vắng / Phép) để chuyển đổi nhanh qua 1 chạm.
4. Nút bấm "Điểm danh nhanh cả lớp Có Mặt": Đặt lại 100% học sinh về trạng thái `Present`.
5. Dữ liệu được lưu ngay lập tức vào IndexedDB (Auto-save).

---

## F-029 — Khóa Sổ & Mở Khóa Sổ Điểm Danh (Session Lock)

### 1. Mục đích
Bảo vệ dữ liệu chuyên cần khỏi việc vô tình chạm tay chỉnh sửa sai sau khi đã chốt sổ điểm danh trong ngày.

### 2. Logic nghiệp vụ
- Trường `isLocked: boolean` trong bảng `attendanceSessions`.
- Khi `isLocked === true`:
  - Toàn bộ nút thay đổi trạng thái bị `disabled`.
  - Hiển thị huy hiệu "Đã Khóa Sổ" và thời điểm khóa.
  - Giáo viên có quyền click "Mở Khóa Sổ" (yêu cầu xác nhận) để chỉnh sửa bổ sung nếu có phát sinh (ví dụ: phụ huynh gửi đơn phép muộn).

---

## F-030 — Thống Kê & Lịch Sử Chuyên Cần Lớp Học

### 1. Thống Kê Chuyên Cần Theo Chu Kỳ
- Tính tỷ lệ chuyên cần: $\text{Attendance Rate} = \frac{\text{Tổng lượt Có mặt} + \text{Tổng lượt Trễ}}{\text{Tổng lượt Điểm danh}} \times 100\%$.
- Biểu đồ nhiệt (Attendance Heatmap) hiển thị theo lịch tháng giúp phát hiện các ngày có tỷ lệ vắng bất thường (thứ Hai, thứ Sáu, hoặc trước ngày lễ).
- Báo cáo danh sách các học sinh có nguy cơ chuyên cần (Vắng quá 3 buổi/tháng).
