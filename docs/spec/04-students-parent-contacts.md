# ĐẶC TẢ CHI TIẾT: HỒ SƠ HỌC SINH & LIÊN LẠC PHỤ HUYNH (F-019 -> F-027)
> Mã tài liệu: `SPEC-04-STUDENTS-PARENTS`  
> Phân hệ: Quản lý Hồ sơ học sinh, Avatar 5 cấp độ & Danh bạ phụ huynh  

---

## F-019 -> F-021 — Hồ Sơ Học Sinh & Chuẩn Hóa Tên Tiếng Việt

### 1. Mục đích
Quản lý hồ sơ toàn diện từng học sinh (Mã định danh, Họ và tên, Giới tính, Ngày sinh, Dân tộc, Nơi sinh, Địa chỉ cư trú, Tình trạng sức khỏe, Hoàn cảnh gia đình). Tự động chuẩn hóa họ tên tiếng Việt để tìm kiếm không dấu chính xác tuyệt đối.

### 2. Vị trí & Route
- Route: `/students`, `/students/:studentId`
- Component: `src/modules/students/StudentsPage.tsx`, `src/modules/students/StudentDetailPage.tsx`
- Service: `src/core/services/student.service.ts`, `src/core/services/student-profile.service.ts`
- Utility: `src/shared/utilities/normalize.ts`

### 3. Chuẩn Hóa Tiếng Việt (Vietnamese Name Normalization)
Hệ thống sử dụng thuật toán chuẩn hóa trong `normalize.ts`:
```typescript
export function normalizeVietnamese(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}
```
Trường `normalizedName` được đánh chỉ mục trong IndexedDB (`students: 'id, studentCode, normalizedName, deletedAt'`), cho phép tìm kiếm học sinh với tốc độ $O(\log N)$ ngay cả khi người dùng gõ không dấu (vd: gõ "nguyen van a" tìm thấy "Nguyễn Văn Á").

---

## F-022 -> F-024 — Hệ Thống 31+ Avatar Vector SVG & 5 Cấp Bậc Tiến Hóa (FEAT-AVATAR-003)

### 1. Bộ Sưu Tập Avatar Vector SVG Độc Quyền
Hệ thống tích hợp sẵn 31 mẫu Avatar SVG chia theo 5 nhóm chủ đề:
- **Học đường**: Học sinh nam/nữ, Đội viên gương mẫu, Sao đỏ, Lớp trưởng.
- **Động vật dễ thương**: Mèo thông thái, Gấu chăm chỉ, Thỏ nhanh nhẹn, Sư tử dũng cảm.
- **Nghề nghiệp tương lai**: Nhà khoa học, Bác sĩ, Họa sĩ, Phi công, Lập trình viên.
- **Cổ tích & Siêu anh hùng**: Hiệp sĩ, Phù thủy nhỏ, Siêu anh hùng.
- **Quân hàm chiến binh**: Chiến binh nhí, Tân binh học tập.

### 2. Hệ Thống 5 Cấp Bậc Avatar Tiến Hóa Đồng Bộ
Mỗi học sinh khi tích lũy điểm thi đua sẽ tự động tiến hóa qua 5 cấp bậc Avatar (Novice $\rightarrow$ Apprentice $\rightarrow$ Adept $\rightarrow$ Master $\rightarrow$ Grandmaster):

| Cấp Avatar | Tên Cấp Bậc | Ngưỡng Điểm | Khung Viền & Hiệu Ứng | Phân Nhóm Cấp Bậc Quân Hàm |
| :---: | :--- | :---: | :--- | :--- |
| **Cấp 1** | **Tân Binh (Novice)** | $0 - 149$ điểm | Viền Đồng mộc mạc, nền xám thanh lịch | Binh nhì, Binh nhất, Hạ sĩ |
| **Cấp 2** | **Tập Sự (Apprentice)** | $150 - 299$ điểm | Viền Bạc ánh kim, hiệu ứng tỏa sáng nhẹ | Trung sĩ, Thượng sĩ, Thiếu úy |
| **Cấp 3** | **Chiến Sĩ (Adept)** | $300 - 449$ điểm | Viền Lam hoàng gia, tia sáng xung quanh | Trung úy, Thượng úy, Đại úy |
| **Cấp 4** | **Chỉ Huy (Master)** | $450 - 649$ điểm | Viền Vàng Hoàng Kim óng ánh, huy hiệu sao | Thiếu tá, Trung tá, Thượng tá, Đại tá |
| **Cấp 5** | **Đại Tướng (Grandmaster)** | $\ge 650$ điểm | Viền Cầu Vồng Thần Thoại + Hào quang xoay | Thiếu tướng, Trung tướng, Thượng tướng, Đại tướng |

### 3. Đồng Bộ Toàn Hệ Thống Không Phụ Thuộc Build Hash
Thông qua `avatar-card-theme.service.ts` và `avatar-theme-registry.ts`, tất cả các màn hình (Danh sách học sinh, Chi tiết học sinh, Lớp học trực tuyến, Bảng vàng, Báo cáo, Đổi quà) đều sử dụng component chuẩn `<StudentAvatar student={student} size="md" showLevelBadge={true} />`, triệt tiêu hoàn toàn hiện tượng lệch ảnh hoặc không nhận diện được đường dẫn asset.

---

## F-025 -> F-027 — Chi Tiết Hồ Sơ & Danh Bạ Phụ Huynh Học Sinh

### 1. Dòng Thời Gian Thi Đua & Nhật Ký Sư Phạm (Timeline)
Trang chi tiết học sinh (`/students/:studentId`) tích hợp:
- **Biểu đồ Radar 5 phẩm chất & 3 năng lực**: Trực quan hóa mức độ phát triển toàn diện.
- **Dòng thời gian biến động điểm**: Hiển thị từng lần cộng/trừ điểm kèm lý do, ngày giờ, người chấm và nút Hoàn tác (Undo).
- **Lịch sử chuyên cần**: Tỷ lệ có mặt, trễ, nghỉ học có phép/không phép.
- **Nhật ký tương tác phụ huynh**: Lưu vết các cuộc trao đổi trực tiếp, gọi điện, nhắn tin giữa giáo viên và phụ huynh.

### 2. Danh Bạ & Hàng Đợi Gọi Điện Khẩn Cấp (Emergency Call Queue)
- Quản lý nhiều người liên hệ cho 1 học sinh (Bố, Mẹ, Ông/Bà, Người giám hộ).
- Đánh dấu **Người liên hệ chính (isPrimary)** và **Số điện thoại khẩn cấp**.
- Nút bấm 1 chạm:
  - **Gọi điện thoại**: Kích hoạt giao thức `tel:0912345678`.
  - **Mở chat Zalo**: Kích hoạt `https://zalo.me/0912345678`.
  - **Soạn tin SMS**: Mở ứng dụng tin nhắn mặc định với nội dung mẫu thông báo kết quả học tập/chuyên cần.
