import { z } from 'zod';

export const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
export const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;

export const TeacherProfileSchema = z.object({
  fullName: z.string().min(2, 'Họ và tên giáo viên tối thiểu 2 ký tự'),
  schoolName: z.string().min(2, 'Tên trường học tối thiểu 2 ký tự'),
  phone: z.string().regex(phoneRegex, 'Số điện thoại không đúng định dạng Việt Nam').optional().or(z.literal('')),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  avatar: z.string().optional(),
});

export const AcademicYearSchema = z.object({
  name: z.string().min(3, 'Tên năm học tối thiểu 3 ký tự (VD: 2024 - 2025)'),
  startDate: z.string().regex(dateRegex, 'Ngày bắt đầu dạng YYYY-MM-DD'),
  endDate: z.string().regex(dateRegex, 'Ngày kết thúc dạng YYYY-MM-DD'),
  isActive: z.boolean().default(false),
});

export const TermSchema = z.object({
  academicYearId: z.string().min(1, 'Năm học không được để trống'),
  name: z.string().min(2, 'Tên học kỳ không được để trống'),
  startDate: z.string().regex(dateRegex, 'Ngày bắt đầu dạng YYYY-MM-DD'),
  endDate: z.string().regex(dateRegex, 'Ngày kết thúc dạng YYYY-MM-DD'),
  isActive: z.boolean().default(false),
});

export const ClassRoomSchema = z.object({
  academicYearId: z.string().min(1, 'Năm học không được để trống'),
  name: z.string().min(1, 'Tên lớp không được để trống (VD: 10A1)'),
  grade: z.number().int().min(1).max(12, 'Khối lớp từ 1 đến 12'),
  description: z.string().optional(),
  status: z.enum(['Active', 'Completed', 'Archived']).default('Active'),
});

export const StudentSchema = z.object({
  studentCode: z.string().min(1, 'Mã học sinh không được để trống'),
  fullName: z.string().min(2, 'Họ và tên học sinh tối thiểu 2 ký tự'),
  gender: z.enum(['Nam', 'Nữ', 'Khác']),
  dateOfBirth: z.string().regex(dateRegex, 'Ngày sinh dạng YYYY-MM-DD'),
  ethnicity: z.string().optional(),
  address: z.string().optional(),
  avatar: z.string().optional(),
  avatarKey: z.string().nullable().optional(),
  avatarThemeId: z.string().nullable().optional(),
  medicalNote: z.string().optional(),
});

export const ClassEnrollmentSchema = z.object({
  classId: z.string().min(1, 'ID lớp không được để trống'),
  studentId: z.string().min(1, 'ID học sinh không được để trống'),
  rollNumber: z.number().int().positive().optional(),
  joinedAt: z.string().regex(dateRegex, 'Ngày tham gia dạng YYYY-MM-DD'),
  leftAt: z.string().regex(dateRegex, 'Ngày rời lớp dạng YYYY-MM-DD').nullable().optional(),
  status: z.enum(['Active', 'Transferred', 'Dropped', 'Suspended']).default('Active'),
});

export const ParentContactSchema = z.object({
  studentId: z.string().min(1, 'Học sinh không được để trống'),
  fullName: z.string().min(2, 'Họ tên phụ huynh tối thiểu 2 ký tự'),
  relation: z.string().min(1, 'Mối quan hệ không được để trống'),
  phone: z.string().regex(phoneRegex, 'Số điện thoại phụ huynh không đúng định dạng'),
  email: z.string().email().optional().or(z.literal('')),
  zalo: z.string().optional(),
  occupation: z.string().optional(),
  isPrimary: z.boolean().default(true),
});

export const AttendanceSessionSchema = z.object({
  classId: z.string().min(1, 'Lớp học không được để trống'),
  termId: z.string().optional(),
  sessionDate: z.string().regex(dateRegex, 'Ngày điểm danh dạng YYYY-MM-DD'),
  status: z.enum(['Completed', 'Pending', 'Cancelled']).default('Completed'),
  note: z.string().optional(),
});

export const AttendanceRecordSchema = z.object({
  sessionId: z.string().min(1, 'Phiên điểm danh không được để trống'),
  studentId: z.string().min(1, 'Học sinh không được để trống'),
  status: z.enum(['CoMat', 'Phep', 'KhongPhep', 'Tre']),
  note: z.string().optional(),
});

export const PointCategorySchema = z.object({
  name: z.string().min(2, 'Tên danh mục điểm tối thiểu 2 ký tự'),
  type: z.enum(['Merit', 'Demerit']),
  defaultPoints: z.number().int(),
  description: z.string().optional(),
});

export const PointEntrySchema = z.object({
  classId: z.string().min(1, 'ID lớp không được để trống'),
  studentId: z.string().min(1, 'ID học sinh không được để trống'),
  categoryId: z.string().min(1, 'ID danh mục điểm không được để trống'),
  points: z.number().int(),
  reason: z.string().min(2, 'Lý do cộng/trừ điểm không được để trống'),
  occurredAt: z.string().regex(dateRegex, 'Ngày ghi nhận dạng YYYY-MM-DD'),
});

export const StudentNoteSchema = z.object({
  classId: z.string().min(1),
  studentId: z.string().min(1),
  termId: z.string().optional(),
  content: z.string().min(2, 'Nội dung ghi chú không được để trống'),
  category: z.enum(['HocTap', 'KyLuat', 'TamLy', 'Khac']).default('HocTap'),
});

export const EvaluationSchema = z.object({
  classId: z.string().min(1),
  studentId: z.string().min(1),
  termId: z.string().min(1),
  academicRank: z.enum(['Tốt', 'Khá', 'Đạt', 'Chưa đạt']).optional(),
  conductRank: z.enum(['Tốt', 'Khá', 'Đạt', 'Chưa đạt']).optional(),
  generalComment: z.string().optional(),
});

export const ParentInteractionSchema = z.object({
  classId: z.string().min(1),
  studentId: z.string().min(1),
  interactionDate: z.string().regex(dateRegex, 'Ngày liên lạc dạng YYYY-MM-DD'),
  method: z.enum(['GoiDien', 'TrucTiep', 'Zalo', 'Khac']),
  topic: z.string().min(2, 'Chủ đề không được để trống'),
  content: z.string().min(2, 'Nội dung không được để trống'),
  parentFeedback: z.string().optional(),
});

export const RewardSchema = z.object({
  classId: z.string().min(1),
  studentId: z.string().min(1),
  termId: z.string().optional(),
  title: z.string().min(2, 'Tên khen thưởng không được để trống'),
  level: z.enum(['Truong', 'Quan', 'Tinh', 'QuocGia']).optional(),
  date: z.string().regex(dateRegex, 'Ngày khen thưởng dạng YYYY-MM-DD'),
  note: z.string().optional(),
});

export const httpsUrlRegex = /^https:\/\/[^\s]+$/;

export const LiveClassSessionSchema = z.object({
  classId: z.string().min(1, 'Vui lòng chọn Lớp học'),
  title: z.string().min(2, 'Tên phiên học tối thiểu 2 ký tự'),
  subject: z.string().min(1, 'Vui lòng nhập Môn học'),
  sessionDate: z.string().regex(dateRegex, 'Ngày phiên học dạng YYYY-MM-DD'),
  meetingPlatform: z.enum(['meet', 'zoom', 'teams', 'other', 'none']).default('meet'),
  meetingUrl: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (val) => !val || httpsUrlRegex.test(val),
      'Liên kết phòng học phải bắt đầu bằng https://'
    ),
});
