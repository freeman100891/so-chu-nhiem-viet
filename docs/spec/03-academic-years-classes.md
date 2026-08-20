# ĐẶC TẢ CHI TIẾT: NĂM HỌC & LỚP HỌC (F-011 -> F-018)
> Mã tài liệu: `SPEC-03-ACADEMIC-YEARS-CLASSES`  
> Phân hệ: Quản lý Năm học, Học kỳ, Lớp học & Phân lớp  

---

## F-011 & F-012 — Quản Lý Năm Học & Học Kỳ

### 1. Mục đích
Quản lý cấu trúc thời gian sư phạm của nhà trường, kích hoạt Năm học & Học kỳ hiện hành để tự động gán vào mọi giao dịch điểm danh, chấm điểm thi đua, xét danh hiệu và đánh giá định kỳ.

### 2. Người sử dụng
Giáo viên Chủ nhiệm.

### 3. Vị trí
- Route: `/academic-years`
- Component: `src/modules/academic-years/AcademicYearsPage.tsx`
- Service: `src/core/services/academic-year.service.ts`, `src/core/services/term.service.ts`
- Repository: `src/core/repositories/academic-year.repository.ts`

### 4. Luồng thao tác
1. Giáo viên xem danh sách các năm học đã tạo kèm trạng thái `Đang hoạt động (Active)` hoặc `Đã lưu trữ (Archived)`.
2. Tạo mới Năm học: Nhập tên năm học (vd: `2026 - 2027`), ngày bắt đầu (`2026-09-01`), ngày kết thúc (`2027-05-31`).
3. Khởi tạo Học kỳ: Hệ thống tự động tạo 2 học kỳ (Học kỳ 1, Học kỳ 2) với các mốc thời gian phân bổ chuẩn.
4. Đổi Năm học / Học kỳ hiện hành: Giáo viên click chọn "Đặt làm năm học hiện tại" $\rightarrow$ Hệ thống cập nhật `activeAcademicYearId` trong `settings` và kích hoạt lại toàn bộ bộ lọc trên Dashboard.

### 5. Validation
- Tên năm học không được trùng lặp.
- Ngày kết thúc năm học phải lớn hơn ngày bắt đầu tối thiểu 90 ngày.
- Ngày kết thúc của Học kỳ 1 phải nhỏ hơn hoặc bằng ngày bắt đầu của Học kỳ 2.

### 6. Logic nghiệp vụ & Transaction
- Khi một Năm học được đặt làm `isActive: true`, tất cả các năm học khác trong database tự động chuyển về `isActive: false` trong cùng 1 transaction IndexedDB để đảm bảo tính duy nhất.

---

## F-013 — Cảnh Báo Ngoài Khoảng Thời Gian Học Kỳ (TermDateWarningBanner)

### 1. Mục đích
Cảnh báo trực quan cho giáo viên khi thực hiện thao tác điểm danh hoặc chấm điểm thi đua vào một ngày nằm ngoài khoảng thời gian hiệu lực của học kỳ đang chọn (ví dụ: điểm danh trong kỳ nghỉ hè hoặc chọn nhầm ngày trong quá khứ).

### 2. Vị trí
- Component: `src/shared/components/TermDateWarningBanner.tsx`
- Xuất hiện tại: Trang Điểm danh (`/attendance`), Trang Thi đua (`/conduct`), Trang Tạo Bảng Vàng (`/conduct/honor-board/new`).

### 3. Logic nghiệp vụ
```typescript
const isOutOfRange = targetDate < activeTerm.startDate || targetDate > activeTerm.endDate;
if (isOutOfRange) {
  // Hiển thị Banner cảnh báo màu vàng kèm nút "Chuyển nhanh về hôm nay" hoặc "Đổi kỳ xét"
}
```

---

## F-014 -> F-017 — Quản Lý Danh Sách & Chi Tiết Lớp Học

### 1. Vị trí & Route
- Danh sách lớp: `/classes` (`src/modules/classes/ClassesPage.tsx`)
- Chi tiết lớp: `/classes/:classId` (`src/modules/classes/ClassDetailPage.tsx`)
- Service: `src/core/services/class.service.ts`
- Repository: `src/core/repositories/class.repository.ts`

### 2. Các chức năng chính
1. **Lọc lớp học theo Khối (Grade Filter)**: Phân nhóm từ Khối 1 đến Khối 12.
2. **Tạo lớp học mới**: Nhập tên lớp (vd `1A1`), chọn Khối (1-12), chọn Năm học liên kết, chọn Quy định đánh giá áp dụng (`TT27_2020_PRIMARY` cho Tiểu học, `TT22_2021_LOWER_SECONDARY` cho THCS, `TT22_2021_UPPER_SECONDARY` cho THPT).
3. **Chi tiết lớp học**:
   - Thống kê tổng sĩ số, số lượng nam/nữ, tỷ lệ chuyên cần trung bình.
   - Danh sách học sinh theo lớp kèm Avatar 5 cấp độ tiến hóa, huy hiệu quân hàm và điểm thi đua tích lũy.
   - Thao tác nhanh: Thêm học sinh, Import Excel vào lớp, Chuyển lớp học sinh.
4. **Lưu trữ lớp học (Archive Class)**: Khi kết thúc năm học, lớp được chuyển sang trạng thái `Archived` (chỉ xem, không cho sửa đổi điểm) để bảo toàn dữ liệu lịch sử.

---

## F-018 — Chuyển Lớp Học Sinh & Bảo Toàn Lịch Sử Phân Lớp

### 1. Mục đích
Cho phép chuyển học sinh từ lớp này sang lớp khác (ví dụ: chuyển từ 1A1 sang 1A2) mà không làm mất lịch sử điểm danh, điểm thi đua và nhận xét đã có ở lớp cũ.

### 2. Logic nghiệp vụ (ClassEnrollment Model)
- Hệ thống sử dụng bảng trung gian `classEnrollments` với các trường `classId`, `studentId`, `status: 'Active' | 'Transferred' | 'Left'`, `joinedAt`, `leftAt`.
- Khi chuyển lớp:
  1. Cập nhật bản ghi `classEnrollments` cũ: `status = 'Transferred'`, `leftAt = new Date().toISOString()`.
  2. Tạo bản ghi `classEnrollments` mới: `classId = newClassId`, `status = 'Active'`, `joinedAt = new Date().toISOString()`.
  3. Bản ghi học sinh trong `students` vẫn giữ nguyên ID, toàn bộ điểm số cũ vẫn được bảo toàn nguyên vẹn.
