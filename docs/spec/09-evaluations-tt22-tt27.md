# ĐẶC TẢ CHI TIẾT: ĐÁNH GIÁ HỌC SINH THEO THÔNG TƯ 22 & 27 (F-051 -> F-056)
> Mã tài liệu: `SPEC-09-EVALUATIONS`  
> Phân hệ: Đánh giá Phẩm chất & Năng lực theo Thông tư 22/2021/TT-BGDĐT & Thông tư 27/2020/TT-BGDĐT  

---

## F-051 & F-052 — Khung Đánh Giá Chuẩn Hóa Theo Cấp Học

### 1. Mục đích
Hỗ trợ giáo viên chủ nhiệm thực hiện đánh giá định kỳ về sự hình thành và phát triển phẩm chất, năng lực của học sinh đúng theo các văn bản quy phạm pháp luật hiện hành của Bộ Giáo dục & Đào tạo.

### 2. Hai Khung Quy Định Tích Hợp Sẵn
1. **Thông tư 27/2020/TT-BGDĐT (Dành cho Cấp Tiểu học - Lớp 1 đến Lớp 5)**:
   - Thang đánh giá 3 mức: **Tốt (T)**, **Đạt (Đ)**, **Cần cố gắng (C)**.
   - Các đợt đánh giá: Giữa Học kỳ 1 (`MID_TERM_1`), Cuối Học kỳ 1 (`END_TERM_1`), Giữa Học kỳ 2 (`MID_TERM_2`), Cuối Năm học (`END_YEAR`).
2. **Thông tư 22/2021/TT-BGDĐT (Dành cho Cấp THCS & THPT - Lớp 6 đến Lớp 12)**:
   - Thang đánh giá rèn luyện 4 mức: **Tốt (T)**, **Khá (K)**, **Đạt (Đ)**, **Chưa đạt (CĐ)**.
   - Các đợt đánh giá: Học kỳ 1 (`TERM_1`), Học kỳ 2 (`TERM_2`), Cả năm (`FULL_YEAR`).

---

## F-053 & F-054 — Tiêu Chí Đánh Giá Phẩm Chất & Năng Lực

### 1. Phẩm Chất Chủ Yếu (5 Phẩm chất)
1. **Yêu nước (`patriotism`)**: Tự hào về truyền thống dân tộc, yêu quê hương đất nước.
2. **Nhân ái (`compassion`)**: Yêu thương bạn bè, kính trọng thầy cô, giúp đỡ người khó khăn.
3. **Chăm chỉ (`diligence`)**: Đi học chuyên cần, tích cực làm bài tập và rèn luyện.
4. **Trung thực (`honesty`)**: Thật thà trong học tập và sinh hoạt, không gian dối.
5. **Trách nhiệm (`responsibility`)**: Có trách nhiệm với bản thân, tập thể lớp và môi trường.

### 2. Năng Lực Cốt Lõi (3 Năng lực chung)
1. **Tự chủ và tự học (`autonomy_learning`)**: Tự giác hoàn thành nhiệm vụ được giao.
2. **Giao tiếp và hợp tác (`communication_cooperation`)**: Tương tác tốt trong làm việc nhóm.
3. **Giải quyết vấn đề và sáng tạo (`problem_solving_creativity`)**: Linh hoạt xử lý các tình huống thực tế.

---

## F-055 & F-056 — Ngân Hàng Mẫu Nhận Xét Sư Phạm & Gợi Ý Thông Minh

### 1. Ngân Hàng Mẫu Nhận Xét Phong Phú
- Hệ thống tích hợp sẵn hơn 120 mẫu nhận xét sư phạm chuẩn mực, phân theo từng phẩm chất, từng mức độ (Tốt / Đạt / Cần cố gắng) và cấp học.
- Giáo viên có thể bấm "Gợi ý nhận xét" $\rightarrow$ Drawer mở ra các mẫu câu phù hợp với mức đánh giá hiện tại của học sinh $\rightarrow$ 1 chạm để áp dụng hoặc chỉnh sửa thêm.

### 2. Kiểm Tra Tính Toàn Vẹn Trước Khi Xuất Báo Cáo
- `evaluation-validation.service.ts` quét toàn bộ bảng đánh giá của lớp:
  - Cảnh báo học sinh còn thiếu điểm đánh giá hoặc chưa có lời nhận xét tổng quát.
  - Tự động gợi ý mức đánh giá xếp loại rèn luyện chung dựa trên kết quả thành phần.
