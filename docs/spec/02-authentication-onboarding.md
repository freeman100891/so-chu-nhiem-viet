# ĐẶC TẢ CHI TIẾT: ONBOARDING & HỒ SƠ GIÁO VIÊN (F-001 -> F-005)
> Mã tài liệu: `SPEC-02-ONBOARDING`  
> Phân hệ: Hồ sơ giáo viên & Thiết lập ban đầu  

---

## F-001 — Khởi tạo Hồ Sơ Giáo Viên Ban Đầu

### 1. Mục đích
Cho phép giáo viên lần đầu tiên truy cập ứng dụng khai báo thông tin cá nhân cơ bản (họ tên, danh xưng, trường học, tổ bộ môn, số điện thoại, avatar) để cá nhân hóa toàn bộ giao diện và các mẫu xuất báo cáo in ấn.

### 2. Người sử dụng
Giáo viên Chủ nhiệm (Chạy trong phiên đầu tiên khi chưa có hồ sơ trong database).

### 3. Vị trí
- Route: `/onboarding`
- Component: `src/modules/onboarding/OnboardingWizard.tsx` -> Step 1 (Thông tin giáo viên)

### 4. Điều kiện sử dụng
- Bảng `settings.isOnboardingCompleted === false` hoặc chưa tồn tại bản ghi trong `teacherProfiles`.

### 5. Luồng thao tác
1. Người dùng truy cập bất kỳ trang nào của ứng dụng.
2. Hook `useOnboardingCheck` kiểm tra thấy chưa hoàn tất onboarding $\rightarrow$ Điều hướng tự động về `/onboarding`.
3. Người dùng nhập: Danh xưng (Thầy/Cô), Họ và tên giáo viên, Tên trường học, Tổ chuyên môn, Số điện thoại.
4. Người dùng chọn hoặc tải lên ảnh đại diện cá nhân (hỗ trợ Avatar vector có sẵn hoặc ảnh upload từ máy).
5. Người dùng nhấn nút "Tiếp tục" $\rightarrow$ Hệ thống validate dữ liệu và chuyển sang Step 2 (Thiết lập lớp).

### 6. Input
- `salutation`: string ('Thầy' | 'Cô')
- `fullName`: string (tối thiểu 2 ký tự)
- `schoolName`: string (tên trường)
- `department`: string (tổ bộ môn)
- `phone`: string (tùy chọn)
- `avatar`: string (base64 data URL hoặc URL ảnh)

### 7. Validation
- `fullName`: Bắt buộc, không được để trống, độ dài từ 2 đến 100 ký tự.
- `salutation`: Bắt buộc chọn giá trị hợp lệ.
- `schoolName`: Bắt buộc, không được để trống.
- `avatar`: Dung lượng ảnh upload tối đa 2MB (tự động nén qua `image.ts`).

### 8. Logic nghiệp vụ
- Khởi tạo ID duy nhất `crypto.randomUUID()` cho bản ghi `teacherProfiles`.
- Ghi đè hoặc tạo mới cài đặt hệ thống với ID cố định `'default-settings'`.

### 9. Output
Bản ghi hồ sơ giáo viên được lưu vào cơ sở dữ liệu IndexedDB.

### 10. Dữ liệu bị thay đổi
- Table: `teacherProfiles` (Thêm 1 bản ghi mới)
- Table: `settings` (Cập nhật `updatedAt`)

### 11. Dữ liệu được lưu ở đâu
IndexedDB: Table `teacherProfiles` và `settings`.

### 12. Component liên quan
- `src/modules/onboarding/OnboardingWizard.tsx`
- `src/core/repositories/teacher-profile.repository.ts`
- `src/shared/utilities/image.ts`

### 13. Trạng thái giao diện
`Default`, `Validating`, `Error` (khi để trống họ tên), `Processing`.

### 14. Thông báo
Toast thông báo lỗi nếu để trống thông tin bắt buộc.

### 15. Edge Cases
- Người dùng tải ảnh kích thước rất lớn (>10MB): Tiện ích `resizeAndCompressImage` trong `image.ts` tự động nén về kích thước tiêu chuẩn (max 400x400px) để không làm phình dung lượng IndexedDB.
- Người dùng gõ tên có khoảng trắng thừa: Tự động `trim()` chuẩn hóa.

### 16. Acceptance Criteria
```gherkin
GIVEN người dùng lần đầu mở ứng dụng
WHEN hoàn tất nhập họ tên "Nguyễn Thị Tuyết" và chọn danh xưng "Cô"
THEN bản ghi được lưu vào IndexedDB
AND hệ thống chuyển tiếp sang bước thiết lập năm học & lớp học.
```

---

## F-002 — Thiết Lập Năm Học & Lớp Học Đầu Tiên

### 1. Mục đích
Tạo sẵn năm học hiện tại, 2 học kỳ (HK1, HK2) và lớp chủ nhiệm đầu tiên để giáo viên có thể sử dụng ngay các tính năng điểm danh, thi đua mà không cần cấu hình phức tạp.

### 2. Người sử dụng
Giáo viên Chủ nhiệm.

### 3. Vị trí
- Route: `/onboarding`
- Component: `src/modules/onboarding/OnboardingWizard.tsx` -> Step 2 & Step 3.

### 4. Luồng thao tác
1. Hệ thống tự động gợi ý Năm học hiện tại (ví dụ: `2026 - 2027`) với khoảng thời gian từ tháng 9 đến tháng 5 năm sau.
2. Hệ thống tạo sẵn 2 học kỳ chuẩn:
   - Học kỳ 1: `05/09/2026` đến `15/01/2027`
   - Học kỳ 2: `16/01/2027` đến `31/05/2027`
3. Giáo viên chọn Khối lớp (Khối 1 -> Khối 12) và nhập Tên lớp (ví dụ: `1A1`).
4. Giáo viên có thể nhập nhanh danh sách học sinh ban đầu hoặc bấm "Hoàn tất để vào Dashboard".
5. Hệ thống kích hoạt trạng thái `isOnboardingCompleted: true`.

### 5. Dữ liệu bị thay đổi
- `academicYears`: Thêm 1 bản ghi năm học active.
- `terms`: Thêm 2 bản ghi học kỳ.
- `classes`: Thêm 1 bản ghi lớp học active.
- `settings`: Cập nhật `isOnboardingCompleted = true`, `activeAcademicYearId`, `activeClassId`.

---

## F-003 — Kiểm Tra Onboarding & Điều Hướng Bắt Buộc

### 1. Mục đích
Bảo vệ tính toàn vẹn dữ liệu: Đảm bảo người dùng không thể truy cập các trang chức năng (Điểm danh, Thi đua, Lớp trực tuyến...) khi chưa có dữ liệu cơ bản về năm học và lớp học.

### 2. Logic nghiệp vụ
- Hook `useOnboardingCheck` chạy mỗi khi route thay đổi trong `AppLayout`.
- Kiểm tra `settings.isOnboardingCompleted`. Nếu `false`, sử dụng `navigate('/onboarding', { replace: true })`.

---

## F-004 & F-005 — Cập Nhật Hồ Sơ, Avatar & Danh Xưng Giáo Viên

### 1. Vị trí
- Route: `/settings` (Tab Hồ Sơ Giáo Viên)
- Component: `src/modules/settings/SettingsPage.tsx`

### 2. Tính năng nổi bật
- Cho phép giáo viên thay đổi Avatar cá nhân bất kỳ lúc nào: Chọn từ thư viện 31+ Avatar vector, chọn từ bộ Avatar tùy chỉnh, hoặc upload ảnh thẻ thực tế.
- Tự động đồng bộ ngay lập tức lên Hero Card ở Dashboard ([DashboardHero.tsx](file:///d:/02.Code/03.Edu/New%20folder/GVCN/src/modules/dashboard/components/DashboardHero.tsx)) và thanh Header ứng dụng.

---

## F-083 — Khôi Phục Toàn Bộ Hệ Thống Từ Bản Sao Lưu Tại Onboarding

### 1. Mục đích
Cung cấp phương thức khởi tạo hệ thống linh hoạt ngay tại bước đầu tiên của màn hình Onboarding: Cho phép giáo viên khôi phục toàn bộ dữ liệu từ tệp sao lưu `.gvcn-backup` có sẵn (chuyển máy, cài lại app, khôi phục sau sự cố) mà không cần phải thực hiện lại quy trình tạo hồ sơ, năm học, lớp học mới từ đầu.

### 2. Người sử dụng
Giáo viên Chủ nhiệm đã có file sao lưu `.gvcn-backup`.

### 3. Vị trí
- Route: `/onboarding` (Màn hình khởi đầu Step 1 - Dual Choices)
- Component: `src/modules/onboarding/OnboardingWizard.tsx`, `src/modules/onboarding/OnboardingRestoreModal.tsx`
- Service: `src/core/backup/backup.service.ts`

### 4. Điều kiện sử dụng
Hệ thống chưa có hồ sơ giáo viên hoặc người dùng muốn bắt đầu bằng cách nạp bản sao lưu.

### 5. Luồng thao tác (User Flow)
```text
Truy cập Onboarding (Bước 1)
        ↓
Hiển thị 2 lựa chọn cấp 1: [ Thiết lập mới từ đầu ] HOẶC [ Khôi phục từ bản sao lưu ]
        ↓
Chọn "Khôi phục từ bản sao lưu" → Mở OnboardingRestoreModal
        ↓
Chọn file .gvcn-backup từ thiết bị
        ↓
Kiểm tra cấu trúc file, giải mã mật khẩu (nếu có) & xác thực Checksum SHA-256
        ↓
Hiển thị Preview Metadata (Giáo viên, Năm học, Số lớp, Số học sinh, Ngày sao lưu)
        ↓
Người dùng xác nhận "Bắt đầu Khôi phục Dữ liệu"
        ↓
Chạy Dexie Transaction + Auto Pre-Restore Backup Rollback Layer
        ↓
Đồng bộ Settings (isOnboardingCompleted: true) & Áp dụng Theme giao diện
        ↓
Hiển thị màn hình Khôi Phục Thành Công → Bấm [ Vào Trang Chủ ] → Điều hướng /dashboard
```

### 6. Input
- File sao lưu `*.gvcn-backup` hoặc `*.json`.
- Mật khẩu giải mã (nếu tệp được mã hóa AES-GCM 256-bit).

### 7. Validation
- Kiểm tra định dạng JSON, sự tồn tại của `manifest` và `data`.
- Kiểm tra chữ ký băm toàn vẹn `checksum` SHA-256.
- Kiểm tra phiên bản Schema: Nếu `manifest.schemaVersion > db.verno` $\rightarrow$ Từ chối và hiển thị thông báo yêu cầu cập nhật ứng dụng.
- Kiểm tra Zod schema (`BackupFileContentSchema`).

### 8. Logic nghiệp vụ & Transaction
- Ghi đè cơ sở dữ liệu bên trong Dexie ACID Transaction `db.runTransaction`.
- Tự động chạy backward-compatibility migrations (tạo cấp bậc mặc định, bổ sung `countsTowardRank`, seed mẫu nhận xét sư phạm, seed danh hiệu bảng vàng).
- Tự động cập nhật `settings.isOnboardingCompleted = true` và kích hoạt theme giao diện.
- Tự động ghi nhận `auditLogs` với `action: 'SYSTEM_RESTORE'`.
- Suppress toàn bộ các thông báo, modal chúc mừng thăng cấp hay âm thanh lịch sử cũ.

### 9. Output
Toàn bộ 30 bảng IndexedDB được phục hồi nguyên vẹn; ứng dụng chuyển thẳng sang Dashboard.

### 10. Dữ liệu bị thay đổi
Toàn bộ các bảng trong `SoChuNhiemVietOfflineDB`.

### 11. Dữ liệu được lưu ở đâu
IndexedDB (`SoChuNhiemVietOfflineDB`) + LocalStorage (Theme & UI Scale).

### 12. Acceptance Criteria
```gherkin
GIVEN người dùng mở ứng dụng lần đầu khi chưa có dữ liệu
WHEN nhìn thấy màn hình Onboarding Step 1
THEN hệ thống phải hiển thị 2 lựa chọn bình đẳng: "Thiết lập mới từ đầu" và "Khôi phục từ bản sao lưu"
AND khi chọn file .gvcn-backup hợp lệ, hệ thống phải preview thông tin trước khi khôi phục
AND khi khôi phục thành công, người dùng được đưa thẳng tới Dashboard mà không phải chạy lại Onboarding.
```
