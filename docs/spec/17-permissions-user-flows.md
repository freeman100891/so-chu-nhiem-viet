# ĐẶC TẢ MA TRẬN PHÂN QUYỀN & LUỒNG NGƯỜI DÙNG (PERMISSIONS & USER FLOWS)
> Mã tài liệu: `SPEC-17-PERMISSIONS-FLOWS`  
> Phân hệ: Quyền Hạn Sử Dụng & 4 Luồng Nghiệp Vụ Sư Phạm Cốt Lõi  

---

## 1. Ma Trận Phân Quyền Sử Dụng (Permission Matrix)

Do tính chất ứng dụng **Client-Side PWA 100% Offline**, quyền truy cập được quản lý dựa trên **Chế độ Vận hành (Operating Mode)**:

| Chức Năng / Nghiệp Vụ | Chế Độ Giáo Viên (Admin/Owner Mode) | Chế Độ Trình Chiếu Học Sinh (Presentation Mode) | Ghi Chú Bảo Mật |
| :--- | :---: | :---: | :--- |
| **Quản lý Năm học & Lớp học** | ✓ Cho phép | ✗ Ẩn hoàn toàn | Bảo vệ cấu trúc hệ thống |
| **Thêm, sửa, xóa hồ sơ học sinh** | ✓ Cho phép | ✗ Ẩn hoàn toàn | Bảo vệ thông tin cá nhân |
| **Xem số điện thoại, địa chỉ phụ huynh**| ✓ Cho phép | ✗ Ẩn hoàn toàn | Tuân thủ quyền riêng tư (Privacy) |
| **Thực hiện điểm danh & Chấm điểm thi đua**| ✓ Cho phép | ✗ Ẩn hoàn toàn | Chỉ giáo viên có quyền cho điểm |
| **Xem Lớp học trực tuyến tương tác** | ✓ Bảng điều khiển | ✓ Màn hình máy chiếu | Tự động đồng bộ 2 chiều |
| **Bốc thăm ngẫu nhiên, Bầu chọn** | ✓ Điều khiển vòng quay | ✓ Xem kết quả trúng | Trực quan, công bằng |
| **Xem Bảng Vàng vinh danh** | ✓ Phê duyệt & Chỉnh sửa | ✓ Trình chiếu Fullscreen | Tôn vinh trước tập thể |
| **Xem & Đổi quà trong Cửa hàng** | ✓ Xác nhận trừ kho | ✓ Xem danh mục quà | Khích lệ học tập |
| **Đánh giá học sinh theo TT22/TT27** | ✓ Nhập nhận xét, lưu sổ | ✗ Ẩn hoàn toàn | Nghiệp vụ nội bộ giáo viên |
| **Sao lưu & Khôi phục cơ sở dữ liệu** | ✓ Toàn quyền sao lưu | ✗ Ẩn hoàn toàn | Mã hóa mật khẩu bảo vệ |

---

## 2. Bốn Luồng Thao Tác Nghiệp Vụ Chính (Core User Flows)

### 2.1. Luồng Đầu Ngày: Điểm Danh & Khởi Động Tiết Học (Daily Morning Flow)
```mermaid
sequenceDiagram
    autonumber
    actor GV as Giáo viên Chủ nhiệm
    participant UI as Giao diện Web
    participant DB as IndexedDB

    GV->>UI: Mở ứng dụng (Dashboard)
    UI->>DB: Đọc hồ sơ GV & Lớp active
    UI-->>GV: Hiển thị Hero Salutation & Nút "Điểm danh hôm nay"
    GV->>UI: Bấm "Điểm danh hôm nay" (/attendance)
    UI->>DB: Tạo hoặc mở phiên điểm danh ngày
    GV->>UI: Chạm để đổi trạng thái HS vắng/trễ
    GV->>UI: Bấm "Khóa sổ điểm danh"
    UI->>DB: Cập nhật isLocked = true
    UI-->>GV: Toast: "Đã chốt sổ chuyên cần hôm nay"
```

### 2.2. Luồng Trong Tiết Học: Lớp Trực Tuyến & Chấm Điểm (Live Classroom & Scoring Flow)
```mermaid
sequenceDiagram
    autonumber
    actor GV as Giáo viên
    participant Web as Laptop GV (Active Page)
    participant Proj as Máy Chiếu (Present Page)
    participant Engine as Rank Promotion Engine
    participant DB as IndexedDB

    GV->>Web: Mở Lớp trực tuyến (/live-classroom/new)
    Web->>Proj: Đồng bộ mở tab máy chiếu qua BroadcastChannel
    GV->>Web: Bật công cụ "Bốc thăm ngẫu nhiên"
    Web->>Proj: Phát sóng sự kiện quay số + âm thanh Tick
    Web-->>GV: Trúng học sinh Nguyễn Văn A
    GV->>Web: Chấm +10đ "Phát biểu xuất sắc"
    Web->>DB: Ghi bản ghi PointEntry
    Web->>Engine: Kiểm tra ngưỡng thăng cấp
    Engine-->>Web: Học sinh A thăng cấp từ Binh nhì lên Binh nhất!
    Web->>Proj: Kích hoạt pháo hoa + âm thanh vinh danh + modal chúc mừng
```

### 2.3. Luồng Cuối Tuần: Xét Duyệt & Trình Chiếu Bảng Vàng (Weekly Honor Board Flow)
```mermaid
flowchart TD
    A[Mở Wizard Tạo Bảng Vàng] --> B[Chọn Kỳ xét: Tuần này & Chọn Lớp]
    B --> C[Bật/Tắt 8 Danh Hiệu Sư Phạm]
    C --> D[Chạy Rule Engine Tính Đề Xuất]
    D --> E{Có hòa điểm vượt chỉ tiêu?}
    E -- Có --> F[Mở TieResolutionModal: Chọn phương án xử lý]
    E -- Không --> G[Xem trước Bảng Vàng]
    F --> G
    G --> H[Bấm Công bố Bảng Vàng]
    H --> I[Chuyển sang Chế độ Trình chiếu Fullscreen cho Tiết Sinh Hoạt Lớp]
```

### 2.4. Luồng Cuối Kỳ: Đánh Giá TT22/TT27 & Xuất Học Bạ A4 (Term-End Evaluation Flow)
```mermaid
flowchart TD
    A[Truy cập Trang Đánh Giá /evaluations] --> B[Chọn Đợt đánh giá: Cuối Học Kỳ 1]
    B --> C[Nhập mức xếp loại 5 Phẩm chất & 3 Năng lực]
    C --> D[Sử dụng Drawer Gợi ý Mẫu Nhận xét Sư phạm]
    D --> E[Chạy Kiểm Tra Tính Hợp Lệ & Cảnh Báo Thiếu Sót]
    E --> F[Khóa Sổ Đánh Giá Kỳ Xét]
    F --> G[In Phiếu Nhận Xét Cá Nhân Chuẩn In Ấn A4 hoặc Xuất Excel]
```
