# ĐẶC TẢ CHI TIẾT: CỬA HÀNG QUÀ TẶNG & ĐỔI THƯỞNG (F-057 -> F-061)
> Mã tài liệu: `SPEC-10-GIFTS-REWARDS`  
> Phân hệ: Cửa Hàng Quà Tặng, Quản Lý Tồn Kho & Đổi Thưởng Học Sinh  

---

## F-057 & F-058 — Danh Mục Quà Tặng & Quản Lý Tồn Kho

### 1. Mục đích
Khuyến khích học sinh nỗ lực tích lũy điểm thi đua bằng cách cho phép các em đổi điểm lấy các phần quà học tập thực tế (bút, vở, sticker, đồ chơi sáng tạo, vé miễn làm trực nhật...).

### 2. Vị trí & Route
- Route: `/gifts`, `/gifts/presentation`
- Component: `src/modules/gifts/GiftsPage.tsx`, `src/modules/gifts/GiftPresentationPage.tsx`
- Service: `src/core/services/gift.service.ts`, `src/core/services/gift-redemption.service.ts`
- Repository: `src/core/repositories/gift.repository.ts`, `src/core/repositories/gift-redemption.repository.ts`

### 3. Thuộc Tính Quà Tặng
- `name`: Tên phần quà (vd: `Bút chì 2B gọt sẵn`, `Hộp bút hoạt hình`).
- `category`: Nhóm quà (`Stationery` dụng cụ học tập, `Privilege` đặc quyền lớp học, `Toy` đồ chơi, `Book` sách truyện).
- `pointCost`: Số điểm thi đua cần để đổi (vd: 50 điểm, 100 điểm).
- `inventoryMode`: `finite` (Quản lý số lượng tồn kho chính xác) hoặc `infinite` (Không giới hạn, vd vé khen thưởng).
- `stockQuantity`: Số lượng còn lại trong kho.
- `presentationVisible`: Bật/tắt hiển thị quà trên máy chiếu.

---

## F-059 & F-060 — Quy Trình Đổi Quà & Biên Nhận Đổi Thưởng

### 1. Luồng Thao Tác Đổi Quà
1. Giáo viên mở tab "Đổi quà" $\rightarrow$ Chọn học sinh muốn đổi thưởng.
2. Hệ thống hiển thị **Số dư điểm thi đua khả dụng (Available Points)** của học sinh.
3. Giáo viên chọn các món quà học sinh muốn nhận $\rightarrow$ Hệ thống tự động tính tổng điểm cần thanh toán.
4. Validation:
   - Nếu $\text{Tổng điểm quà} > \text{Số dư điểm của học sinh}$: Báo lỗi và không cho thực hiện.
   - Nếu món quà có `inventoryMode === 'finite'` và $\text{Số lượng tồn} < \text{Số lượng chọn}$: Báo lỗi hết hàng.
5. Giáo viên nhấn "Xác nhận đổi quà":
   - Tạo bản ghi `GiftRedemption` và các chi tiết `GiftRedemptionItem`.
   - Giảm số lượng tồn kho trong `gifts` và ghi vết `GiftStockMovement`.
   - Trừ số dư điểm thi đua khả dụng của học sinh bằng cách tạo bản ghi điểm trừ tương ứng trong `pointEntries`.
   - Hiển thị Modal "Biên Nhận Đổi Quà" (`GiftReceiptModal.tsx`) chúc mừng học sinh.

---

## F-061 — Trình Chiếu Cửa Hàng Quà Tặng (`GiftPresentationPage.tsx`)

- Giao diện dạng Showcase hiện đại trên nền nhạc vui tươi.
- Hiển thị hình ảnh quà tặng sắc nét, giá điểm và huy hiệu tồn kho.
- Tự động đồng bộ với màn hình điều khiển của giáo viên qua `BroadcastChannel API`.
