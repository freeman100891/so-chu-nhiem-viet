import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../shared/components/Card';
import { Input } from '../../shared/components/Input';
import { Button } from '../../shared/components/Button';
import { themeService, THEME_OPTIONS, type ThemeId } from '../../core/services/theme.service';
import { validateImageFile, resizeImageFile } from '../../shared/utilities/image';
import { academicYearService } from '../../core/services/academic-year.service';
import { termService } from '../../core/services/term.service';
import { teacherProfileRepository } from '../../core/repositories/teacher-profile.repository';
import { settingsRepository } from '../../core/repositories/settings.repository';
import { OnboardingRestoreModal } from './OnboardingRestoreModal';
import {
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  User,
  School,
  Calendar,
  BookOpen,
  Palette,
  CheckCircle2,
  Upload,
  ShieldCheck,
  Award,
  FileSpreadsheet,
  Sparkles,
  DatabaseBackup,
} from 'lucide-react';

export const OnboardingWizard: React.FC = () => {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;

  // Restore Modal State (F-083)
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState<string>('');
  const [schoolName, setSchoolName] = useState('');

  // Academic Year State
  const [yearName, setYearName] = useState('2026 - 2027');
  const [yearStartDate, setYearStartDate] = useState('2026-09-05');
  const [yearEndDate, setYearEndDate] = useState('2027-05-31');

  // Terms State
  const [term1Name, setTerm1Name] = useState('Học kỳ 1');
  const [term1Start, setTerm1Start] = useState('2026-09-05');
  const [term1End, setTerm1End] = useState('2027-01-15');

  const [term2Name, setTerm2Name] = useState('Học kỳ 2');
  const [term2Start, setTerm2Start] = useState('2027-01-16');
  const [term2End, setTerm2End] = useState('2027-05-31');

  // Theme state
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>('military');

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Avatar Upload Handler
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setErrors((prev) => ({ ...prev, avatar: validation.error || 'Ảnh không hợp lệ' }));
      return;
    }

    try {
      const resizedBase64 = await resizeImageFile(file, 256, 256);
      setAvatar(resizedBase64);
      setErrors((prev) => ({ ...prev, avatar: '' }));
    } catch (err) {
      console.error('Error resizing avatar:', err);
      setErrors((prev) => ({ ...prev, avatar: 'Không thể xử lý ảnh' }));
    }
  };

  // Step Validation & Navigation
  const handleNextStep = () => {
    setErrors({});

    if (currentStep === 2) {
      const newErrors: Record<string, string> = {};
      if (!fullName.trim() || fullName.trim().length < 2) {
        newErrors.fullName = 'Họ và tên giáo viên tối thiểu 2 ký tự';
      }
      if (!phone.trim() || !/^(0[3|5|7|8|9])+([0-9]{8})$/.test(phone.trim())) {
        newErrors.phone = 'Số điện thoại không hợp lệ (VD: 0912345678)';
      }
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
    }

    if (currentStep === 3) {
      if (!schoolName.trim() || schoolName.trim().length < 2) {
        setErrors({ schoolName: 'Tên trường học tối thiểu 2 ký tự' });
        return;
      }
    }

    if (currentStep === 4) {
      try {
        academicYearService.validateAcademicYear({
          name: yearName,
          startDate: yearStartDate,
          endDate: yearEndDate,
        });
      } catch (err: unknown) {
        setErrors({ year: (err as Error).message || 'Thông tin năm học không hợp lệ' });
        return;
      }
    }

    if (currentStep === 5) {
      try {
        const dummyYear = {
          id: 'temp',
          name: yearName,
          startDate: yearStartDate,
          endDate: yearEndDate,
          isActive: true,
          createdAt: '',
          updatedAt: '',
          deletedAt: null,
        };

        termService.validateTermsForAcademicYear(dummyYear, [
          { name: term1Name, startDate: term1Start, endDate: term1End },
          { name: term2Name, startDate: term2Start, endDate: term2End },
        ]);
      } catch (err: unknown) {
        setErrors({ terms: (err as Error).message || 'Thông tin học kỳ không hợp lệ' });
        return;
      }
    }

    if (currentStep === 6) {
      themeService.applyTheme(selectedTheme);
    }

    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Final Submit Handler
  const handleFinishOnboarding = async () => {
    setSubmitting(true);
    setErrors({});

    try {
      // 1. Save Teacher Profile
      await teacherProfileRepository.saveProfile({
        fullName,
        schoolName,
        phone,
        email,
        avatar,
      });

      // 2. Create Academic Year
      const year = await academicYearService.createAcademicYear({
        name: yearName,
        startDate: yearStartDate,
        endDate: yearEndDate,
        isActive: true,
      });

      // 3. Create Terms
      await termService.createTermsForAcademicYear(year.id, [
        { name: term1Name, startDate: term1Start, endDate: term1End },
        { name: term2Name, startDate: term2Start, endDate: term2End },
      ]);

      // 4. Save Settings & Theme
      await settingsRepository.updateSettings({
        theme: selectedTheme,
        activeAcademicYearId: year.id,
      });
      await themeService.applyTheme(selectedTheme);

      // Navigate to Dashboard
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      console.error('Error completing onboarding:', err);
      setErrors({ finish: (err as Error).message || 'Không thể lưu cài đặt ban đầu' });
    } finally {
      setSubmitting(false);
    }
  };

  const stepTitles = [
    'Bắt đầu',
    'Giáo viên',
    'Trường học',
    'Năm học',
    'Học kỳ',
    'Giao diện',
    'Hoàn tất',
  ];

  return (
    <div className="min-h-screen bg-app-base text-app-main flex flex-col items-center justify-center p-4 sm:p-6 transition-colors duration-300">
      {/* Restore Modal */}
      <OnboardingRestoreModal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
      />

      <div className="max-w-2xl w-full space-y-6 my-auto animate-fadeIn">
        {/* App Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-app-surface border border-app shadow-xs">
            <GraduationCap className="w-7 h-7 text-app-primary" />
            <span className="font-extrabold text-lg tracking-tight text-app-main">Sổ Chủ Nhiệm Việt Offline</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-app-primary-light text-app-primary font-bold">v1.0.0</span>
          </div>
        </div>

        {/* Multi-step Visual Stepper */}
        <div className="bg-app-surface border border-app rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-app-muted">
            <span className="uppercase tracking-wider">
              {currentStep === 1 ? 'Khởi Tạo Hệ Thống' : `Thiết Lập Ban Đầu (Bước ${currentStep}/${totalSteps})`}
            </span>
            <span className="font-mono text-app-primary">{Math.round((currentStep / totalSteps) * 100)}%</span>
          </div>

          {/* Stepper Dots & Labels */}
          <div className="grid grid-cols-7 gap-1 items-center pt-1">
            {stepTitles.map((title, idx) => {
              const stepNum = idx + 1;
              const isCompleted = stepNum < currentStep;
              const isCurrent = stepNum === currentStep;

              return (
                <div key={title} className="flex flex-col items-center gap-1 text-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCompleted
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-app-primary text-app-primary-fg ring-4 ring-app-primary-light scale-110 shadow-xs'
                        : 'bg-app-surface-hover text-app-muted border border-app'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : stepNum}
                  </div>
                  <span className={`text-[10px] truncate max-w-full ${isCurrent ? 'font-bold text-app-primary' : 'text-app-muted'}`}>
                    {title}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress Bar Line */}
          <div className="w-full bg-app-surface-hover rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-app-primary h-full transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Welcome & Setup Choice (F-083) */}
        {currentStep === 1 && (
          <Card className="p-6 sm:p-8 space-y-6 text-center">
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-app-main tracking-tight">
                Chào mừng Thầy/Cô Giáo Chủ Nhiệm
              </h2>
              <p className="text-sm text-app-muted max-w-lg mx-auto leading-relaxed">
                Ứng dụng <strong>Sổ Chủ Nhiệm Việt Offline</strong> hoạt động <strong>100% bảo mật Offline</strong> trên máy tính. Thầy/Cô muốn bắt đầu bằng cách nào?
              </p>
            </div>

            {/* DUAL CHOICES GRID (F-083) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left pt-1">
              {/* Choice 1: New Setup */}
              <div
                onClick={handleNextStep}
                className="p-5 rounded-2xl border-2 border-app hover:border-app-primary bg-app-surface hover:bg-app-surface-hover/50 cursor-pointer transition-all flex flex-col justify-between space-y-4 group shadow-xs hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-app-primary-light text-app-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-app-main group-hover:text-app-primary transition-colors">
                      Thiết lập mới từ đầu
                    </h3>
                    <p className="text-xs text-app-muted mt-1 leading-relaxed">
                      Dành cho Thầy/Cô lần đầu sử dụng. Khởi tạo hồ sơ giáo viên, năm học và lớp chủ nhiệm.
                    </p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  className="w-full justify-between"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Tạo hồ sơ mới
                </Button>
              </div>

              {/* Choice 2: Restore from Backup */}
              <div
                onClick={() => setShowRestoreModal(true)}
                className="p-5 rounded-2xl border-2 border-app hover:border-emerald-500 bg-app-surface hover:bg-app-surface-hover/50 cursor-pointer transition-all flex flex-col justify-between space-y-4 group shadow-xs hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <DatabaseBackup className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-app-main group-hover:text-emerald-600 transition-colors">
                      Khôi phục từ bản sao lưu
                    </h3>
                    <p className="text-xs text-app-muted mt-1 leading-relaxed">
                      Đã có file sao lưu <strong className="font-mono text-emerald-600">.gvcn-backup</strong>? Khôi phục toàn bộ dữ liệu chỉ trong vài giây.
                    </p>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full justify-between hover:border-emerald-500 hover:text-emerald-600"
                  rightIcon={<Upload className="w-4 h-4 text-emerald-600" />}
                >
                  Chọn file sao lưu
                </Button>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2 border-t border-app">
              <div className="p-3 rounded-xl border border-app bg-app-surface-hover/30 space-y-1">
                <div className="flex items-center gap-1.5 text-app-primary font-bold text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>100% Offline</span>
                </div>
                <p className="text-[10px] text-app-muted">Lưu IndexedDB cục bộ trên máy, bảo mật tuyệt đối.</p>
              </div>

              <div className="p-3 rounded-xl border border-app bg-app-surface-hover/30 space-y-1">
                <div className="flex items-center gap-1.5 text-app-primary font-bold text-xs">
                  <Award className="w-3.5 h-3.5 shrink-0" />
                  <span>Nề Nếp Thi Đua</span>
                </div>
                <p className="text-[10px] text-app-muted">17 cấp bậc quân hàm, 5 cấp avatar và bảng vàng.</p>
              </div>

              <div className="p-3 rounded-xl border border-app bg-app-surface-hover/30 space-y-1">
                <div className="flex items-center gap-1.5 text-app-primary font-bold text-xs">
                  <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                  <span>Nhập/Xuất Excel</span>
                </div>
                <p className="text-[10px] text-app-muted">Nhập danh sách từ Excel, xuất báo cáo PDF A4.</p>
              </div>
            </div>
          </Card>
        )}


        {/* Step 2: Teacher Info */}
        {currentStep === 2 && (
          <Card title="Bước 2/7: Thông tin Giáo viên Chủ nhiệm">
            <div className="space-y-5">
              <div className="flex flex-col items-center gap-3 py-2">
                {avatar ? (
                  <img src={avatar} alt="Avatar Preview" className="w-24 h-24 rounded-full object-cover border-4 border-app-primary shadow-sm" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-app-primary-light text-app-primary flex items-center justify-center border-2 border-dashed border-app-primary shadow-xs">
                    <User className="w-12 h-12" />
                  </div>
                )}
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-app bg-app-surface text-xs font-bold text-app-main hover:bg-app-surface-hover transition-all shadow-xs">
                  <Upload className="w-4 h-4 text-app-primary" />
                  <span>Tải ảnh đại diện (Tùy chọn)</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </label>
                {errors.avatar && <span className="text-xs font-semibold text-red-500">{errors.avatar}</span>}
              </div>

              <Input
                label="Họ và tên Giáo viên"
                required
                placeholder="Ví dụ: Nguyễn Văn An"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                error={errors.fullName}
              />
              <Input
                label="Số điện thoại liên hệ"
                required
                placeholder="Ví dụ: 0912345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={errors.phone}
              />
              <Input
                label="Email liên hệ (Không bắt buộc)"
                placeholder="giao-vien@school.edu.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </Card>
        )}

        {/* Step 3: School Info */}
        {currentStep === 3 && (
          <Card title="Bước 3/7: Thông tin Trường học">
            <div className="space-y-4 py-2">
              <Input
                label="Tên Trường học / Cơ sở giáo dục"
                required
                placeholder="Ví dụ: THPT Lê Hồng Phong"
                leftIcon={<School className="w-4 h-4 text-app-muted" />}
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                error={errors.schoolName}
              />
              <div className="p-3 rounded-xl bg-app-surface-hover/50 border border-app text-xs text-app-muted">
                <strong>Gợi ý:</strong> Tên trường học sẽ được in chính thức trên đầu các trang Báo cáo Chuyên cần, Điểm thi đua và Sổ Liên Lạc Phụ Huynh.
              </div>
            </div>
          </Card>
        )}

        {/* Step 4: Academic Year */}
        {currentStep === 4 && (
          <Card title="Bước 4/7: Tạo Năm học Đầu tiên">
            <div className="space-y-4 py-2">
              <Input
                label="Tên Năm học"
                required
                placeholder="Ví dụ: 2026 - 2027"
                leftIcon={<Calendar className="w-4 h-4 text-app-muted" />}
                value={yearName}
                onChange={(e) => setYearName(e.target.value)}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Ngày bắt đầu Năm học"
                  type="date"
                  required
                  value={yearStartDate}
                  onChange={(e) => setYearStartDate(e.target.value)}
                />
                <Input
                  label="Ngày kết thúc Năm học"
                  type="date"
                  required
                  value={yearEndDate}
                  onChange={(e) => setYearEndDate(e.target.value)}
                />
              </div>
              {errors.year && <span className="text-xs font-semibold text-red-600 block">{errors.year}</span>}
            </div>
          </Card>
        )}

        {/* Step 5: Terms */}
        {currentStep === 5 && (
          <Card title="Bước 5/7: Tạo các Học kỳ">
            <div className="space-y-5 py-2">
              <div className="p-4 rounded-xl border border-app bg-app-surface-hover/40 space-y-3">
                <h4 className="text-sm font-bold text-app-main flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-app-primary" /> Học kỳ 1
                </h4>
                <Input
                  label="Tên Học kỳ 1"
                  value={term1Name}
                  onChange={(e) => setTerm1Name(e.target.value)}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Ngày bắt đầu HK1"
                    type="date"
                    value={term1Start}
                    onChange={(e) => setTerm1Start(e.target.value)}
                  />
                  <Input
                    label="Ngày kết thúc HK1"
                    type="date"
                    value={term1End}
                    onChange={(e) => setTerm1End(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-app bg-app-surface-hover/40 space-y-3">
                <h4 className="text-sm font-bold text-app-main flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-app-primary" /> Học kỳ 2
                </h4>
                <Input
                  label="Tên Học kỳ 2"
                  value={term2Name}
                  onChange={(e) => setTerm2Name(e.target.value)}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Ngày bắt đầu HK2"
                    type="date"
                    value={term2Start}
                    onChange={(e) => setTerm2Start(e.target.value)}
                  />
                  <Input
                    label="Ngày kết thúc HK2"
                    type="date"
                    value={term2End}
                    onChange={(e) => setTerm2End(e.target.value)}
                  />
                </div>
              </div>
              {errors.terms && <span className="text-xs font-semibold text-red-600 block">{errors.terms}</span>}
            </div>
          </Card>
        )}

        {/* Step 6: Theme Picker */}
        {currentStep === 6 && (
          <Card title="Bước 6/7: Chọn Chủ đề Giao diện Văn hóa Việt Nam">
            <div className="space-y-3 py-2">
              <p className="text-xs text-app-muted">Chọn 1 trong 3 chủ đề thiết kế đặc trưng dành cho giáo viên Việt Nam:</p>
              {THEME_OPTIONS.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedTheme(item.id);
                    themeService.applyTheme(item.id);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between min-h-[56px] ${
                    selectedTheme === item.id
                      ? 'border-2 border-app-primary bg-app-primary-light shadow-xs font-bold'
                      : 'border-app hover:bg-app-surface-hover'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <span className="w-4 h-4 rounded-full border border-black/20" style={{ backgroundColor: item.primaryColor }} />
                      <span className="w-4 h-4 rounded-full border border-black/20" style={{ backgroundColor: item.secondaryColor }} />
                      <span className="w-4 h-4 rounded-full border border-black/20" style={{ backgroundColor: item.accentColor }} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-app-main">{item.name}</h4>
                      <p className="text-xs text-app-muted">{item.subtitle}</p>
                    </div>
                  </div>
                  {selectedTheme === item.id && <Palette className="w-5 h-5 text-app-primary" />}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Step 7: Confirmation */}
        {currentStep === 7 && (
          <Card className="text-center p-6 sm:p-8 space-y-5">
            <div className="p-4 bg-emerald-100 text-emerald-700 rounded-full inline-flex mb-1">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-app-main tracking-tight">Hoàn tất Cấu hình</h3>
              <p className="text-sm text-app-muted max-w-md mx-auto">
                Cấu hình ban đầu đã sẵn sàng! Thông tin sẽ được lưu vào cơ sở dữ liệu IndexedDB của thiết bị.
              </p>
            </div>

            {/* Summary Box */}
            <div className="p-4 rounded-xl border border-app bg-app-surface-hover/50 text-left text-xs space-y-2 font-mono">
              <p><strong>Giáo viên:</strong> {fullName} ({phone})</p>
              <p><strong>Trường học:</strong> {schoolName}</p>
              <p><strong>Năm học:</strong> {yearName} ({yearStartDate} ➔ {yearEndDate})</p>
              <p><strong>Giao diện:</strong> {THEME_OPTIONS.find((t) => t.id === selectedTheme)?.name}</p>
            </div>

            {errors.finish && <span className="text-xs font-semibold text-red-600 block">{errors.finish}</span>}

            <Button
              variant="primary"
              size="lg"
              className="w-full mt-4"
              leftIcon={<Sparkles className="w-5 h-5" />}
              isLoading={submitting}
              onClick={handleFinishOnboarding}
            >
              Hoàn tất & Đến Trang Chủ
            </Button>
          </Card>
        )}

        {/* Wizard Footer Controls */}
        {currentStep > 1 && currentStep < 7 && (
          <div className="flex items-center justify-between pt-2">
            <Button variant="secondary" onClick={handlePrevStep} leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Quay lại
            </Button>
            <Button variant="primary" onClick={handleNextStep} rightIcon={<ArrowRight className="w-4 h-4" />}>
              Tiếp theo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
