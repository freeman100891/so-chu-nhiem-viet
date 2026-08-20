import type {
  RegulationProfileCode,
  EvaluationPeriodCode,
  EvaluationDomain,
} from '../database/types';

export interface EvaluationCriterionDefinition {
  code: string;
  name: string;
  domain: EvaluationDomain;
  description?: string;
  isPeriodicScoreApplicable?: boolean;
  isCommentSubjectOnly?: boolean; // Cho TT22 môn nhận xét
}

export interface EvaluationScaleOption {
  code: string;
  label: string;
  shortLabel: string;
  colorVariant: 'success' | 'primary' | 'warning' | 'danger' | 'neutral';
  description?: string;
}

export interface EvaluationPeriodDefinition {
  code: EvaluationPeriodCode;
  name: string;
  shortName: string;
  isSummaryPeriod: boolean; // Có tổng hợp khen thưởng / lên lớp
}

export class EvaluationProfileService {
  /**
   * Phân giải Regulation Profile theo khối lớp (Grade)
   */
  resolveProfile(grade: number | undefined | null): RegulationProfileCode {
    if (grade === undefined || grade === null || isNaN(grade)) {
      throw new Error('Lớp học chưa được cấu hình khối lớp hợp lệ.');
    }
    if (grade >= 1 && grade <= 5) {
      return 'TT27_2020_PRIMARY';
    }
    if (grade >= 6 && grade <= 9) {
      return 'TT22_2021_LOWER_SECONDARY';
    }
    if (grade >= 10 && grade <= 12) {
      return 'TT22_2021_UPPER_SECONDARY';
    }
    throw new Error(`Khối lớp ${grade} không thuộc phạm vi quy định (Khối 1 đến 12).`);
  }

  /**
   * Lấy tên hiển thị tiếng Việt của Regulation Profile
   */
  getProfileDisplayName(profile: RegulationProfileCode): string {
    switch (profile) {
      case 'TT27_2020_PRIMARY':
        return 'Thông tư 27/2020/TT-BGDĐT — Cấp Tiểu học';
      case 'TT22_2021_LOWER_SECONDARY':
        return 'Thông tư 22/2021/TT-BGDĐT — Cấp THCS';
      case 'TT22_2021_UPPER_SECONDARY':
        return 'Thông tư 22/2021/TT-BGDĐT — Cấp THPT';
      default:
        return 'Quy chuẩn đánh giá học sinh';
    }
  }

  /**
   * Lấy danh sách các kỳ đánh giá theo Profile
   */
  getEvaluationPeriods(profile: RegulationProfileCode): EvaluationPeriodDefinition[] {
    if (profile === 'TT27_2020_PRIMARY') {
      return [
        { code: 'MID_TERM_1', name: 'Giữa Học kỳ 1', shortName: 'Giữa HK1', isSummaryPeriod: false },
        { code: 'END_TERM_1', name: 'Cuối Học kỳ 1', shortName: 'Cuối HK1', isSummaryPeriod: false },
        { code: 'MID_TERM_2', name: 'Giữa Học kỳ 2', shortName: 'Giữa HK2', isSummaryPeriod: false },
        { code: 'END_YEAR', name: 'Cuối Năm học', shortName: 'Cuối Năm', isSummaryPeriod: true },
      ];
    }

    // THCS và THPT (TT22/2021)
    return [
      { code: 'TERM_1', name: 'Học kỳ 1', shortName: 'HK1', isSummaryPeriod: false },
      { code: 'TERM_2', name: 'Học kỳ 2', shortName: 'HK2', isSummaryPeriod: false },
      { code: 'FULL_YEAR', name: 'Cả năm học', shortName: 'Cả năm', isSummaryPeriod: true },
    ];
  }

  /**
   * 5 Phẩm chất chủ yếu theo Thông tư 27/2020/TT-BGDĐT
   */
  getTT27Qualities(): EvaluationCriterionDefinition[] {
    return [
      { code: 'YEU_NUOC', name: 'Yêu nước', domain: 'QUALITY', description: 'Tự hào về quê hương, đất nước, bảo vệ môi trường xung quanh' },
      { code: 'NHAN_AI', name: 'Nhân ái', domain: 'QUALITY', description: 'Yêu thương gia đình, giúp đỡ bạn bè, tôn trọng người khác' },
      { code: 'CHAM_CHI', name: 'Chăm chỉ', domain: 'QUALITY', description: 'Chăm học, chăm làm việc nhà, tự giác hoàn thành nhiệm vụ' },
      { code: 'TRUNG_THUC', name: 'Trung thực', domain: 'QUALITY', description: 'Thật thà trong học tập, dám nhận lỗi khi làm sai' },
      { code: 'TRACH_NHIEM', name: 'Trách nhiệm', domain: 'QUALITY', description: 'Giữ gìn vệ sinh, bảo quản đồ dùng, tuân thủ nội quy lớp học' },
    ];
  }

  /**
   * 3 Năng lực chung theo Thông tư 27/2020/TT-BGDĐT
   */
  getTT27GeneralCapacities(): EvaluationCriterionDefinition[] {
    return [
      { code: 'TU_CHU_TU_HOC', name: 'Tự chủ và tự học', domain: 'GENERAL_CAPACITY', description: 'Tự chuẩn bị đồ dùng, tự giác làm bài và ôn tập' },
      { code: 'GIAO_TIEP_HOP_TAC', name: 'Giao tiếp và hợp tác', domain: 'GENERAL_CAPACITY', description: 'Mạnh dạn phát biểu, biết lắng nghe và phối hợp cùng nhóm' },
      { code: 'GIAI_QUYET_VAN_DE_SANG_TAO', name: 'Giải quyết vấn đề và sáng tạo', domain: 'GENERAL_CAPACITY', description: 'Biết tìm cách giải bài mới, có ý tưởng sáng tạo trong học tập' },
    ];
  }

  /**
   * 7 Năng lực đặc thù theo Thông tư 27/2020/TT-BGDĐT
   */
  getTT27SpecificCapacities(): EvaluationCriterionDefinition[] {
    return [
      { code: 'NGON_NGU', name: 'Ngôn ngữ', domain: 'SPECIFIC_CAPACITY', description: 'Khả năng diễn đạt, đọc hiểu và sử dụng từ ngữ' },
      { code: 'TINH_TOAN', name: 'Tính toán', domain: 'SPECIFIC_CAPACITY', description: 'Khả năng tư duy số học, hình học và giải toán' },
      { code: 'KHOA_HOC', name: 'Khoa học', domain: 'SPECIFIC_CAPACITY', description: 'Tìm tòi, khám phá thế giới tự nhiên và xã hội xung quanh' },
      { code: 'CONG_NGHE', name: 'Công nghệ', domain: 'SPECIFIC_CAPACITY', description: 'Sử dụng đồ dùng công nghệ và thao tác kỹ thuật' },
      { code: 'TIN_HOC', name: 'Tin học', domain: 'SPECIFIC_CAPACITY', description: 'Kỹ năng làm quen và sử dụng máy tính, phần mềm học tập' },
      { code: 'THAM_MI', name: 'Thẩm mĩ', domain: 'SPECIFIC_CAPACITY', description: 'Cảm thụ nghệ thuật, âm nhạc và hội họa sáng tạo' },
      { code: 'THE_CHAT', name: 'Thể chất', domain: 'SPECIFIC_CAPACITY', description: 'Vận động thể dục, rèn luyện sức khỏe và thể lực' },
    ];
  }

  /**
   * Danh mục môn học Tiểu học theo khối lớp (TT27)
   */
  getTT27Subjects(grade: number): EvaluationCriterionDefinition[] {
    const baseSubjects: EvaluationCriterionDefinition[] = [
      { code: 'TIENG_VIET', name: 'Tiếng Việt', domain: 'SUBJECT', isPeriodicScoreApplicable: true },
      { code: 'TOAN', name: 'Toán', domain: 'SUBJECT', isPeriodicScoreApplicable: true },
      { code: 'DAO_DUC', name: 'Đạo đức', domain: 'SUBJECT', isPeriodicScoreApplicable: false },
      { code: 'GD_THE_CHAT', name: 'Giáo dục thể chất', domain: 'SUBJECT', isPeriodicScoreApplicable: false },
      { code: 'AM_NHAC', name: 'Âm nhạc', domain: 'SUBJECT', isPeriodicScoreApplicable: false },
      { code: 'MI_THUAT', name: 'Mĩ thuật', domain: 'SUBJECT', isPeriodicScoreApplicable: false },
      { code: 'HD_TRAI_NGHIEM', name: 'Hoạt động trải nghiệm', domain: 'SUBJECT', isPeriodicScoreApplicable: false },
    ];

    if (grade === 1 || grade === 2) {
      baseSubjects.push({ code: 'TN_XA_HOI', name: 'Tự nhiên và Xã hội', domain: 'SUBJECT', isPeriodicScoreApplicable: false });
    } else if (grade === 3) {
      baseSubjects.push(
        { code: 'TN_XA_HOI', name: 'Tự nhiên và Xã hội', domain: 'SUBJECT', isPeriodicScoreApplicable: false },
        { code: 'TIN_HOC_CONG_NGHE', name: 'Tin học và Công nghệ', domain: 'SUBJECT', isPeriodicScoreApplicable: false },
        { code: 'NGOAI_NGU_1', name: 'Ngoại ngữ 1 (Tiếng Anh)', domain: 'SUBJECT', isPeriodicScoreApplicable: true }
      );
    } else {
      // Khối 4, 5
      baseSubjects.push(
        { code: 'KHOA_HOC', name: 'Khoa học', domain: 'SUBJECT', isPeriodicScoreApplicable: true },
        { code: 'LICH_SU_DIA_LI', name: 'Lịch sử và Địa lí', domain: 'SUBJECT', isPeriodicScoreApplicable: true },
        { code: 'TIN_HOC', name: 'Tin học', domain: 'SUBJECT', isPeriodicScoreApplicable: true },
        { code: 'CONG_NGHE', name: 'Công nghệ', domain: 'SUBJECT', isPeriodicScoreApplicable: false },
        { code: 'NGOAI_NGU_1', name: 'Ngoại ngữ 1 (Tiếng Anh)', domain: 'SUBJECT', isPeriodicScoreApplicable: true }
      );
    }

    return baseSubjects;
  }

  /**
   * Danh mục môn học THCS theo TT22/2021 (Khối 6-9)
   */
  getTT22LowerSecondarySubjects(): EvaluationCriterionDefinition[] {
    return [
      { code: 'NGU_VAN', name: 'Ngữ văn', domain: 'SUBJECT_SCORE', isCommentSubjectOnly: false },
      { code: 'TOAN', name: 'Toán', domain: 'SUBJECT_SCORE', isCommentSubjectOnly: false },
      { code: 'NGOAI_NGU_1', name: 'Ngoại ngữ 1 (Tiếng Anh)', domain: 'SUBJECT_SCORE', isCommentSubjectOnly: false },
      { code: 'GDCD', name: 'Giáo dục công dân', domain: 'SUBJECT_SCORE', isCommentSubjectOnly: false },
      { code: 'LS_DL', name: 'Lịch sử và Địa lí', domain: 'SUBJECT_SCORE', isCommentSubjectOnly: false },
      { code: 'KHTN', name: 'Khoa học tự nhiên', domain: 'SUBJECT_SCORE', isCommentSubjectOnly: false },
      { code: 'CONG_NGHE', name: 'Công nghệ', domain: 'SUBJECT_SCORE', isCommentSubjectOnly: false },
      { code: 'TIN_HOC', name: 'Tin học', domain: 'SUBJECT_SCORE', isCommentSubjectOnly: false },
      { code: 'GD_THE_CHAT', name: 'Giáo dục thể chất', domain: 'SUBJECT_COMMENT', isCommentSubjectOnly: true },
      { code: 'AM_NHAC', name: 'Âm nhạc', domain: 'SUBJECT_COMMENT', isCommentSubjectOnly: true },
      { code: 'MI_THUAT', name: 'Mĩ thuật', domain: 'SUBJECT_COMMENT', isCommentSubjectOnly: true },
      { code: 'HDTN_HN', name: 'Hoạt động trải nghiệm, hướng nghiệp', domain: 'SUBJECT_COMMENT', isCommentSubjectOnly: true },
      { code: 'GD_DIA_PHUONG', name: 'Nội dung giáo dục địa phương', domain: 'SUBJECT_COMMENT', isCommentSubjectOnly: true },
    ];
  }

  /**
   * Danh mục môn học THPT theo TT22/2021 (Khối 10-12)
   */
  getTT22UpperSecondarySubjects(): EvaluationCriterionDefinition[] {
    return [
      { code: 'NGU_VAN', name: 'Ngữ văn', domain: 'SUBJECT_SCORE', isCommentSubjectOnly: false },
      { code: 'TOAN', name: 'Toán', domain: 'SUBJECT_SCORE', isCommentSubjectOnly: false },
      { code: 'NGOAI_NGU_1', name: 'Ngoại ngữ 1 (Tiếng Anh)', domain: 'SUBJECT_SCORE', isCommentSubjectOnly: false },
      { code: 'LICH_SU', name: 'Lịch sử', domain: 'SUBJECT_SCORE', isCommentSubjectOnly: false },
      { code: 'GD_THE_CHAT', name: 'Giáo dục thể chất', domain: 'SUBJECT_COMMENT', isCommentSubjectOnly: true },
      { code: 'GDQP_AN', name: 'Giáo dục quốc phòng và an ninh', domain: 'SUBJECT_COMMENT', isCommentSubjectOnly: true },
      { code: 'HDTN_HN', name: 'Hoạt động trải nghiệm, hướng nghiệp', domain: 'SUBJECT_COMMENT', isCommentSubjectOnly: true },
      { code: 'GD_DIA_PHUONG', name: 'Nội dung giáo dục địa phương', domain: 'SUBJECT_COMMENT', isCommentSubjectOnly: true },
      // Môn lựa chọn
      { code: 'DIA_LI', name: 'Địa lí', domain: 'SUBJECT_SCORE', isCommentSubjectOnly: false },
      { code: 'GDKT_PL', name: 'Giáo dục kinh tế và pháp luật', domain: 'SUBJECT_SCORE', isCommentSubjectOnly: false },
      { code: 'VAT_LI', name: 'Vật lí', domain: 'SUBJECT_SCORE', isCommentSubjectOnly: false },
      { code: 'HOA_HOC', name: 'Hóa học', domain: 'SUBJECT_SCORE', isCommentSubjectOnly: false },
      { code: 'SINH_HOC', name: 'Sinh học', domain: 'SUBJECT_SCORE', isCommentSubjectOnly: false },
      { code: 'CONG_NGHE', name: 'Công nghệ', domain: 'SUBJECT_SCORE', isCommentSubjectOnly: false },
      { code: 'TIN_HOC', name: 'Tin học', domain: 'SUBJECT_SCORE', isCommentSubjectOnly: false },
      { code: 'AM_NHAC', name: 'Âm nhạc', domain: 'SUBJECT_COMMENT', isCommentSubjectOnly: true },
      { code: 'MI_THUAT', name: 'Mĩ thuật', domain: 'SUBJECT_COMMENT', isCommentSubjectOnly: true },
    ];
  }

  /**
   * Thang đánh giá Môn học Tiểu học (TT27)
   */
  getTT27SubjectScales(): EvaluationScaleOption[] {
    return [
      { code: 'HOAN_THANH_TOT', label: 'Hoàn thành tốt', shortLabel: 'T', colorVariant: 'success' },
      { code: 'HOAN_THANH', label: 'Hoàn thành', shortLabel: 'H', colorVariant: 'primary' },
      { code: 'CHUA_HOAN_THANH', label: 'Chưa hoàn thành', shortLabel: 'C', colorVariant: 'warning' },
    ];
  }

  /**
   * Thang đánh giá Phẩm chất và Năng lực Tiểu học (TT27)
   */
  getTT27QualityCapacityScales(): EvaluationScaleOption[] {
    return [
      { code: 'TOT', label: 'Tốt', shortLabel: 'T', colorVariant: 'success' },
      { code: 'DAT', label: 'Đạt', shortLabel: 'Đ', colorVariant: 'primary' },
      { code: 'CAN_CO_GANG', label: 'Cần cố gắng', shortLabel: 'C', colorVariant: 'warning' },
    ];
  }

  /**
   * Thang đánh giá Tổng hợp cuối năm Tiểu học (TT27)
   */
  getTT27EndYearSummaryScales(): EvaluationScaleOption[] {
    return [
      { code: 'HOAN_THANH_XUAT_SAC', label: 'Hoàn thành xuất sắc', shortLabel: 'HTXS', colorVariant: 'success' },
      { code: 'HOAN_THANH_TOT', label: 'Hoàn thành tốt', shortLabel: 'HTT', colorVariant: 'primary' },
      { code: 'HOAN_THANH', label: 'Hoàn thành', shortLabel: 'HT', colorVariant: 'neutral' },
      { code: 'CHUA_HOAN_THANH', label: 'Chưa hoàn thành', shortLabel: 'CHT', colorVariant: 'danger' },
    ];
  }

  /**
   * Thang Rèn luyện THCS / THPT (TT22/2021)
   */
  getTT22ConductScales(): EvaluationScaleOption[] {
    return [
      { code: 'TOT', label: 'Tốt', shortLabel: 'Tốt', colorVariant: 'success' },
      { code: 'KHA', label: 'Khá', shortLabel: 'Khá', colorVariant: 'primary' },
      { code: 'DAT', label: 'Đạt', shortLabel: 'Đạt', colorVariant: 'warning' },
      { code: 'CHUA_DAT', label: 'Chưa đạt', shortLabel: 'Chưa đạt', colorVariant: 'danger' },
    ];
  }

  /**
   * Thang Học tập THCS / THPT (TT22/2021)
   */
  getTT22LearningScales(): EvaluationScaleOption[] {
    return [
      { code: 'TOT', label: 'Tốt', shortLabel: 'Tốt', colorVariant: 'success' },
      { code: 'KHA', label: 'Khá', shortLabel: 'Khá', colorVariant: 'primary' },
      { code: 'DAT', label: 'Đạt', shortLabel: 'Đạt', colorVariant: 'warning' },
      { code: 'CHUA_DAT', label: 'Chưa đạt', shortLabel: 'Chưa đạt', colorVariant: 'danger' },
    ];
  }

  /**
   * Thang Môn đánh giá bằng nhận xét THCS / THPT (TT22/2021)
   */
  getTT22CommentSubjectScales(): EvaluationScaleOption[] {
    return [
      { code: 'DAT', label: 'Đạt', shortLabel: 'Đ', colorVariant: 'success' },
      { code: 'CHUA_DAT', label: 'Chưa đạt', shortLabel: 'CĐ', colorVariant: 'danger' },
    ];
  }

  /**
   * Lấy nhãn hiển thị cho một mã mức (level code)
   */
  getLevelLabel(levelCode: string | null | undefined, domain: EvaluationDomain): string {
    if (!levelCode) return 'Chưa đánh giá';

    if (domain === 'SUBJECT') {
      const match = this.getTT27SubjectScales().find((s) => s.code === levelCode);
      return match ? match.label : levelCode;
    }

    if (domain === 'QUALITY' || domain === 'GENERAL_CAPACITY' || domain === 'SPECIFIC_CAPACITY') {
      const match = this.getTT27QualityCapacityScales().find((s) => s.code === levelCode);
      return match ? match.label : levelCode;
    }

    if (domain === 'SUMMARY') {
      const match = this.getTT27EndYearSummaryScales().find((s) => s.code === levelCode);
      return match ? match.label : levelCode;
    }

    if (domain === 'CONDUCT') {
      const match = this.getTT22ConductScales().find((s) => s.code === levelCode);
      return match ? match.label : levelCode;
    }

    if (domain === 'LEARNING') {
      const match = this.getTT22LearningScales().find((s) => s.code === levelCode);
      return match ? match.label : levelCode;
    }

    if (domain === 'SUBJECT_COMMENT') {
      const match = this.getTT22CommentSubjectScales().find((s) => s.code === levelCode);
      return match ? match.label : levelCode;
    }

    return levelCode;
  }
}

export const evaluationProfileService = new EvaluationProfileService();
