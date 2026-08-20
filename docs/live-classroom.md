# Hướng Dẫn Kỹ Thuật Module: Lớp Học Trực Tuyến (Live Classroom)

## 1. Mục tiêu và Phạm vi (Objective & Scope)
Module **Lớp học trực tuyến** là bảng điều khiển cục bộ (Local Dashboard) dành riêng cho Giáo viên chủ nhiệm tiểu học sử dụng trong khi giảng dạy qua các ứng dụng họp trực tuyến như Google Meet, Zoom Workplace, Microsoft Teams hoặc các nền tảng khác.

**Nguyên tắc thiết kế:**
- **100% Cục bộ & Offline:** Không có backend, không dùng WebRTC, không có WebSocket hay server trung gian.
- **Bảo mật & Riêng tư:** Không hiển thị số điện thoại, thông tin cá nhân nhạy cảm trên màn hình trình chiếu (Presentation View).
- **Trải nghiệm thân thiện:** Giao diện nhiều màu sắc dịu nhẹ, icon dễ thương phù hợp với học sinh tiểu học.

---

## 2. Các Trang & Tuyến Đường (Routes)
- `/live-classroom`: Bảng điều khiển chính (Dashboard).
- `/live-classroom/new`: Wizard khởi tạo phiên học (8 bước).
- `/live-classroom/:sessionId`: Bảng điều khiển giảng dạy dành cho Giáo viên (Teacher Console).
- `/live-classroom/:sessionId/present`: Màn hình trình chiếu tuyên dương dành cho Học sinh (Presentation View).
- `/live-classroom/history`: Lịch sử các phiên học và nhân bản cấu hình phiên.

---

## 3. Các Công Cụ Trực Quan Hỗ Trợ Giảng Dạy (Visual Tools)
1. **🎲 Chọn học sinh ngẫu nhiên:** Thuật toán ngẫu nhiên dùng `window.crypto.getRandomValues()`, cam kết **không lặp lại tên học sinh** cho đến khi gọi hết 1 vòng danh sách có mặt.
2. **⏱️ Đồng hồ đếm giờ & bấm giờ:** Lưu trữ mốc `startedAt`, `pausedAt`, `totalPausedMs` giúp đồng hồ đếm chính xác tuyệt đối ngay cả khi Giáo viên tải lại trang (F5).
3. **👥 Chia nhóm nhanh:** Chia ngẫu nhiên theo số nhóm hoặc sĩ số nhóm, loại trừ học sinh vắng mặt, tự động đồng bộ điểm tuyên dương nhóm.
4. **✋ Giơ tay & Hàng đợi phát biểu:** Tự động xếp hàng học sinh giơ tay theo mốc thời gian `handRaisedAt`, hỗ trợ nút gọi nhanh em tiếp theo và tự động hạ tay.
5. **❓ Câu hỏi nhanh (Quick Poll A/B/C/D):** Nhập câu hỏi, phương án, hiển thị biểu đồ kết quả và trình chiếu sang màn hình chiếu học sinh.
6. **🎨 Bảng viết nhanh (Whiteboard Canvas):** Bút viết, bút nhớ, tẩy, màu sắc, nét vẽ, hoán tác (Undo) và xuất file ảnh PNG 100% cục bộ.
7. **📱 Mã QR tài liệu:** Tạo mã QR hoàn toàn tại trình duyệt client (không dùng API bên ngoài), cho phép sao chép liên kết và trình chiếu.
8. **☕ Màn hình nghỉ giải lao:** Màn hình nghỉ ngơi thư giãn với đếm ngược và hình minh họa SVG dễ thương.

---

## 4. Tích Hợp Điểm Thi Đua & Đồng Bộ Điểm Danh
- **Cộng điểm (+1, +2):** Thao tác 1-click có hiệu ứng nổ điểm và âm thanh Web Audio API Synth positive chime (Offline).
- **Trừ điểm (-):** Yêu cầu chọn lý do & danh mục vi phạm, thông báo trung tính, không sử dụng âm thanh tiêu cực hay biểu cảm chế giễu.
- **Hoàn tác (10s Undo):** Hỗ trợ nút Hoàn tác trong 10s tạo bản ghi `PointEntry` đảo ngược điểm kèm `reversedEntryId` chỉ tới ID gốc.
- **Đồng bộ sổ điểm danh:** Tra cứu `attendanceSessions` chính, xem trước thống kê và đồng bộ trạng thái điểm danh sang sổ chính mà không gây trùng lặp.

---

## 5. Xuất Báo Cáo & Phục Hồi Dữ Liệu
- **Báo cáo Excel chi tiết:** Xuất file `.xlsx` danh sách học sinh, trạng thái điểm danh, số lượt phát biểu và điểm thi đua.
- **Báo cáo PDF tóm tắt:** In/xuất trang tóm tắt thống kê tiết học chuẩn font tiếng Việt.
- **Khôi phục sự cố (Disaster Recovery):** Phát hiện phiên học chưa hoàn thành khi mở lại ứng dụng và hiển thị banner tiếp tục điều hành.
