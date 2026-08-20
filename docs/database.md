# Sơ Đồ Cơ Sở Dữ Liệu IndexedDB (Dexie.js) - Hệ Thống Sổ Chủ Nhiệm Việt Offline

## Phiên bản Schema Dexie: `v5`

### 1. `liveClassSessions`
Bảng lưu trữ thông tin phiên học trực tuyến.
- `id`: string (Primary Key, UUID)
- `classId`: string (Indexed)
- `termId`: string | null
- `title`: string
- `subject`: string
- `sessionDate`: string (YYYY-MM-DD, Indexed)
- `meetingPlatform`: 'meet' | 'zoom' | 'teams' | 'other' | 'none'
- `meetingUrl`: string | null
- `status`: 'draft' | 'active' | 'paused' | 'completed' (Indexed)
- `startedAt`: string | null (ISO UTC)
- `pausedAt`: string | null (ISO UTC)
- `totalPausedMilliseconds`: number
- `endedAt`: string | null (ISO UTC)
- `presentationTheme`: string | null
- `createdAt`: string (ISO UTC)
- `updatedAt`: string (ISO UTC)

### 2. `liveClassParticipants`
Bảng lưu trữ danh sách học sinh tham gia phiên học.
- `id`: string (Primary Key, UUID)
- `sessionId`: string (Indexed)
- `studentId`: string (Indexed)
- Index duy nhất: `&[sessionId+studentId]`
- `attendanceStatus`: 'unchecked' | 'present' | 'late' | 'absent' | 'left'
- `participationCount`: number
- `randomSelectionCount`: number
- `handRaised`: boolean
- `handRaisedAt`: string | null (ISO UTC)
- `quickNote`: string | null
- `joinedAt`: string | null (ISO UTC)
- `leftAt`: string | null (ISO UTC)
- `createdAt`: string (ISO UTC)
- `updatedAt`: string (ISO UTC)

### 3. `liveClassGroups`
Bảng lưu trữ danh sách nhóm học tập trong phiên.
- `id`: string (Primary Key, UUID)
- `sessionId`: string (Indexed)
- `name`: string
- `color`: string | null
- `icon`: string | null
- `sortOrder`: number
- `createdAt`: string (ISO UTC)
- `updatedAt`: string (ISO UTC)

### 4. `liveClassGroupMembers`
Bảng thành viên trong nhóm.
- `id`: string (Primary Key, UUID)
- `groupId`: string (Indexed)
- `studentId`: string (Indexed)
- Index duy nhất: `&[groupId+studentId]`
- `createdAt`: string (ISO UTC)

### 5. `liveClassEvents`
Nhật ký sự kiện diễn ra trong phiên học.
- `id`: string (Primary Key, UUID)
- `sessionId`: string (Indexed)
- `studentId`: string | null (Indexed)
- `groupId`: string | null (Indexed)
- `eventType`: string (Indexed)
- `value`: string | number | boolean | null
- `metadata`: object | null
- `reversedEventId`: string | null
- `createdAt`: string (ISO UTC)

---

## Bổ sung Module "Cấp Bậc Thi Đua" (Emulation Rank System - Dexie v5)

### 6. `pointCategories` (Cập nhật)
Danh mục điểm thi đua.
- `id`: string (Primary Key)
- `name`: string
- `type`: 'Merit' | 'Demerit'
- `defaultPoints`: number
- `description`: string | null
- `countsTowardRank`: boolean (Mặc định `true` cho dữ liệu cũ qua migration v5)

### 7. `rankSystems`
Cấu hình hệ thống cấp bậc thi đua cho năm học/học kỳ.
- `id`: string (Primary Key, UUID)
- `name`: string
- `academicYearId`: string (Indexed)
- `termId`: string | null
- `calculationScope`: 'academic_year' | 'term' | 'all_time'
- `rankMode`: 'achievement' | 'dynamic'
- `celebrationEnabled`: boolean
- `presentationCelebrationEnabled`: boolean
- `isActive`: boolean (Indexed)
- Index kép: `[academicYearId+isActive]`
- `createdAt`: string (ISO UTC)
- `updatedAt`: string (ISO UTC)

### 8. `rankSystemClasses`
Phạm vi lớp học áp dụng hệ thống cấp bậc thi đua.
- `id`: string (Primary Key, UUID)
- `rankSystemId`: string
- `classId`: string
- Index duy nhất: `&[rankSystemId+classId]`
- `createdAt`: string (ISO UTC)

### 9. `rankLevels`
Định nghĩa 17 cấp bậc thi đua (từ Binh nhì 0đ đến Đại tướng 800đ).
- `id`: string (Primary Key, UUID)
- `rankSystemId`: string
- `level`: number (1 đến 17)
- `code`: string (binh_nhi, binh_nhat, ha_si...)
- `name`: string
- `group`: 'Hạ sĩ quan và Binh sĩ' | 'Cấp Úy' | 'Cấp Tá' | 'Cấp Tướng'
- `minPoints`: number
- `colorToken`: string
- `badgeKey`: string
- `description`: string
- Index duy nhất: `&[rankSystemId+level]`
- Index duy nhất: `&[rankSystemId+code]`
- `createdAt`: string (ISO UTC)
- `updatedAt`: string (ISO UTC)

### 10. `studentRankHistory`
Lịch sử thăng/hạ cấp bậc thi đua của học sinh.
- `id`: string (Primary Key, UUID)
- `rankSystemId`: string (Indexed)
- `classId`: string (Indexed)
- `studentId`: string (Indexed)
- `fromLevel`: number | null
- `toLevel`: number
- `pointsBefore`: number
- `pointsAfter`: number
- `changeType`: 'promotion' | 'demotion' | 'recalculated'
- `sourcePointEntryId`: string | null
- `reason`: string | null
- Index kép: `[studentId+createdAt]`
- `createdAt`: string (ISO UTC)
