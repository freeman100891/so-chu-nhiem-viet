# Định Dạng Định Kỳ Backup Dữ Liệu (.gvcn-backup / .json)

## 1. Cấu Trúc File Backup Toàn Phần
File backup được tạo bởi tính năng Sao lưu hệ thống đóng gói toàn bộ 27 bảng cơ sở dữ liệu IndexedDB (Dexie.js) với mã băm kiểm tra toàn vẹn SHA-256:

```json
{
  "manifest": {
    "appName": "Sổ Chủ Nhiệm Việt Offline",
    "appVersion": "1.0.0",
    "schemaVersion": 6,
    "createdAt": "2026-08-14T16:20:00.000Z",
    "isEncrypted": false,
    "tables": [
      "academicYears",
      "terms",
      "classes",
      "classEnrollments",
      "students",
      "studentProfiles",
      "parentContacts",
      "studentNotes",
      "parentInteractions",
      "evaluations",
      "pointCategories",
      "pointEntries",
      "attendanceSessions",
      "attendanceRecords",
      "settings",
      "auditLogs",
      "trashItems",
      "backupHistory",
      "liveClassSessions",
      "liveClassParticipants",
      "liveClassGroups",
      "liveClassGroupMembers",
      "liveClassEvents",
      "rankSystems",
      "rankSystemClasses",
      "rankLevels",
      "studentRankHistory"
    ],
    "counts": {
      "classes": 3,
      "students": 150,
      "rankSystems": 1,
      "rankLevels": 17,
      "studentRankHistory": 42
    }
  },
  "data": {
    "academicYears": [],
    "classes": [],
    "students": [],
    "pointCategories": [],
    "pointEntries": [],
    "rankSystems": [],
    "rankSystemClasses": [],
    "rankLevels": [],
    "studentRankHistory": []
  },
  "checksum": "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0"
}
```

---

## 2. Quy Trình Khôi Phục & Tương Thích Ngược (Backward Compatibility)
Khi người dùng khôi phục file sao lưu:
1. **Kiểm tra tính toàn vẹn Checksum:** Xác thực mã băm SHA-256 để phát hiện file bị chỉnh sửa trái phép hoặc lỗi mạng.
2. **Auto Pre-Restore Backup & Transaction Rollback:** Tự động tạo bản sao lưu RAM trước khi thực thi khôi phục. Nếu có bất kỳ lỗi nào, hệ thống tự động hoàn tác (rollback) 100% dữ liệu gốc.
3. **Xử lý File Backup Cũ (Legacy Files):**
   - Nếu file backup cũ chưa có bảng `rankSystems` hoặc `rankLevels`, hệ thống tự động chạy quy trình `seedDefaultRankSystem` cho tất cả năm học hiện có, thiết lập đủ 17 cấp bậc theo tiêu chuẩn.
   - Bổ sung giá trị mặc định `countsTowardRank = true` cho các danh mục điểm cũ thiếu trường này.
4. **Bảo tồn lịch sử thăng cấp:** Giữ nguyên vẹn toàn bộ các bản ghi `studentRankHistory`.
