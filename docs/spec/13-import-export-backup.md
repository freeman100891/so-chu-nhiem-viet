# ĐẶC TẢ CHI TIẾT: NHẬP XUẤT DỮ LIỆU, SAO LƯU & BẢO TRÌ (F-080 -> F-082)
> Mã tài liệu: `SPEC-13-IMPORT-EXPORT-BACKUP`  
> Phân hệ: ExcelJS Engine, Sao Lưu Mã Hóa AES-GCM, Thùng Rác & Nhật Ký Kiểm Toán  

---

## F-080 & F-081 — Nhập/Xuất File Excel (.xlsx) Qua ExcelJS

### 1. Mục đích
Hỗ trợ giáo viên nhập nhanh danh sách học sinh từ file Excel của nhà trường (SMAS, VnEdu, CSDL ngành) và xuất sổ điểm danh, sổ thi đua ra file Excel định dạng chuẩn để in ấn hoặc báo cáo Ban Giám Hiệu.

### 2. Import Danh Sách Học Sinh Từ Excel (`excel.service.ts`)
- **Tải file mẫu chuẩn**: Cung cấp file `Mau_Nhap_Hoc_Sinh.xlsx` với các cột: STT, Mã học sinh, Họ và tên, Ngày sinh, Giới tính, Tên phụ huynh, Số điện thoại phụ huynh, Địa chỉ.
- **Thuật toán ánh xạ cột thông minh (Column Mapping)**:
  - Tự động nhận diện header tiếng Việt có dấu/không dấu (vd: `Họ và tên`, `Họ tên`, `Họ và tên học sinh`, `Full Name`).
  - Hỗ trợ định dạng ngày tháng đa dạng: `DD/MM/YYYY`, `YYYY-MM-DD`, Excel Serial Date.
- **Xử lý ngoại lệ & Validation**:
  - Bỏ qua các dòng trống.
  - Tự động chuẩn hóa họ tên bằng `normalizeVietnamese`.
  - Cảnh báo dòng lỗi (sai ngày sinh, trùng mã học sinh) mà vẫn cho phép import các dòng hợp lệ.
  - Giao dịch an toàn `db.runTransaction` đảm bảo không phát sinh dữ liệu rác nếu quá trình import bị hủy.

### 3. Export Báo Cáo & Sổ Điểm Ra Excel
- Sử dụng thư viện `exceljs` để tạo file `.xlsx` nguyên bản:
  - Định dạng font chữ `Times New Roman` / `Arial`, kích thước, màu sắc header.
  - Tự động tính toán độ rộng cột (Auto column width).
  - Khung viền bảng (Borders) và công thức tính tổng điểm tự động.

---

## F-082 — Sao Lưu Mã Hóa & Khôi Phục Cơ Sở Dữ Liệu (.gvcn-backup)

### 1. Định Dạng Tệp Sao Lưu Chuẩn
Tệp sao lưu có phần mở rộng `.gvcn-backup`, cấu trúc JSON chứa toàn bộ dữ liệu của 30 bảng IndexedDB kèm chữ ký số toàn vẹn:
```typescript
export interface BackupFileStructure {
  formatVersion: '1.0' | '2.0';
  systemVersion: string;
  createdAt: string;
  checksum: string; // SHA-256 Hash
  tables: {
    teacherProfiles: TeacherProfile[];
    academicYears: AcademicYear[];
    terms: Term[];
    classes: ClassRoom[];
    students: Student[];
    classEnrollments: ClassEnrollment[];
    pointEntries: PointEntry[];
    attendanceRecords: AttendanceRecord[];
    // ... toàn bộ 30 bảng
  };
}
```

### 2. Mã Hóa An Toàn Web Crypto API (AES-GCM 256-bit)
- Giáo viên có thể thiết lập mật khẩu bảo vệ khi xuất file sao lưu.
- Khóa mã hóa được sinh bằng thuật toán `PBKDF2` từ mật khẩu của giáo viên (100.000 vòng lặp) và mã hóa dữ liệu qua thuật toán `AES-GCM 256-bit`.
- Nếu không có mật khẩu đúng, không ai có thể mở hay xem được thông tin học sinh trong tệp sao lưu.

### 3. Hai Chế Độ Khôi Phục (Restore Mode)
1. **Khôi phục Ghi đè (Overwrite / Clean Restore)**: Xóa sạch dữ liệu hiện tại trong trình duyệt và nạp toàn bộ dữ liệu từ tệp sao lưu.
2. **Khôi phục Hợp nhất (Merge Restore)**: Giữ nguyên dữ liệu hiện tại, chỉ bổ sung các bản ghi mới từ tệp sao lưu (dựa trên so khớp khóa chính ID).

---

## Thùng Rác Hệ Thống (Trash Bin) & Nhật Ký Kiểm Toán (Audit Logs)

### 1. Cơ Chế Xóa Mềm An Toàn (Soft Delete)
- Toàn bộ thao tác xóa học sinh, xóa lớp học, xóa danh hiệu, xóa tiêu chí đều là **Soft Delete** (`deletedAt = new Date().toISOString()`).
- Dữ liệu bị xóa được chuyển vào **Thùng Rác (`/trash`)**.
- Giáo viên có thể xem danh sách các mục đã xóa và chọn:
  - **Khôi phục (Restore)**: Đặt lại `deletedAt = null` $\rightarrow$ Học sinh/dữ liệu xuất hiện trở lại bình thường.
  - **Dọn sạch vĩnh viễn (Permanent Delete)**: Xóa vật lý khỏi IndexedDB khi cần giải phóng dung lượng.

### 2. Nhật Ký Kiểm Toán (Audit Logs — `/audit-logs`)
- Mọi thao tác trọng yếu (Tạo học sinh, Sửa điểm, Đổi avatar, Khóa sổ điểm danh, Khôi phục DB) đều được tự động ghi lại trong bảng `auditLogs`.
- Gồm các thông tin: Thời điểm thao tác, Tên thực thể, ID bản ghi, Hành động (CREATE, UPDATE, DELETE, UNDO), Giá trị trước/sau khi đổi.
