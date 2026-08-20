# ĐẶC TẢ CHI TIẾT: HỆ THỐNG CẤP BẬC QUÂN HÀM & VINH DANH (F-037 -> F-043)
> Mã tài liệu: `SPEC-07-RANK-SYSTEM`  
> Phân hệ: 17 Cấp bậc Quân hàm Đội viên, Anti-Demotion, Hàng đợi Chúc mừng & Vinh danh  

---

## F-037 — Hệ Thống 17 Cấp Bậc Quân Hàm Đội Viên

### 1. Mục đích
Tạo động lực thi đua học tập và rèn luyện thông qua hành trình thăng tiến quân hàm quen thuộc, giàu tính kỷ luật và tự hào thiếu nhi Việt Nam.

### 2. Danh Sách 17 Cấp Bậc Chuẩn

| Cấp | Mã Code | Tên Cấp Bậc | Phân Nhóm Quân Hàm | Ngưỡng Điểm | Mã Màu | Huy Hiệu |
| :---: | :--- | :--- | :--- | :---: | :--- | :--- |
| **1** | `binh_nhi` | **Binh nhì** | Hạ sĩ quan & Binh sĩ | $0$ | `bronze-1` | 1 vạch đồng |
| **2** | `binh_nhat` | **Binh nhất** | Hạ sĩ quan & Binh sĩ | $50$ | `bronze-2` | 2 vạch đồng |
| **3** | `ha_si` | **Hạ sĩ** | Hạ sĩ quan & Binh sĩ | $100$ | `silver-1` | 1 vạch bạc |
| **4** | `trung_si` | **Trung sĩ** | Hạ sĩ quan & Binh sĩ | $150$ | `silver-2` | 2 vạch bạc |
| **5** | `thuong_si` | **Thượng sĩ** | Hạ sĩ quan & Binh sĩ | $200$ | `silver-3` | 3 vạch bạc |
| **6** | `thieu_uy` | **Thiếu úy** | Cấp Úy | $250$ | `blue-1` | 1 sao bạc + 1 vạch |
| **7** | `trung_uy` | **Trung úy** | Cấp Úy | $300$ | `blue-2` | 2 sao bạc + 1 vạch |
| **8** | `thuong_uy` | **Thượng úy** | Cấp Úy | $350$ | `blue-3` | 3 sao bạc + 1 vạch |
| **9** | `dai_uy` | **Đại úy** | Cấp Úy | $400$ | `indigo-4` | 4 sao bạc + 1 vạch |
| **10** | `thieu_ta` | **Thiếu tá** | Cấp Tá | $450$ | `amber-1` | 1 sao vàng + 2 vạch |
| **11** | `trung_ta` | **Trung tá** | Cấp Tá | $500$ | `amber-2` | 2 sao vàng + 2 vạch |
| **12** | `thuong_ta` | **Thượng tá** | Cấp Tá | $550$ | `yellow-3` | 3 sao vàng + 2 vạch |
| **13** | `dai_ta` | **Đại tá** | Cấp Tá | $600$ | `yellow-4` | 4 sao vàng + 2 vạch |
| **14** | `thieu_tuong`| **Thiếu tướng** | Cấp Tướng | $650$ | `purple-1` | 1 sao bạch kim lớn |
| **15** | `trung_tuong`| **Trung tướng** | Cấp Tướng | $700$ | `purple-2` | 2 sao bạch kim lớn |
| **16** | `thuong_tuong`|**Thượng tướng** | Cấp Tướng | $750$ | `rose-3` | 3 sao bạch kim lớn |
| **17** | `dai_tuong` | **Đại tướng** | Cấp Tướng | $800$ | `rainbow-4`| 4 sao ngũ sắc thần thoại |

---

## F-038 — Thuật Toán Tính Cấp Bậc Tự Động & Chống Giáng Cấp (Achievement Mode)

### 1. Nguyên Tắc Sư Phạm "Anti-Demotion"
- Trong tâm lý học giáo dục phổ thông, việc tụt cấp quân hàm khi bị trừ điểm kỷ luật sẽ gây tâm lý tiêu cực, bất mãn và chán nản ở học sinh.
- Do đó, hệ thống mặc định áp dụng chế độ **Achievement Mode**:
  - Cấp bậc quân hàm được tính dựa trên **Tổng điểm tích lũy thành tích (Gross Merit Points)** của học sinh.
  - Điểm trừ nề nếp chỉ làm giảm Số dư điểm đổi thưởng (Net Points) chứ **không bao giờ làm giáng cấp bậc quân hàm hay cấp bậc Avatar** đã đạt được của học sinh.

### 2. Thuật toán `RankCalculationService`
```typescript
export function calculateStudentRank(
  grossPoints: number,
  levels: RankLevel[]
): RankLevel {
  const sorted = [...levels].sort((a, b) => a.level - b.level);
  let currentRank = sorted[0];
  for (const level of sorted) {
    if (grossPoints >= level.minPoints) {
      currentRank = level;
    } else {
      break;
    }
  }
  return currentRank;
}
```

---

## F-040 -> F-042 — Phát Hiện Thăng Cấp, Hàng Đợi & Modal Chúc Mừng Pháo Hoa

### 1. Phát Hiện Thăng Cấp Thời Gian Thực (Level Transition Detector)
- Khi giáo viên cộng điểm, `rank-promotion.service.ts` so sánh cấp bậc cũ và cấp bậc mới của học sinh.
- Nếu `newLevel > oldLevel`:
  - Tạo bản ghi sự kiện `RankPromotionEvent` và `LevelUpCelebrationEvent` trong IndexedDB.
  - Tạo mã khóa duy nhất `dedupeKey: ${classId}_${studentId}_${newLevel}_${sourcePointEntryId}` để chống trùng lặp sự kiện khi click nhanh nhiều lần.

### 2. Hàng Đợi Chúc Mừng Thăng Cấp (LevelUpQueueBar)
- Trong tiết học trực tuyến (`/live-classroom/:sessionId`), thanh `LevelUpQueueBar` gắn ở góc trên cùng hiển thị số lượng học sinh vừa thăng cấp.
- Giáo viên có thể bấm "Vinh danh từng em" hoặc "Vinh danh tất cả".

### 3. Modal Vinh Danh (PromotionCelebrationModal)
- Hiển thị hiệu ứng pháo hoa rực rỡ (`canvas-confetti`).
- Âm thanh kèn chiến thắng (`sound.ts -> playLevelUpSound()`).
- Hiển thị Avatar tiến hóa mới của học sinh, tên cấp bậc cũ $\rightarrow$ cấp bậc mới và lời chúc mừng khích lệ của giáo viên.
