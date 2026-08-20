import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../shared/components/PageHeader';
import { Button } from '../../shared/components/Button';
import { Card } from '../../shared/components/Card';
import { Input } from '../../shared/components/Input';
import { Select } from '../../shared/components/Select';
import { Badge } from '../../shared/components/Badge';
import { useToast } from '../../shared/hooks/useToast';
import { liveClassSessionService } from '../../core/services/live-classroom/live-session.service';
import { classRepository } from '../../core/repositories/class.repository';
import { settingsRepository } from '../../core/repositories/settings.repository';
import { academicYearRepository } from '../../core/repositories/academic-year.repository';
import { db } from '../../core/database/db';
import type { ClassRoom, MeetingPlatform } from '../../core/database/types';
import { getTodayDateString } from '../../shared/utilities/date';
import { CuteCloudSVG, CuteStarSVG, CutePencilSVG, CuteRainbowSVG } from '../../shared/components/CuteDecorations';
import { ArrowLeft, ArrowRight, Play, Save, Video, Users, CheckCircle2, BookOpen } from 'lucide-react';

export const CreateLiveSessionPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [wizardStep, setWizardStep] = useState<number>(1);
  const [classList, setClassList] = useState<ClassRoom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [activeStudentCount, setActiveStudentCount] = useState<number>(0);

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Toán học');
  const [sessionDate, setSessionDate] = useState(getTodayDateString());
  const [meetingPlatform, setMeetingPlatform] = useState<MeetingPlatform>('meet');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const settings = await settingsRepository.getSettings();
        let yearId = settings.activeAcademicYearId;
        if (!yearId) {
          const year = await academicYearRepository.getCurrentYear();
          yearId = year?.id;
        }

        if (yearId) {
          const classes = await classRepository.findByAcademicYear(yearId);
          setClassList(classes);
          let defaultCls = classes[0]?.id || '';
          if (settings.activeClassId && classes.some((c) => c.id === settings.activeClassId)) {
            defaultCls = settings.activeClassId;
          }
          setSelectedClassId(defaultCls);
        }
      } catch (err) {
        console.error('Error loading classes for live session:', err);
      }
    };
    loadClasses();
  }, []);

  // Fetch active student count whenever selected class changes
  useEffect(() => {
    const countActive = async () => {
      if (!selectedClassId) {
        setActiveStudentCount(0);
        return;
      }
      const count = await db.classEnrollments
        .where('classId')
        .equals(selectedClassId)
        .filter((e) => e.status === 'Active' && !e.deletedAt)
        .count();
      setActiveStudentCount(count);
    };
    countActive();
  }, [selectedClassId]);

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step >= 1 && !selectedClassId) {
      newErrors.classId = 'Vui lòng chọn Lớp học';
    }
    if (step >= 2 && !subject.trim()) {
      newErrors.subject = 'Vui lòng nhập Môn học';
    }
    if (step >= 3 && (!title.trim() || title.trim().length < 2)) {
      newErrors.title = 'Tên bài hoặc chủ đề tối thiểu 2 ký tự';
    }
    if (step >= 6 && meetingUrl.trim()) {
      if (!meetingUrl.trim().startsWith('https://')) {
        newErrors.meetingUrl = 'Liên kết phòng học phải bắt đầu bằng https://';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(wizardStep)) {
      setWizardStep((prev) => Math.min(prev + 1, 8));
    }
  };

  const handlePrevStep = () => {
    setWizardStep((prev) => Math.max(prev - 1, 1));
  };

  const handleCreateDraft = async () => {
    if (!validateStep(8)) return;

    setSubmitting(true);
    try {
      const session = await liveClassSessionService.createDraft({
        classId: selectedClassId,
        title,
        subject,
        sessionDate,
        meetingPlatform,
        meetingUrl: meetingUrl.trim(),
      });
      showSuccess('Tạo bản nháp thành công', `Đã lưu bản nháp "${title}"`);
      navigate(`/live-classroom/${session.id}`);
    } catch (err: unknown) {
      showError('Lỗi khởi tạo phiên', (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartImmediately = async () => {
    if (!validateStep(8)) return;

    setSubmitting(true);
    try {
      const draft = await liveClassSessionService.createDraft({
        classId: selectedClassId,
        title,
        subject,
        sessionDate,
        meetingPlatform,
        meetingUrl: meetingUrl.trim(),
      });

      const activeSession = await liveClassSessionService.startSession(draft.id);
      showSuccess('Bắt đầu lớp học thành công', `Lớp học "${title}" đã bắt đầu.`);
      navigate(`/live-classroom/${activeSession.id}`);
    } catch (err: unknown) {
      showError('Không thể bắt đầu lớp học', (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedClassName = classList.find((c) => c.id === selectedClassId)?.name || 'Chưa chọn';

  return (
    <div className="space-y-6 animate-fadeIn max-w-3xl mx-auto">
      <PageHeader
        title="Wizard Mở Lớp Học Trực Tuyến"
        description="Quy trình 8 bước thiết lập nhanh tiết dạy từ xa thân thiện với học sinh"
        action={
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/live-classroom')}>
            Quay lại
          </Button>
        }
      />

      {/* CUTE WIZARD STEPPER BAR */}
      <Card className="p-4 bg-gradient-to-r from-blue-50/60 via-emerald-50/40 to-purple-50/60 border-2 border-blue-200 rounded-3xl relative overflow-hidden">
        <div className="absolute top-2 right-4 opacity-30 pointer-events-none">
          <CuteRainbowSVG className="w-16 h-16" />
        </div>

        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-2">
            <CuteCloudSVG className="w-6 h-6" />
            <span className="text-xs font-extrabold text-blue-900 uppercase tracking-wider">
              Bước {wizardStep} / 8: {
                [
                  'Chọn lớp',
                  'Chọn môn học',
                  'Nhập tên bài',
                  'Chọn ngày',
                  'Nền tảng họp',
                  'Liên kết phòng',
                  'Xem sĩ số',
                  'Bắt đầu',
                ][wizardStep - 1]
              }
            </span>
          </div>
          <Badge variant="primary" className="bg-blue-600 text-white">
            {Math.round((wizardStep / 8) * 100)}% Hoàn thành
          </Badge>
        </div>

        {/* STEPPER DOTS */}
        <div className="grid grid-cols-8 gap-1.5">
          {Array.from({ length: 8 }).map((_, idx) => {
            const stepNum = idx + 1;
            const isDone = stepNum < wizardStep;
            const isCurrent = stepNum === wizardStep;
            return (
              <button
                key={stepNum}
                onClick={() => {
                  if (stepNum < wizardStep || validateStep(wizardStep)) {
                    setWizardStep(stepNum);
                  }
                }}
                className={`h-2.5 rounded-full transition-all ${
                  isCurrent
                    ? 'bg-blue-600 ring-2 ring-blue-300'
                    : isDone
                    ? 'bg-emerald-500'
                    : 'bg-slate-200'
                }`}
                title={`Bước ${stepNum}`}
              />
            );
          })}
        </div>
      </Card>

      {/* STEP CONTENT CARDS */}
      <Card className="p-6 rounded-3xl border-2 border-slate-100 shadow-sm relative">
        {/* STEP 1: CHỌN LỚP */}
        {wizardStep === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-800">1. Chọn Lớp học sẽ dạy</h3>
                <p className="text-xs text-slate-500">Danh sách các lớp chủ nhiệm thuộc năm học hiện tại.</p>
              </div>
            </div>

            <Select
              label="Lớp học"
              required
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              options={classList.map((c) => ({ value: c.id, label: `Lớp ${c.name} (Khối ${c.grade})` }))}
              error={errors.classId}
            />
          </div>
        )}

        {/* STEP 2: CHỌN MÔN HỌC */}
        {wizardStep === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-teal-100 text-teal-700 rounded-2xl">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-800">2. Chọn hoặc Nhập Môn học</h3>
                <p className="text-xs text-slate-500">Môn học sẽ hiển thị ở bảng điều khiển và màn hình chiếu.</p>
              </div>
            </div>

            <Input
              label="Tên Môn học"
              required
              placeholder="Ví dụ: Toán, Ngữ Văn, Tiếng Anh, Khoa Học..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              error={errors.subject}
            />

            <div className="flex items-center gap-2 flex-wrap pt-1">
              {['Toán học', 'Tiếng Việt', 'Tiếng Anh', 'Khoa học', 'Lịch sử & Địa lý', 'Đạo đức', 'Âm nhạc', 'Mỹ thuật'].map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setSubject(sub)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                    subject === sub ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: NHẬP TÊN BÀI / CHỦ ĐỀ */}
        {wizardStep === 3 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl">
                <CutePencilSVG className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-800">3. Nhập Tên bài hoặc Chủ đề</h3>
                <p className="text-xs text-slate-500">Nội dung tiết học để ghi nhận lịch sử.</p>
              </div>
            </div>

            <Input
              label="Tên bài hoặc chủ đề tiết học"
              required
              placeholder="Ví dụ: Bài 15: Ôn tập phép cộng trong phạm vi 100"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={errors.title}
            />
          </div>
        )}

        {/* STEP 4: CHỌN NGÀY DẠY */}
        {wizardStep === 4 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
                <CuteStarSVG className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-800">4. Chọn Ngày giảng dạy</h3>
                <p className="text-xs text-slate-500">Mặc định là ngày hôm nay.</p>
              </div>
            </div>

            <Input
              label="Ngày dạy"
              type="date"
              required
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
            />
          </div>
        )}

        {/* STEP 5: CHỌN NỀN TẢNG HỌP */}
        {wizardStep === 5 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 text-blue-700 rounded-2xl">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-800">5. Chọn Nền tảng cuộc họp</h3>
                <p className="text-xs text-slate-500">Hỗ trợ các nền tảng phổ biến nhất.</p>
              </div>
            </div>

            <Select
              label="Nền tảng trực tuyến"
              value={meetingPlatform}
              onChange={(e) => setMeetingPlatform(e.target.value as MeetingPlatform)}
              options={[
                { value: 'meet', label: 'Google Meet' },
                { value: 'zoom', label: 'Zoom Workplace' },
                { value: 'teams', label: 'Microsoft Teams' },
                { value: 'other', label: 'Nền tảng khác' },
                { value: 'none', label: 'Không tạo link họp' },
              ]}
            />
          </div>
        )}

        {/* STEP 6: NHẬP LIÊN KẾT PHÒNG HỌP (HTTPS) */}
        {wizardStep === 6 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-800">6. Nhập Liên kết phòng họp (Tùy chọn)</h3>
                <p className="text-xs text-slate-500">Liên kết giúp bạn bật nhanh phòng họp qua trình duyệt.</p>
              </div>
            </div>

            <Input
              label="URL Phòng họp (Chỉ nhận HTTPS)"
              placeholder="https://meet.google.com/xyz-abc-def"
              leftIcon={<Video className="w-4 h-4 text-slate-400" />}
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              error={errors.meetingUrl}
            />
          </div>
        )}

        {/* STEP 7: XEM TRƯỚC SĨ SỐ */}
        {wizardStep === 7 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 text-purple-700 rounded-2xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-800">7. Xem trước Sĩ số học sinh</h3>
                <p className="text-xs text-slate-500">Số lượng học sinh Active sẽ được nạp vào danh sách điểm danh.</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-blue-50/60 border-2 border-blue-200 text-center space-y-2">
              <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">Sĩ số học sinh lớp {selectedClassName}</p>
              <p className="text-4xl font-extrabold text-blue-900">{activeStudentCount} học sinh</p>
              {activeStudentCount === 0 && (
                <p className="text-xs font-bold text-red-600 pt-2">
                  ⚠️ Lớp học chưa có học sinh Active. Hãy bổ sung học sinh trước khi bắt đầu phiên!
                </p>
              )}
            </div>
          </div>
        )}

        {/* STEP 8: BẮT ĐẦU LỚP HỌC */}
        {wizardStep === 8 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-800">8. Hoàn tất & Bắt đầu lớp học</h3>
                <p className="text-xs text-slate-500">Kiểm tra lại toàn bộ thông tin trước khi bắt đầu.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 text-slate-700">
              <p>• Lớp dạy: <strong>Lớp {selectedClassName}</strong> ({activeStudentCount} học sinh)</p>
              <p>• Môn học: <strong>{subject}</strong></p>
              <p>• Tên bài: <strong>{title || 'Chưa nhập tên bài'}</strong></p>
              <p>• Nền tảng: <strong>{meetingPlatform.toUpperCase()}</strong></p>
              {meetingUrl && <p>• Link họp: <code className="text-blue-600">{meetingUrl}</code></p>}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                isLoading={submitting}
                leftIcon={<Save className="w-4 h-4" />}
                onClick={handleCreateDraft}
              >
                Lưu bản nháp
              </Button>
              <Button
                type="button"
                variant="primary"
                className="flex-1"
                disabled={activeStudentCount === 0}
                isLoading={submitting}
                leftIcon={<Play className="w-4 h-4" />}
                onClick={handleStartImmediately}
              >
                Bắt đầu lớp học ngay
              </Button>
            </div>
          </div>
        )}

        {/* WIZARD BACK / NEXT BUTTONS */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            disabled={wizardStep === 1}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={handlePrevStep}
          >
            Quay lại
          </Button>

          {wizardStep < 8 && (
            <Button
              type="button"
              variant="primary"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={handleNextStep}
            >
              Tiếp theo
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
