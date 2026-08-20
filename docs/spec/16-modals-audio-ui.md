# ĐẶC TẢ GIAO DIỆN, MODAL, ÂM THANH & HIỆU ỨNG (UI, MODALS, AUDIO & ANIMATIONS)
> Mã tài liệu: `SPEC-16-UI-MODALS-AUDIO`  
> Phân hệ: Danh Mục Modal, Web Audio Synthesizer & Canvas Confetti Engine  

---

## 1. Danh Mục Toàn Bộ Modal Trong Hệ Thống

| ID | Tên Modal | Component Tương Ứng | Điều Kiện Mở | Điều Kiện Đóng | Dữ Liệu Tương Tác |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **M-01** | Tạo/Sửa Lớp Học | `src/modules/classes/ClassesPage.tsx` | Click "Thêm lớp mới" hoặc icon Sửa | Click "Lưu", "Hủy" hoặc nút X | Form thông tin lớp (Tên, Khối, Năm học, Quy định) |
| **M-02** | Tạo/Sửa Học Sinh | `src/modules/students/StudentsPage.tsx` | Click "Thêm học sinh" hoặc icon Sửa | Click "Lưu", "Hủy" hoặc nút X | Form học sinh (Mã, Họ tên, Ngày sinh, Giới tính, Phụ huynh) |
| **M-03** | Chọn Avatar Học Sinh | `src/shared/components/AvatarPickerModal.tsx` | Click vào ảnh avatar của học sinh | Chọn 1 avatar hoặc bấm "Hủy" | 31+ mẫu Avatar SVG phân theo 5 chủ đề & Avatar upload |
| **M-04** | Chọn Avatar Giáo Viên | `src/modules/settings/SettingsPage.tsx` | Click "Đổi ảnh đại diện" ở trang Cài đặt | Chọn avatar hoặc bấm "Đóng" | Thư viện avatar sư phạm & Upload ảnh từ máy |
| **M-05** | Chuyển Lớp Học Sinh | `src/modules/classes/ClassDetailPage.tsx` | Click "Chuyển lớp" trong danh sách | Chọn lớp đích và bấm "Xác nhận" | Danh sách lớp cùng khối trong năm học |
| **M-06** | Import Học Sinh Từ Excel | `src/modules/students/StudentsPage.tsx` | Click nút "Nhập từ Excel" | Import xong hoặc bấm "Hủy" | Kéo thả file `.xlsx`, bảng xem trước và ánh xạ cột |
| **M-07** | Chấm Điểm Thi Đua | `src/modules/conduct/ConductPage.tsx` | Click vào thẻ học sinh / nút Chấm điểm | Chọn tiêu chí và bấm "Cộng/Trừ điểm" | Danh mục tiêu chí Merit/Demerit, số điểm, lý do |
| **M-08** | Chấm Điểm Hàng Loạt | `src/modules/conduct/ConductPage.tsx` | Tích chọn nhiều học sinh $\rightarrow$ "Chấm điểm" | Bấm "Áp dụng cho N học sinh" | Tiêu chí áp dụng đồng loạt |
| **M-09** | Chúc Mừng Thăng Cấp | `src/shared/components/PromotionCelebrationModal.tsx` | Học sinh đạt mốc điểm thăng cấp quân hàm | Bấm "Tuyệt vời", "Tiếp tục" hoặc phím Esc | Cấp bậc cũ $\rightarrow$ Cấp bậc mới, Avatar mới, Pháo hoa, Nhạc |
| **M-10** | Cấu Hình Vinh Danh | `LevelUpCelebrationSettingsModal.tsx` | Click biểu tượng Cài đặt trên thanh Vinh danh | Bấm "Lưu cấu hình" | Bật/tắt tự động mở modal, thời gian hiển thị pháo hoa |
| **M-11** | Giải Quyết Hòa Điểm | `TieResolutionModal.tsx` | Số ứng viên đạt danh hiệu vượt quá chỉ tiêu | Chọn 1 trong 3 giải pháp và bấm Xác nhận | Danh sách học sinh hòa điểm, lựa chọn tăng chỉ tiêu |
| **M-12** | Đổi Quà Cho Học Sinh | `src/modules/gifts/GiftsPage.tsx` | Click "Đổi quà" tại thẻ học sinh | Bấm "Xác nhận đổi quà" hoặc "Hủy" | Giỏ quà chọn, tính toán điểm trừ, kiểm tra tồn kho |
| **M-13** | Biên Nhận Đổi Quà | `src/modules/gifts/components/GiftReceiptModal.tsx` | Đổi quà thành công | Bấm "In biên nhận" hoặc "Hoàn tất" | Mã biên nhận, họ tên học sinh, quà đã nhận, điểm còn lại |
| **M-14** | Điều Chỉnh Tồn Kho Quà | `src/modules/gifts/components/GiftStockAdjustModal.tsx`| Click "Nhập/Xuất kho" | Bấm "Cập nhật tồn kho" | Số lượng điều chỉnh (+/-), lý do nhập/xuất |
| **M-15** | Bốc Thăm Ngẫu Nhiên | `RandomPickerTool.tsx` | Click công cụ Bốc thăm tại Live Classroom | Bấm nút X đóng công cụ | Vòng quay học sinh, kết quả trúng, nút cộng điểm nhanh |
| **M-16** | Bầu Chọn & Khảo Sát | `QuickPollTool.tsx` | Click công cụ Bầu chọn tại Live Classroom | Bấm nút X | Câu hỏi khảo sát, các phương án, biểu đồ kết quả |
| **M-17** | Hàng Đợi Giơ Tay | `HandRaisedQueueTool.tsx` | Click công cụ Giơ tay tại Live Classroom | Bấm nút X | Danh sách học sinh đang giơ tay theo thứ tự thời gian |
| **M-18** | Bảng Trắng Tương Tác | `WhiteboardTool.tsx` | Click công cụ Bảng trắng tại Live Classroom | Bấm nút X | Canvas vẽ viết, bộ màu, tẩy, lưu hình ảnh |
| **M-19** | Màn Hình Nghỉ Giải Lao | `BreakScreenTool.tsx` | Click công cụ Nghỉ giải lao | Bấm "Kết thúc giải lao" hoặc hết giờ | Đồng hồ đếm ngược, nền nhạc thư giãn |
| **M-20** | Tạo Mã QR Bài Giảng | `QrGeneratorTool.tsx` | Click công cụ QR Code | Bấm nút X | Input đường link URL, hình ảnh mã QR phóng to |
| **M-21** | Tổng Kết Phiên Học | `SessionSummaryModal.tsx` | Click "Kết thúc phiên học" | Bấm "Lưu vào sổ chính & Đóng" | Thống kê số lượt phát biểu, top điểm, danh sách điểm phiên |
| **M-22** | Sao Lưu Cơ Sở Dữ Liệu | `src/modules/backup/BackupPage.tsx` | Click "Tạo bản sao lưu mới" | Xuất file xong | Tùy chọn đặt mật khẩu bảo vệ mã hóa AES-GCM |
| **M-23** | Khôi Phục Cơ Sở Dữ Liệu | `src/modules/backup/BackupPage.tsx` | Chọn file `.gvcn-backup` để phục hồi | Bấm "Bắt đầu khôi phục" | Nhập mật khẩu giải mã, chọn chế độ Ghi đè / Hợp nhất |
| **M-24** | Xem Trước Chủ Đề | `ThemePreviewModal.tsx` | Click "Xem trước" tại Cài đặt giao diện | Bấm "Áp dụng chủ đề" hoặc "Đóng" | Xem trước bảng màu, font chữ, icon của chủ đề |
| **M-25** | Xác Nhận Hành Động (Xóa)| `src/shared/components/ConfirmModal.tsx` | Bấm Xóa học sinh, Xóa lớp, Khóa sổ... | Bấm "Xác nhận xóa" hoặc "Hủy bỏ" | Cảnh báo hành động, tiêu đề, nội dung xác nhận |

---

## 2. Hệ Thống Âm Thanh Sư Phạm (Web Audio Synthesizer Engine)

Hệ thống sử dụng module âm thanh `src/shared/utilities/sound.ts` tạo âm thanh bằng bộ dao động sóng âm thuần túy (`AudioContext Oscillators`), **không cần tải tệp âm thanh bên ngoài**, đảm bảo hoạt động 100% không bị lỗi thiếu file và không làm tăng dung lượng bundle:

| Hàm Âm Thanh | Loại Sóng & Tần Số | Thời Lượng | Sự Kiện Kích Hoạt |
| :--- | :--- | :---: | :--- |
| `playPointAddSound()` | Sine Wave $523\text{Hz} \rightarrow 659\text{Hz} \rightarrow 784\text{Hz}$ (Âm hợp âm Đô Trưởng) | $0.25\text{s}$ | Khi giáo viên cộng điểm thi đua cho học sinh |
| `playPointSubtractSound()`| Sine Wave $392\text{Hz} \rightarrow 330\text{Hz}$ (Âm trầm giảm dần) | $0.2\text{s}$ | Khi giáo viên trừ điểm vi phạm nề nếp |
| `playLevelUpSound()` | Fanfare $523\text{Hz} \rightarrow 659\text{Hz} \rightarrow 784\text{Hz} \rightarrow 1046\text{Hz}$ | $0.6\text{s}$ | Khi học sinh thăng cấp quân hàm hoặc mở modal vinh danh |
| `playTickSound()` | Triangle Wave $800\text{Hz}$ (Tiếng tích tắc ngắn) | $0.05\text{s}$ | Mỗi vòng quay trong công cụ Bốc thăm ngẫu nhiên |
| `playTimerFinishSound()` | Chuông báo $880\text{Hz} \times 3$ nhịp | $0.8\text{s}$ | Khi đồng hồ đếm ngược / giờ giải lao kết thúc |

---

## 3. Hệ Thống Thu Phóng Giao Diện (UI Scale & Presentation Mode)

Thông qua hook `useUiScale.ts`:
- Cho phép điều chỉnh kích thước toàn bộ giao diện từ **$80\%$ (máy tính nhỏ)** đến **$130\%$ (màn hình tivi / máy chiếu lớn)**.
- Khi bật Chế độ Trình chiếu (`Presentation Mode`):
  - Tự động kích hoạt HTML5 Fullscreen API (`document.documentElement.requestFullscreen()`).
  - Ẩn thanh Sidebar, Header và các nút cấu hình quản trị riêng tư.
  - Tăng kích thước font chữ và thẻ học sinh lên mức tối đa giúp học sinh ngồi cuối lớp vẫn nhìn rõ ràng.
