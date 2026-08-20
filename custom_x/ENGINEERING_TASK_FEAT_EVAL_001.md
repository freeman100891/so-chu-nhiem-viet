# ENGINEERING TASK PROMPT — FEAT-EVAL-001

## Tên task

Triển khai Sổ Nhận Xét và Đánh Giá Học Sinh theo Thông tư 27/2020/TT-BGDĐT và Thông tư 22/2021/TT-BGDĐT.

## ROLE

Bạn là Senior Full-Stack Product Engineer, Software Architect, Database Engineer, UI/UX Engineer, Security Reviewer và QA Engineer phụ trách triển khai tính năng vào một dự án đang hoạt động.

Bạn phải khảo sát codebase trước khi sửa, giữ nguyên kiến trúc hiện tại, triển khai production-oriented, bảo toàn dữ liệu cũ và cung cấp bằng chứng test/build thực tế.

Không chỉ dựng giao diện. Task phải bao phủ schema, migration, repository, service, UI, validation, audit, backup/restore, test và tài liệu.

## PROJECT CONTEXT

Dự án: **Sổ Chủ Nhiệm Việt Offline**.

Đặc điểm đã biết từ tài liệu dự án:

- React 19, TypeScript, Vite, Tailwind CSS.
- PWA offline-first, không có backend server tập trung.
- IndexedDB qua Dexie.js; toàn bộ nghiệp vụ và dữ liệu chạy cục bộ.
- Có transaction, soft delete, audit log, backup/restore, Excel import/export.
- Có các module học sinh, lớp học, năm học, học kỳ, chuyên cần, thi đua, báo cáo và hồ sơ học sinh.
- Chính sách mặc định: không telemetry, không gửi dữ liệu học sinh ra Internet.
- Feature cần triển khai có ID cố định: `FEAT-EVAL-001`.

Nguồn ngữ cảnh bắt buộc phải đọc trước khi code:

1. `docs/PROJECT_FEATURES.md`, đặc biệt mục `FEAT-EVAL-001` phiên bản mới nhất.
2. `AGENTS.md`, `README.md` và mọi file hướng dẫn trong repository.
3. Database schema/migration hiện tại.
4. Type/model `Evaluation` hiện tại.
5. `EvaluationsPage`, `evaluationRepository`, backup schema và test setup.

Nếu code hiện tại khác tài liệu, coi code đang chạy là hiện trạng kỹ thuật, ghi lại mâu thuẫn và điều chỉnh kế hoạch an toàn. Không âm thầm giả định tài liệu luôn đúng.

## LEGAL REFERENCE

Áp dụng đúng hai profile sau:

- Tiểu học: `27/2020/TT-BGDĐT` — [thuộc tính văn bản](https://vanban.chinhphu.vn/default.aspx?docid=201006&pageid=27160), [PDF chính thức](https://datafiles.chinhphu.vn/cpp/files/vbpq/2020/09/27-bgddt.signed.pdf).
- THCS/THPT: `22/2021/TT-BGDĐT` — [thuộc tính văn bản](https://vanban.chinhphu.vn/?docid=203926&pageid=27160), [PDF chính thức](https://datafiles.chinhphu.vn/cpp/files/vbpq/2021/08/22.signed_02.pdf).

Không tuyên bố các câu do phần mềm sinh ra là “mẫu nhận xét chính thức của Bộ GD&ĐT”. Hai Thông tư quy định nội dung, hình thức, thang mức và hồ sơ đánh giá; thư viện câu trong sản phẩm chỉ là công cụ soạn thảo có thể chỉnh sửa.

Nếu phát hiện văn bản chính thức đã thay đổi hoặc có văn bản thay thế, dừng phần mapping pháp lý, báo blocker và không tự diễn giải quy định mới.

## CURRENT STATE

Trạng thái tài liệu hiện tại:

- `FEAT-EVAL-001`: `PLANNED_ONLY`.
- Test status: `NO_TEST_FOUND`.
- Route `/evaluations` được mô tả là placeholder.
- Bảng `evaluations` và `evaluationRepository` được mô tả là nền ban đầu.
- Chưa có bằng chứng về schema chi tiết, migration hoàn chỉnh, template catalog, rule engine, export hoặc test của tính năng.

Không được coi bất kỳ file, field hoặc Dexie version dự kiến nào trong prompt này là chắc chắn tồn tại. Phải xác minh trong repository.

## DISCOVERY CHECKPOINT — BẮT BUỘC TRƯỚC KHI SỬA

Thực hiện read-only audit và ghi lại ngắn gọn:

1. Dexie schema version hiện tại và toàn bộ definition của bảng `evaluations`.
2. Type/interface/model và validation schema liên quan đến đánh giá.
3. Route, page, menu và component hiện có của `/evaluations`.
4. Repository/service hiện có và cách project tổ chức transaction/audit.
5. Cách xác định active academic year, class, grade, term và enrollment.
6. Backup export/import schema và vị trí cần cập nhật nếu thêm bảng/field.
7. Excel/print utilities có thể tái sử dụng.
8. Test runner, test helpers, fake IndexedDB và số test baseline đang pass.
9. Các thay đổi chưa commit hoặc code người dùng đang sửa có thể xung đột.

Sau discovery:

- Nếu có blocker làm thay đổi kiến trúc hoặc có nguy cơ mất dữ liệu, dừng và báo rõ.
- Nếu không có blocker, tiếp tục triển khai theo các phase bên dưới.
- Không refactor code không liên quan chỉ để phù hợp với thiết kế dự kiến.

## OBJECTIVE

Xây dựng hoàn chỉnh module `/evaluations` để giáo viên có thể:

1. Chọn năm học, lớp và kỳ đánh giá.
2. Tự động nhận đúng profile TT27 hoặc TT22/2021 theo khối lớp.
3. Nhập mức đánh giá và nhận xét theo đúng cấu trúc của từng cấp học.
4. Viết tay, chọn mẫu, ghép đoạn hoặc lưu mẫu cá nhân.
5. Nhận gợi ý từ dữ liệu cục bộ kèm minh chứng có thể kiểm tra.
6. Lưu draft, rà soát lỗi/cảnh báo, khóa và mở khóa có audit.
7. Xuất dữ liệu hỗ trợ Excel/in A4 mà không làm lẫn lớp hoặc kỳ.
8. Hoạt động hoàn toàn offline và bảo vệ dữ liệu cá nhân học sinh.

Giáo viên luôn là người chọn mức và duyệt nội dung cuối. Hệ thống không tự xếp loại chính thức, tự ký, tự khóa hoặc tự công bố.

## SCOPE AND PRIORITY

### MUST HAVE

- Profile TT27/2020 cho lớp 1–5.
- Profile TT22/2021 cho lớp 6–9 và lớp 10–12.
- Schema/migration an toàn, repository và service type-safe.
- Sổ lớp, form theo profile, draft/autosave, review, finalize/unlock và audit.
- Thư viện mẫu hệ thống tối thiểu và mẫu cá nhân.
- Validation thang mức, token, scope, trạng thái và XSS.
- Backup/restore tương thích với schema mới.
- Unit, integration và UI tests cho core workflow.
- Cập nhật `docs/PROJECT_FEATURES.md` theo implementation thực tế.

### SHOULD HAVE

- Gợi ý nhận xét từ dữ liệu cục bộ với traceable evidence.
- Sao chép kỳ trước hoặc áp dụng mẫu hàng loạt dưới dạng draft.
- Cảnh báo nhận xét trùng hàng loạt hoặc từ ngữ dễ gây tổn thương.
- Xuất Excel và bản in A4 hỗ trợ nhập liệu.
- Keyboard workflow và hiệu năng ổn định với lớp 50 học sinh.

### OUT OF SCOPE

- Backend server hoặc REST API mới.
- Đăng nhập/multi-user/RBAC mới.
- Dịch vụ AI qua mạng, LLM hoặc telemetry.
- Chữ ký số, nộp hồ sơ trực tiếp lên hệ thống của Bộ/Sở/Trường.
- Tự động quyết định mức đánh giá chính thức.
- Thay thế toàn bộ hệ thống điểm/học bạ của nhà trường.
- Sửa module quân hàm, bảng vàng hoặc điểm thi đua ngoài phần đọc minh chứng.

## REGULATION PROFILES

| Khối | Profile code | Kỳ đánh giá | Mức môn/HĐGD | Mức phẩm chất/rèn luyện | Kết quả tổng hợp |
| --- | --- | --- | --- | --- | --- |
| 1–5 | `TT27_2020_PRIMARY` | `MID_TERM_1`, `END_TERM_1`, `MID_TERM_2`, `END_YEAR` | `HOAN_THANH_TOT`, `HOAN_THANH`, `CHUA_HOAN_THANH` | Phẩm chất/năng lực: `TOT`, `DAT`, `CAN_CO_GANG` | Cuối năm: `HOAN_THANH_XUAT_SAC`, `HOAN_THANH_TOT`, `HOAN_THANH`, `CHUA_HOAN_THANH` |
| 6–9 | `TT22_2021_LOWER_SECONDARY` | `TERM_1`, `TERM_2`, `FULL_YEAR` | Môn nhận xét: `DAT`, `CHUA_DAT`; môn khác dùng điểm + nhận xét khi cần | Rèn luyện: `TOT`, `KHA`, `DAT`, `CHUA_DAT` | Học tập: `TOT`, `KHA`, `DAT`, `CHUA_DAT` |
| 10–12 | `TT22_2021_UPPER_SECONDARY` | `TERM_1`, `TERM_2`, `FULL_YEAR` | Theo danh mục môn/chuyên đề của khối | Rèn luyện: `TOT`, `KHA`, `DAT`, `CHUA_DAT` | Học tập: `TOT`, `KHA`, `DAT`, `CHUA_DAT` |

Quy tắc triển khai:

- Không lưu ký hiệu hiển thị một chữ làm enum gốc. `T` có thể mang nghĩa khác nhau trong hồ sơ Tiểu học.
- Không dùng tên code `TT22` đơn lẻ; luôn phân biệt `TT22_2021` với `TT22_2016`.
- `evaluationPeriod` độc lập với `terms`; không tạo học kỳ giả cho giữa kỳ Tiểu học.
- Nếu lớp thiếu hoặc sai khối, hiển thị trạng thái cấu hình thiếu và chặn finalize.
- Không đổi profile của một evaluation đã có dữ liệu mà không có migration/confirmation rõ ràng.

## TT27 FUNCTIONAL REQUIREMENTS — TIỂU HỌC

### Môn học và hoạt động giáo dục

- Cho nhập mức đạt được, điểm kiểm tra định kỳ nếu áp dụng và nhận xét.
- Danh mục môn lấy từ cấu hình/chương trình hiện có của lớp; không render các môn không áp dụng.
- Nhận xét hỗ trợ mô tả tiến bộ, năng khiếu, hứng thú, nội dung/kỹ năng chưa hoàn thành và biện pháp giúp đỡ.

### Phẩm chất chủ yếu

Phải có đúng các criterion code:

- `YEU_NUOC`
- `NHAN_AI`
- `CHAM_CHI`
- `TRUNG_THUC`
- `TRACH_NHIEM`

### Năng lực chung

- `TU_CHU_TU_HOC`
- `GIAO_TIEP_HOP_TAC`
- `GIAI_QUYET_VAN_DE_SANG_TAO`

### Năng lực đặc thù

- `NGON_NGU`
- `TINH_TOAN`
- `KHOA_HOC`
- `CONG_NGHE`
- `TIN_HOC`
- `THAM_MI`
- `THE_CHAT`

### Tổng hợp cuối năm

- Lưu/hiển thị kết quả giáo dục, khen thưởng và kết quả hoàn thành chương trình/lên lớp khi dữ liệu có sẵn.
- MVP cho phép giáo viên chọn/xác nhận mức; chỉ đưa consistency warning.
- Không tự thay đổi mức dựa trên điểm thi đua hoặc câu nhận xét.

### Trường hợp kế hoạch giáo dục cá nhân

- Cho giáo viên xác nhận sử dụng yêu cầu điều chỉnh/kế hoạch giáo dục cá nhân.
- Không tự suy đoán khuyết tật hoặc tình trạng sức khỏe.
- Không đưa dữ liệu sức khỏe nhạy cảm vào câu gợi ý.

## TT22 FUNCTIONAL REQUIREMENTS — THCS/THPT

### Môn học

- Với môn đánh giá bằng nhận xét: dùng `DAT` hoặc `CHUA_DAT`.
- Với môn kết hợp nhận xét và điểm số: sử dụng dữ liệu điểm hiện có, kèm trường nhận xét khi cần.
- Danh mục môn/chuyên đề phải theo đúng khối và cấu hình lớp, không hard-code một danh sách chung.

### Rèn luyện

- Giáo viên chọn `TOT`, `KHA`, `DAT` hoặc `CHUA_DAT`.
- Nhận xét mô tả tiến bộ, ưu điểm nổi bật, hạn chế chủ yếu và vấn đề cần hỗ trợ.
- Không đồng nhất rèn luyện với điểm thi đua, quân hàm hoặc bảng vàng.

### Kết quả học tập

- Hiển thị/lưu mức `TOT`, `KHA`, `DAT`, `CHUA_DAT` khi cần.
- MVP không tự xếp mức chính thức.
- Nếu codebase đã có service tính hợp lệ, chỉ tái sử dụng khi có test đúng quy định; không viết công thức trong React component.

### Nhận xét giáo viên chủ nhiệm

- Có nhận xét tổng hợp cho HKI, HKII và Cả năm.
- Nội dung gồm tiến bộ, ưu điểm/hạn chế nổi bật trong rèn luyện và học tập, cùng vấn đề cần tiếp tục giúp đỡ.

## COMMENT COMPOSER REQUIREMENTS

Mỗi nhận xét có thể gồm bốn phần:

1. Tiến bộ hoặc điểm tích cực.
2. Minh chứng/biểu hiện quan sát được.
3. Điểm cần cải thiện, diễn đạt trung tính.
4. Khuyến nghị hỗ trợ cụ thể.

Hỗ trợ token có kiểm soát:

- `studentName`
- `studentPronoun`
- `subjectName`
- `progressEvidence`
- `strengthEvidence`
- `positiveEvidence`
- `observableBehavior`
- `achievedPart`
- `improvementArea`
- `limitation`
- `targetBehavior`
- `context`
- `supportAction`
- `nextStep`
- `timeScope`

Không cho finalize nếu còn token `{...}` chưa thay.

### Seed template tối thiểu

Các câu dưới đây là template của sản phẩm, không phải trích dẫn pháp lý:

| Profile/domain | Level | Template skeleton |
| --- | --- | --- |
| TT27 môn/HĐGD | `HOAN_THANH_TOT` | “Em thực hiện tốt các yêu cầu của `{subjectName}`, nổi bật ở `{strengthEvidence}`. Tiếp tục phát huy `{nextStep}`.” |
| TT27 môn/HĐGD | `HOAN_THANH` | “Em đã hoàn thành các yêu cầu cơ bản và có tiến bộ ở `{progressEvidence}`. Cần luyện thêm `{improvementArea}`.” |
| TT27 môn/HĐGD | `CHUA_HOAN_THANH` | “Em bước đầu thực hiện được `{achievedPart}`; còn cần hỗ trợ ở `{improvementArea}`. Đề nghị `{supportAction}`.” |
| TT27 phẩm chất/năng lực | `TOT` | “Em thường xuyên thể hiện `{observableBehavior}` và có tiến bộ ở `{progressEvidence}`. Tiếp tục phát huy.” |
| TT27 phẩm chất/năng lực | `DAT` | “Em đã thể hiện `{observableBehavior}`; cần duy trì thường xuyên hơn trong `{context}`.” |
| TT27 phẩm chất/năng lực | `CAN_CO_GANG` | “Em đã có cố gắng ở `{positiveEvidence}`; cần được hướng dẫn thêm để `{targetBehavior}`. Giáo viên và gia đình phối hợp `{supportAction}`.” |
| TT22 môn học | Mọi mức | “Em có tiến bộ ở `{progressEvidence}`, nổi bật ở `{strengthEvidence}`. Cần củng cố `{limitation}` bằng `{supportAction}`.” |
| TT22 rèn luyện/GVCN | `TOT`, `KHA`, `DAT` | “Em có tiến bộ trong `{progressEvidence}`; thể hiện tốt `{observableBehavior}`. Cần tiếp tục `{nextStep}`.” |
| TT22 rèn luyện/GVCN | `CHUA_DAT` | “Em đã có cố gắng ở `{positiveEvidence}`; tuy nhiên chưa đáp ứng ổn định yêu cầu về `{targetBehavior}`. Cần phối hợp thực hiện `{supportAction}`.” |

Yêu cầu thư viện mẫu:

- Tìm kiếm theo profile, khối, domain, criterion, subject, level, tag và từ khóa tiếng Việt không dấu.
- Mẫu `SYSTEM` chỉ đọc; không cho sửa/xóa trực tiếp.
- Mẫu `CUSTOM` được tạo, sửa, favorite và xóa mềm.
- Seed idempotent theo `catalogVersion`; chạy lại không tạo duplicate.
- Mỗi suggestion/comment phải lưu hoặc hiển thị nguồn: `SYSTEM_TEMPLATE`, `CUSTOM_TEMPLATE`, `EVIDENCE_SUGGESTION`, `MANUAL`.

## EVIDENCE SUGGESTION REQUIREMENTS

Rule engine chạy cục bộ và có thể đọc dữ liệu trong đúng khoảng kỳ từ:

- Attendance/chuyên cần.
- Point entries/thi đua.
- Live classroom participation.
- Student notes đã được giáo viên chủ động chọn.
- Tiến bộ so với kỳ trước.

Quy tắc bắt buộc:

- Scope theo `classId`, `academicYearId`, `periodCode`, `studentId` và enrollment.
- Bỏ qua soft-deleted, reversed hoặc dữ liệu ngoài khoảng thời gian.
- Hiển thị nguồn, ngày và loại minh chứng trước khi tạo draft.
- Không đưa nội dung đầy đủ của ghi chú riêng tư/trao đổi phụ huynh vào câu gợi ý nếu giáo viên chưa chọn.
- Không tự chọn level, không tự lưu, không tự finalize.
- Không dùng một chỉ số đơn lẻ làm kết luận chính thức.
- Nếu không có minh chứng, không tạo câu khẳng định; cho phép nhập tay hoặc dùng template.

## WORDING AND QUALITY RULES

- Mô tả hành vi/kỹ năng quan sát được, không dán nhãn con người.
- Không so sánh học sinh với bạn khác hoặc ghi thứ hạng lớp.
- Cảnh báo các từ/cụm từ dễ gây tổn thương như “lười”, “kém”, “cá biệt” khi dùng để gắn nhãn.
- Không suy luận bệnh lý, khuyết tật, hoàn cảnh gia đình, giới tính hoặc dân tộc.
- Cảnh báo nếu nhiều học sinh có nhận xét trùng hoàn toàn.
- Cảnh báo nếu nội dung không có chi tiết/minh chứng hoặc vượt vùng in.
- Không tự cắt nội dung dài; không tạo giới hạn pháp lý giả định.
- Lưu plain text; escape khi render/export để ngăn stored XSS.

## USER FLOW

1. Giáo viên mở `/evaluations`.
2. Chọn năm học, lớp và kỳ đánh giá.
3. Hệ thống resolve profile và tải roster theo enrollment.
4. Giáo viên chọn học sinh và nhập mức theo từng tab/domain.
5. Giáo viên viết tay, áp dụng template hoặc chọn evidence để tạo draft.
6. Autosave draft sau validation tối thiểu; hiển thị trạng thái và thời điểm lưu.
7. Giáo viên mở Review để xem error và warning.
8. Khi không còn blocking error, giáo viên finalize từng học sinh hoặc cả lớp.
9. Bản finalized chuyển read-only.
10. Mở khóa yêu cầu lý do và ghi audit old/new.
11. Giáo viên xuất Excel/in A4 khi cần.

## STATUS MODEL

Sử dụng state rõ nghĩa, phù hợp convention hiện tại. Logic tối thiểu:

- `DRAFT`
- `READY_FOR_REVIEW`
- `FINALIZED`

“Chưa nhập” là trạng thái suy ra khi chưa có record, không nhất thiết phải lưu thành row rỗng.

Không cho update trực tiếp record `FINALIZED`. Unlock phải là service operation riêng có audit và lý do.

## DATABASE REQUIREMENTS

### Nguyên tắc

- Xác minh Dexie version hiện tại; dùng version kế tiếp, không mặc định là `v8`.
- Không drop/truncate table.
- Không xóa index/field cũ nếu chưa chứng minh an toàn.
- Migration phải giữ dữ liệu hiện có và backward compatibility thực tế.
- Tất cả thao tác ghi nhiều bảng dùng Dexie transaction.
- Cập nhật backup export, restore validation và restore transaction.

### Logical aggregate: `evaluations`

Mở rộng bảng hiện có hoặc thiết kế tương thích để lưu:

- `id`
- `classId`
- `studentId`
- `academicYearId`
- `termId?`
- `periodCode`
- `regulationCode`
- `educationLevel`
- `status`
- `overallEducationLevel?`
- `conductLevel?`
- `overallLearningLevel?`
- `homeroomComment?`
- `promotionResult?`
- `teacherProfileId?`
- `finalizedAt?`
- `finalizedBy?`
- `unlockReason?`
- timestamps và soft-delete fields theo convention hiện tại.

Business uniqueness mục tiêu:

`[classId+studentId+academicYearId+periodCode]`

Nếu model hiện tại không thể đổi trực tiếp mà không phá dữ liệu, tạo migration bridge và giữ legacy field trong thời gian chuyển tiếp.

### Child entity: `evaluationItems`

Logical fields:

- `id`
- `evaluationId`
- `domain`
- `criterionCode`
- `subjectCode?`
- `levelCode?`
- `periodicScore?`
- `comment?`
- `commentSource`
- `templateId?`
- `evidenceRefs?`
- timestamps và soft delete nếu phù hợp.

Business uniqueness mục tiêu:

`[evaluationId+domain+criterionCode]`

### Template entity: `evaluationCommentTemplates`

Logical fields:

- `id`
- `catalogVersion`
- `regulationCode`
- `gradeFrom`
- `gradeTo`
- `domain`
- `criterionCode?`
- `levelCode?`
- `templateText`
- `tags`
- `origin`: `SYSTEM` hoặc `CUSTOM`
- `isFavorite`
- `isActive`
- timestamps và soft delete.

### Legacy migration

- Chỉ map record cũ sang `periodCode` khi `termId`/metadata đủ rõ.
- Dữ liệu mơ hồ phải được giữ nguyên và gắn trạng thái kiểu `LEGACY_UNMAPPED` hoặc cơ chế tương đương; không đoán.
- Migration test phải mở DB schema cũ có dữ liệu, nâng version, đọc lại toàn bộ row và xác nhận không mất dữ liệu.
- Nếu migration thất bại, transaction phải rollback và ứng dụng hiển thị lỗi có hướng dẫn sao lưu/khôi phục.

## SERVICE AND REPOSITORY REQUIREMENTS

Tuân theo naming/folder convention thực tế. Các trách nhiệm phải được tách rõ, dù tên file cuối cùng có thể khác:

- `EvaluationProfileService`: resolve profile, period, scale và criteria.
- `EvaluationService`: roster progress, draft, readiness, finalize, unlock và transaction.
- `EvaluationTemplateService`: seed, search, favorite, custom template.
- `EvaluationSuggestionService`: evidence aggregation và deterministic suggestions.
- `EvaluationValidationService`: profile/level/token/completeness/wording/export warnings.
- `EvaluationExportService`: Excel/print mapping.
- `evaluationRepository`: query được scope, aggregate/items/templates và soft delete.

Không đặt business rule hoặc công thức đánh giá trong React component.

Không tạo REST API/backend cho ứng dụng offline này.

## UI REQUIREMENTS

### Header

- Academic year selector.
- Class selector.
- Evaluation period selector.
- Badge profile đầy đủ: `TT27/2020 — Tiểu học` hoặc `TT22/2021 — THCS/THPT`.
- Progress summary.
- Actions: Review, Finalize, Export.

### Desktop

- Cột trái: roster theo STT, search không dấu, filter trạng thái.
- Vùng chính: form evaluation theo profile.
- Panel phải: template library và evidence panel; có thể thu gọn.
- Hỗ trợ màn hình 1366px không horizontal overflow ngoài bảng có chủ đích.

### Tiểu học

Tabs:

- `Môn học & HĐGD`
- `Phẩm chất`
- `Năng lực`
- `Tổng hợp`

### THCS/THPT

Tabs:

- `Môn học`
- `Rèn luyện`
- `Kết quả học tập`
- `Nhận xét GVCN`

### Mobile/tablet

- Roster dùng drawer.
- Bảng chuyển thành card/stacked layout khi cần.
- Save/Next action luôn truy cập được nhưng không che textarea.
- Không overflow ở viewport 390px.

### Required UI states

- Loading skeleton.
- Empty class/no enrollment.
- Missing grade/profile.
- No templates.
- No evidence.
- Draft restored.
- Save failed/storage full.
- Finalized read-only.
- Permission/presentation denied.

### Accessibility

- Label/input association đầy đủ.
- Focus order và keyboard navigation hợp lý.
- Error summary focusable.
- Không chỉ dùng màu để biểu thị status/level.
- Icon-only button có accessible name.

## AUTOSAVE AND CONCURRENCY

- Debounce autosave theo convention hiện có.
- Không autosave khi blocking validation fail.
- Hiển thị `Saving`, `Saved at`, `Save failed`.
- Chống double submit khi save/finalize batch.
- Không ghi draft của học sinh/lớp cũ sau khi người dùng đổi selection trong lúc request IndexedDB chưa hoàn tất.
- Khi source evidence thay đổi trong lúc soạn, giữ text giáo viên và hiển thị cảnh báo stale evidence.

## PERMISSION AND DATA SCOPE

Ứng dụng hiện là single-owner offline; không tự thêm auth/RBAC.

- Giáo viên owner được tạo/sửa draft, finalize, unlock và export.
- “Giáo viên môn học” và “GVCN” trong UI là workflow responsibility, không phải lý do tạo account system mới.
- Presentation routes không được query hoặc render nhận xét cá nhân.
- Mọi query phải scope bằng class, academic year, period, student và enrollment; không chỉ tin `activeClassId` từ UI.
- Bản finalized là read-only.
- Unlock bắt buộc lý do và audit.

## VALIDATION

Blocking errors:

- Missing/invalid grade hoặc regulation profile.
- Profile, period hoặc level code không tương thích.
- Student không thuộc enrollment hợp lệ của scope.
- Token `{...}` chưa được thay.
- Comment chỉ chứa whitespace khi field được yêu cầu.
- Duplicate business key.
- Update trực tiếp finalized record.
- Import/export mapping khác profile không được xác nhận.

Warnings có thể review:

- Nhận xét trùng hoàn toàn trên nhiều học sinh.
- Từ ngữ dễ gây tổn thương/so sánh.
- Không có minh chứng cụ thể.
- Evidence ngoài kỳ hoặc đã thay đổi.
- Nội dung có nguy cơ tràn bản in.
- Copy nguyên văn từ kỳ trước.

Không đặt giới hạn ký tự với lý do “quy định pháp luật” nếu không có căn cứ. Nếu cần hard limit kỹ thuật, phải theo convention/storage safety và ghi rõ đây là giới hạn sản phẩm.

## SECURITY AND PRIVACY

- Lưu comment dưới dạng plain text; escape ở mọi nơi render.
- Test stored XSS trong UI, preview và export.
- Không log toàn bộ nhận xét, ghi chú, dữ liệu sức khỏe hoặc thông tin phụ huynh.
- Không gửi dữ liệu vào BroadcastChannel dùng cho presentation.
- Không thêm network request, remote font/script, AI API hoặc analytics.
- Export yêu cầu user action rõ ràng và cảnh báo bảo quản dữ liệu cá nhân.
- Backup/restore phải bao phủ bảng/field mới; giữ tùy chọn mã hóa hiện có.
- Không đưa dữ liệu nhạy cảm vào error message.

## ERROR HANDLING

- Missing profile: hướng dẫn cập nhật khối lớp.
- IndexedDB/quota failure: giữ editor state, báo lưu thất bại, cho retry/backup; không báo success giả.
- Migration failure: rollback, chặn thao tác ghi và hướng dẫn khôi phục an toàn.
- Missing evidence: vẫn cho nhập tay/template, không sinh câu không có căn cứ.
- Student transferred/deleted: giữ lịch sử scope cũ; không đưa vào current roster mặc định.
- Export failure: không tạo file rỗng hoặc đánh dấu completed.
- Unsupported browser capability: fallback phù hợp, không làm mất draft.

## PERFORMANCE REQUIREMENTS

- Lớp 50 học sinh với toàn bộ TT27 criteria phải thao tác mượt trên thiết bị phổ thông.
- Không N+1 query theo từng student/criterion khi tải roster.
- Batch query và memoization hợp lý; không cache dữ liệu finalized/draft theo cách gây stale scope.
- Không render lại toàn bộ roster khi chỉ sửa một textarea nếu có thể tránh.
- Đo/ghi nhận benchmark hoặc ít nhất integration performance test theo convention dự án.

## FILES TO INSPECT

Tối thiểu:

- `docs/PROJECT_FEATURES.md`
- `src/modules/evaluations/EvaluationsPage.tsx`
- `src/core/repositories/evaluation.repository.ts`
- `src/core/database/db.ts`
- Evaluation model/type/schema files.
- Class, academic year, term, enrollment repositories/services.
- Audit service/repository.
- Backup export/restore/validation files.
- Excel export và print utilities.
- Route/menu/layout files.
- Existing test helpers và related tests.

## FILES TO MODIFY OR CREATE

Chỉ chốt sau discovery. Phạm vi dự kiến:

- Cập nhật evaluation page, route/menu nếu cần.
- Cập nhật evaluation types, repository và database migration.
- Tạo components dưới module evaluations theo convention hiện có.
- Tạo/tách profile, template, suggestion, validation và export services.
- Cập nhật backup schema/restore.
- Thêm unit, integration và UI tests.
- Cập nhật `docs/PROJECT_FEATURES.md` và changelog.

Không tạo file trùng trách nhiệm nếu project đã có utility/service phù hợp.

## DO NOT CHANGE

- Không đổi stack React/TypeScript/Vite/Dexie.
- Không phá offline-first hoặc `0% telemetry`.
- Không thêm backend/auth/AI/network integration.
- Không đổi Feature ID `FEAT-EVAL-001`.
- Không đổi/xóa API nội bộ, table, field, permission hoặc dữ liệu không liên quan.
- Không dùng `DROP`, `TRUNCATE` hoặc xóa dữ liệu cũ.
- Không refactor/format hàng loạt file ngoài scope.
- Không dùng điểm thi đua, quân hàm hoặc bảng vàng làm kết quả đánh giá chính thức.
- Không tự động chọn level/finalize thay giáo viên.
- Không ghi template của sản phẩm là câu mẫu chính thức của Bộ GD&ĐT.
- Không để `TODO`, pseudo-code hoặc empty implementation trong phần được tuyên bố hoàn thành.
- Không sửa test để che giấu regression.

## IMPLEMENTATION PHASES

### Phase 1 — Foundation and migration

- Discovery checkpoint.
- Type-safe profile/period/level constants.
- Safe Dexie migration.
- Aggregate/item/template repository.
- Idempotent minimum template seed.
- Backup/restore update.
- Migration/repository unit tests.

Checkpoint: toàn bộ test baseline + test mới pass; dữ liệu legacy được bảo toàn.

### Phase 2 — Core evaluation workflow

- Route/page hoàn chỉnh.
- Roster, filters và profile tabs.
- Draft/autosave.
- Review errors/warnings.
- Finalize/unlock/audit.
- Core UI/integration tests.

Checkpoint: happy path và failure path hoạt động offline.

### Phase 3 — Template composer

- Template drawer/search.
- Token composer.
- Custom template/favorite/soft delete.
- Wording/duplicate/token validation.
- Template tests.

### Phase 4 — Evidence suggestions

- Scoped evidence aggregation.
- Traceable suggestion preview.
- Manual apply only.
- Privacy and stale-evidence handling.
- Suggestion tests.

### Phase 5 — Export and hardening

- Excel/print output.
- Responsive/accessibility.
- Performance/N+1 check.
- XSS/privacy regression.
- Full test/build.
- Documentation update.

Nếu không thể hoàn thành toàn bộ phase trong một task, chỉ đánh dấu những phase có code + test thực tế; cập nhật `FEAT-EVAL-001` thành `PARTIAL`, liệt kê phần còn lại và không tuyên bố hoàn thành.

## ACCEPTANCE CRITERIA

- [ ] Discovery ghi nhận được schema/version/type/current route và test baseline.
- [ ] Lớp 1–5 resolve đúng `TT27_2020_PRIMARY`.
- [ ] Lớp 6–9 resolve đúng `TT22_2021_LOWER_SECONDARY`.
- [ ] Lớp 10–12 resolve đúng `TT22_2021_UPPER_SECONDARY`.
- [ ] Lớp thiếu/sai khối không thể finalize.
- [ ] TT27 có đủ 5 phẩm chất, 3 năng lực chung và 7 năng lực đặc thù.
- [ ] TT27 phân biệt mức môn với mức phẩm chất/năng lực trong storage.
- [ ] TT22 phân biệt mức môn nhận xét, rèn luyện và học tập.
- [ ] Không hiển thị scale/template sai profile.
- [ ] Giáo viên viết tay, chọn mẫu, ghép token và lưu mẫu cá nhân được.
- [ ] System templates bất biến và seed idempotent.
- [ ] Draft/autosave/restore hoạt động offline và hiển thị trạng thái đúng.
- [ ] Chuyển lớp/học sinh không gây stale write sang scope cũ.
- [ ] Suggestion chỉ dùng evidence đúng lớp/kỳ và hiển thị nguồn.
- [ ] Deleted/reversed/out-of-period evidence bị loại.
- [ ] Suggestion không tự chọn level, save hoặc finalize.
- [ ] Blocking validation ngăn token còn sót, profile mismatch và invalid level.
- [ ] Duplicate/wording/no-evidence/overflow tạo warning phù hợp.
- [ ] Finalized record read-only.
- [ ] Unlock yêu cầu lý do và ghi audit old/new.
- [ ] Presentation routes không đọc/render comment.
- [ ] Stored XSS không thực thi trong UI/preview/export.
- [ ] Export chỉ chứa đúng class/year/period/profile và giữ Unicode tiếng Việt.
- [ ] Migration bảo toàn mọi evaluation cũ; dữ liệu mơ hồ không bị map đoán.
- [ ] Backup/restore bao phủ schema mới và rollback khi invalid.
- [ ] Không có network request hoặc telemetry mới.
- [ ] Không có N+1 query khi tải lớp 50 học sinh.
- [ ] Viewport 390px không overflow; keyboard và screen reader states usable.
- [ ] Test suite và production build pass.
- [ ] `docs/PROJECT_FEATURES.md` phản ánh đúng trạng thái triển khai và changelog.

## REQUIRED TEST CASES

### Unit

- Profile resolution: grade 1, 5, 6, 9, 10, 12, null và invalid.
- Level/label mapping; chống nhầm `T`, `C`, `CĐ`.
- TT27 criteria catalog completeness.
- Template seed idempotency.
- Token replacement và unresolved-token detection.
- Vietnamese diacritic-insensitive search.
- System/custom template isolation.
- Wording and duplicate detection.
- Evidence range/scope/deleted/reversed filtering.
- Finalize validation.

### Repository and migration

- Upgrade từ schema hiện tại có legacy evaluation rows.
- Không mất dữ liệu/index cần thiết.
- Unique business key.
- Transaction rollback khi item/template write fail.
- Backup round trip với schema mới.
- Invalid backup không ghi dở dữ liệu.

### Integration

- Create draft → edit → ready → finalize → unlock with reason → edit → finalize.
- Audit logs chứa action, entity, old/new và timestamp phù hợp.
- Switch class during pending autosave không cross-write.
- Student transfer/history scope.
- Storage/quota failure giữ nội dung editor và báo lỗi.

### UI

- TT27 tabs/levels/criteria.
- TT22 tabs/levels/subject modes.
- Missing grade state.
- Empty roster/no template/no evidence.
- Autosave status and restored draft.
- Read-only finalized state.
- Error summary focus.
- Keyboard navigation.
- Mobile 390px và desktop 1366px.

### Security and privacy

- Stored XSS payload in manual/custom template/comment.
- No comment data in presentation BroadcastChannel.
- No console logging of full comments.
- No unexpected network request.
- Export scope isolation.

### Performance

- Load/edit lớp 50 học sinh với full TT27 criteria.
- Query count không tăng tuyến tính kiểu N+1 theo từng criterion.

## REQUIRED COMMANDS

Sử dụng đúng package manager và scripts tìm thấy trong repository. Tối thiểu chạy:

- Test suite hiện có.
- Test mới của evaluation module.
- TypeScript/typecheck nếu tách script.
- Production build.
- Lint nếu project có script lint.

Không báo “pass” nếu không chạy được. Nếu môi trường chặn lệnh, ghi rõ lệnh, lỗi và phần chưa xác minh.

## DOCUMENTATION UPDATE

Sau khi code:

1. Cập nhật `FEAT-EVAL-001` trong `docs/PROJECT_FEATURES.md`.
2. Chỉ chuyển `IMPLEMENTED` nếu toàn bộ acceptance criteria trong scope hoàn tất và test/build pass.
3. Nếu mới hoàn thành một số phase, chuyển `PARTIAL`, ghi phase hoàn tất/chưa hoàn tất.
4. Cập nhật Data Model với bảng/index thật, không để schema “planned” như đã triển khai.
5. Cập nhật Test Traceability bằng tên test file thật và kết quả thật.
6. Cập nhật Known Gaps và Changelog.
7. Kiểm tra lại tổng số bảng/schema version/test count nếu tài liệu đang ghi các số này.

## SELF-REVIEW BEFORE FINISHING

Kiểm tra:

- Syntax, import, type và null handling.
- Dexie migration/version/index.
- Transaction và rollback.
- Legacy data preservation.
- Profile/period/level mapping.
- Enrollment/data scope.
- Finalize/unlock state machine.
- Audit and backup.
- Stored XSS và privacy.
- Loading/empty/error/locked states.
- Responsive/accessibility.
- N+1/performance.
- Breaking changes.
- Documentation accuracy.

## FINAL RESPONSE FORMAT

Trả lời ngắn gọn theo thứ tự:

1. **Outcome**: phase/tính năng đã hoàn thành và trạng thái thực tế.
2. **Discovery**: schema version, hiện trạng ban đầu và quyết định kiến trúc chính.
3. **Files changed**: nhóm file và mục đích.
4. **Migration/data safety**: version mới, cách bảo toàn legacy và backup/restore.
5. **Validation/security**: các guard quan trọng.
6. **Tests/build**: lệnh đã chạy, số test và kết quả thật.
7. **Documentation**: trạng thái `FEAT-EVAL-001` sau cập nhật.
8. **Remaining gaps/blockers**: nếu có.

Không dán toàn bộ code vào phản hồi nếu các file đã được cập nhật trong repository.
