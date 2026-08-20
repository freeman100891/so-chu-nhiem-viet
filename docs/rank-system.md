# Hệ Thống Cấp Bậc Thi Đua 17 Cấp (Emulation Rank System)

## 1. Tổng Quan Kiến Trúc
Hệ thống **Cấp Bậc Thi Đua** trong ứng dụng **Sổ Chủ Nhiệm Việt Offline** là module khen thưởng và tạo động lực học đường local-first, hoạt động 100% ngoại tuyến (offline-ready) trên nền IndexedDB (Dexie.js).

### Nguyên Tắc Cốt Lõi (Architecture Principles)
1. **Single Source of Truth:**
   - Điểm thi đua của học sinh được lưu trữ duy nhất trong bảng `pointEntries` và quản lý qua `PointService`.
   - **Tuyệt đối không lưu** trường `totalPoints` hoặc `currentRank` tĩnh bên trong bảng `students`.
   - Điểm số và cấp bậc được tính toán động (dynamically resolved) theo phạm vi cấu hình (`calculationScope`: theo năm học, theo học kỳ, hoặc toàn thời gian).
2. **Zero N+1 Query:**
   - Dùng phương thức tính toán hàng loạt theo lớp (`recalculateClassRanks`) với các chỉ mục IndexedDB để tải và phân loại toàn bộ học sinh trong lớp một lần duy nhất.
3. **Tuân Thủ Sư Phạm & An Toàn Riêng Tư:**
   - Không tạo bảng công khai học sinh cấp thấp nhất.
   - Chế độ màn hình chiếu Presentation View không hiển thị điểm trừ, hạ cấp, hay thông tin nhạy cảm.
4. **Không Dùng Tài Nguyên Từ Internet:**
   - 100% Huy hiệu Insignia được vẽ bằng Pure Vector SVG.
   - Âm thanh vinh danh Fanfare được tổng hợp qua Web Audio API synthesis.

---

## 2. Danh Sách 17 Cấp Bậc & Ngưỡng Mặc Định

| Level | Tên Cấp Bậc | Nhóm Cấp | Điểm Mặc Định | Biểu Tượng Insignia |
|:---:|:---|:---|:---:|:---|
| **1** | Binh nhì | Hạ sĩ quan & Binh sĩ | 0 đ | Khiên đồng + 1 vạch danh dự |
| **2** | Binh nhất | Hạ sĩ quan & Binh sĩ | 50 đ | Khiên đồng + 2 vạch danh dự |
| **3** | Hạ sĩ | Hạ sĩ quan & Binh sĩ | 100 đ | Khiên bạc + 1 vạch bạc |
| **4** | Trung sĩ | Hạ sĩ quan & Binh sĩ | 150 đ | Khiên bạc + 2 vạch bạc |
| **5** | Thượng sĩ | Hạ sĩ quan & Binh sĩ | 200 đ | Khiên bạc + 3 vạch bạc |
| **6** | Thiếu úy | Cấp Úy | 250 đ | Khiên Sapphire + 1 sao bạc |
| **7** | Trung úy | Cấp Úy | 300 đ | Khiên Sapphire + 2 sao bạc |
| **8** | Thượng úy | Cấp Úy | 350 đ | Khiên Sapphire + 3 sao bạc |
| **9** | Đại úy | Cấp Úy | 400 đ | Khiên Sapphire + 4 sao bạc |
| **10** | Thiếu tá | Cấp Tá | 450 đ | Khiên Vàng + Vòng nguyệt quế + 1 sao vàng |
| **11** | Trung tá | Cấp Tá | 500 đ | Khiên Vàng + Vòng nguyệt quế + 2 sao vàng |
| **12** | Thượng tá | Cấp Tá | 550 đ | Khiên Vàng + Vòng nguyệt quế + 3 sao vàng |
| **13** | Đại tá | Cấp Tá | 600 đ | Khiên Vàng + Vòng nguyệt quế + 4 sao vàng |
| **14** | Thiếu tướng | Cấp Tướng | 650 đ | Khiên Bạch Kim + Vòng nguyệt quế + 1 sao bạch kim |
| **15** | Trung tướng | Cấp Tướng | 700 đ | Khiên Bạch Kim + Vòng nguyệt quế + 2 sao bạch kim |
| **16** | Thượng tướng | Cấp Tướng | 750 đ | Khiên Bạch Kim + Vòng nguyệt quế + 3 sao bạch kim |
| **17** | Đại tướng | Cấp Tướng | 800 đ | Khiên Bạch Kim + Vòng nguyệt quế + 4 sao bạch kim + Vương miện tối cao |

---

## 3. Chế Độ Vận Hành (Rank Modes)

### 3.1. Chế Độ Thành Tích (Achievement Mode - Mặc Định)
- **Quy tắc:** Học sinh không bị tự động hạ cấp bậc khi bị trừ điểm.
- Cấp bậc hiện tại hiển thị cấp cao nhất từng đạt (`highestAchievedRank`) được xác định qua lịch sử `studentRankHistory`.
- Điểm trừ chỉ làm giảm điểm tích lũy hợp lệ và làm dài khoảng cách tới cấp tiếp theo.
- Không tạo bản ghi lịch sử `changeType = demotion`.

### 3.2. Chế Độ Động (Dynamic Mode)
- **Quy tắc:** Cấp bậc phản ánh chính xác điểm tích lũy hiện tại trong phạm vi tính điểm.
- Khi điểm bị giảm xuống dưới ngưỡng tối thiểu của cấp hiện tại, hệ thống tạo bản ghi `changeType = demotion`.
- Chế độ này yêu cầu giáo viên chủ động kích hoạt trong phần Cấu hình.

---

## 4. Tự Động Thăng Cấp & Ghi Nhận Lịch Sử (`RankIntegrationService`)
1. Giáo viên ghi điểm qua `PointService`.
2. Sau khi transaction lưu `pointEntries` thành công 100%, `rankIntegrationService.processPointEntryChange` được kích hoạt.
3. Chống Double Submit bằng `sourcePointEntryId`.
4. Tính lại điểm và cấp bậc mới của học sinh.
5. Nếu tăng cấp (vượt 1 hoặc nhiều cấp), tạo đúng **1 bản ghi `studentRankHistory`** với `changeType = 'promotion'`.
6. Nếu bật `presentationCelebrationEnabled`, phát broadcast message `STUDENT_PROMOTED` đồng bộ sang màn hình chiếu `LiveClassroomPresentPage`.

---

---

## 5. Sao Lưu & Phục Hồi Toàn Vẹn (Backup & Restore)
- File sao lưu định dạng `.gvcn-backup` chứa đầy đủ 4 bảng cấp bậc: `rankSystems`, `rankSystemClasses`, `rankLevels`, `studentRankHistory` cùng thuộc tính `countsTowardRank` trong `pointCategories`.
- Checksum mã băm SHA-256 xác thực chống chỉnh sửa trái phép.
- Hỗ trợ khôi phục tương thích ngược với các file sao lưu cũ (tự động seed 17 cấp bậc mặc định sau restore).
- Cơ chế Transaction Rollback bảo vệ dữ liệu gốc nếu xảy ra lỗi trong quá trình restore.

---

## 6. Trực Quan Hóa Dữ Liệu & Analytics (Data Visualization)
Tab **Tổng quan** (`/conduct/ranks`) cung cấp 3 biểu đồ trực quan và panel học sinh tiềm năng:
1. **Biểu đồ Donut Phân Bố Theo 4 Nhóm Cấp:**
   - Thể hiện tỷ lệ và số lượng học sinh theo 4 nhóm cấp bậc.
   - Hiển thị tổng số học sinh ở chính giữa vòng tròn.
   - Nhấp vào từng phân đoạn để lọc bảng học sinh tương ứng.
2. **Biểu đồ Cột Ngang Phân Bố 17 Cấp Bậc (Horizontal Bar Chart):**
   - 2 chế độ hiển thị: *"Có học sinh"* (mặc định gọn gàng) và *"Đủ 17 cấp"* (cuộn dọc bên trong card).
   - Nhấp vào từng thanh để lọc danh sách học sinh theo đúng cấp bậc.
3. **Biểu đồ Miền Xu Hướng Thăng Cấp (Area Chart):**
   - Biểu diễn số lượt thăng cấp (`changeType = 'promotion'`) theo trục thời gian (ngày/tuần/tháng tùy phạm vi bộ lọc).
   - Đánh dấu mốc thời gian cao điểm nhất trong học kỳ/năm học.
4. **Khối Học Sinh Sắp Thăng Cấp (Near-Promotion Panel):**
   - Liệt kê top học sinh sát ngưỡng điểm cấp tiếp theo cần thầy cô khích lệ.
   - Thanh tiến độ động (%) và số điểm còn thiếu.
   - Loại trừ học sinh đã đạt Đại tướng (Cấp 17).
5. **Hỗ Trợ Tiếp Cận & Khả Năng Tương Thích:**
   - Chế độ *"Xem dữ liệu dạng bảng"* thân thiện với Screen Reader cho mọi biểu đồ.
   - Tôn trọng thuộc tính `prefers-reduced-motion`.
   - Thiết kế Responsive 12 cột tương thích hoàn hảo từ 360px đến màn hình 4K.
