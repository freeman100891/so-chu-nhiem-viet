# ĐẶC TẢ CHI TIẾT: NỀ NẾP & ĐIỂM THI ĐUA (F-031 -> F-036)
> Mã tài liệu: `SPEC-06-CONDUCT-SCORE`  
> Phân hệ: Sổ Điểm Thi Đua, Danh Mục Tiêu Chí, Chấm Điểm & Hoàn Tác  

---

## F-031 & F-032 — Sổ Điểm Thi Đua & Danh Mục Tiêu Chí Cộng/Trừ

### 1. Mục đích
Ghi nhận và lượng hóa quá trình rèn luyện nề nếp, học tập và hoạt động phong trào của học sinh thông qua hệ thống điểm cộng thưởng (`Merit`) và trừ phạt (`Demerit`).

### 2. Vị trí & Route
- Route: `/conduct`
- Component: `src/modules/conduct/ConductPage.tsx`
- Service: `src/core/services/conduct.service.ts`
- Repository: `src/core/repositories/conduct.repository.ts`

### 3. Danh Mục Tiêu Chí Chuẩn Hóa (Point Categories)
Hệ thống cài đặt sẵn 10 tiêu chí sư phạm tiêu biểu:
1. **Phát biểu xây dựng bài**: $+10$ điểm (Merit)
2. **Làm bài tập đầy đủ, xuất sắc**: $+15$ điểm (Merit)
3. **Giúp đỡ bạn bè trong học tập**: $+10$ điểm (Merit)
4. **Tham gia tích cực hoạt động Đội/Lớp**: $+20$ điểm (Merit)
5. **Đạt điểm 9-10 bài kiểm tra**: $+15$ điểm (Merit)
6. **Không làm bài tập về nhà**: $-10$ điểm (Demerit)
7. **Nói chuyện riêng, mất trật tự**: $-10$ điểm (Demerit)
8. **Đi học muộn không lý do**: $-5$ điểm (Demerit)
9. **Vi phạm đồng phục, vệ sinh**: $-5$ điểm (Demerit)
10. **Không mang đầy đủ sách vở/dụng cụ**: $-5$ điểm (Demerit)

---

## F-033 -> F-035 — Chấm Điểm Đơn Lẻ, Nhiều Học Sinh, Theo Nhóm & Cơ Chế Hoàn Tác (Undo)

### 1. Chấm Điểm Linh Hoạt
- **Chấm 1 học sinh**: Bấm vào thẻ học sinh $\rightarrow$ Chọn tiêu chí hoặc nhập điểm tự do $\rightarrow$ Nhập ghi chú $\rightarrow$ Lưu.
- **Chấm nhiều học sinh (Multi-select)**: Tích chọn nhiều học sinh $\rightarrow$ Bấm nút "Chấm điểm hàng loạt" $\rightarrow$ Hệ thống tạo transaction tạo đồng thời $N$ bản ghi `pointEntries`.
- **Chấm điểm theo nhóm**: Chấm điểm cho tất cả thành viên trong nhóm học tập tại phiên Live Classroom.

### 2. Cơ Chế Hoàn Tác Điểm (Undo Point Entry)
- Mọi giao dịch chấm điểm đều tạo 1 bản ghi `PointEntry` có ID độc lập.
- Giáo viên có thể bấm "Hoàn tác" (Undo) ngay trên Toast thông báo hoặc trong Dòng thời gian học sinh.
- Khi hoàn tác:
  - Bản ghi `PointEntry` được đánh dấu `deletedAt = new Date().toISOString()` (Soft delete).
  - Hệ thống tự động tính toán lại điểm ròng và điểm tích lũy của học sinh.
  - Ghi vết vào `auditLogs` với `action: 'UNDO_POINT'`.

---

## F-036 — Lọc & Thống Kê Biến Động Điểm

### 1. Phân Biệt 2 Loại Điểm Cốt Lõi
1. **Tổng Điểm Ròng (Net Points)**: $\text{Net Points} = \sum \text{Điểm Cộng} - \sum |\text{Điểm Trừ}|$. Dùng để xếp hạng tuần/tháng, mua quà trong Cửa hàng Quà Tặng.
2. **Điểm Tích Lũy Quân Hàm (Gross Achievement Points)**: $\text{Gross Points} = \sum \text{Điểm Cộng}$ (Chỉ tính các tiêu chí có `countsTowardRank: true`). Dùng để xét Thăng Cấp Quân Hàm và Cấp Bậc Avatar.
