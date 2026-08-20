import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { PageHeader } from './PageHeader';
import { StatCard } from './StatCard';
import { LoadingSkeleton } from './LoadingSkeleton';
import { ErrorState } from './ErrorState';
import { Users } from 'lucide-react';
import { EmulationRankBadge, EmulationRankInsignia } from './EmulationRankBadge';
import { PromotionCelebrationModal } from './PromotionCelebrationModal';
import { DEFAULT_EMULATION_RANKS } from '../../core/types/emulation-rank.types';

describe('Shared UI Components Tests', () => {
  it('should render PageHeader correctly with title and badge', () => {
    render(<PageHeader title="Quản lý Học sinh" description="Danh sách chi tiết" badgeText="HK1" />);
    expect(screen.getByText('Quản lý Học sinh')).toBeInTheDocument();
    expect(screen.getByText('Danh sách chi tiết')).toBeInTheDocument();
    expect(screen.getByText('HK1')).toBeInTheDocument();
  });

  it('should render StatCard with KPI metric value', () => {
    render(
      <StatCard
        title="Tổng học sinh"
        value={45}
        icon={<Users data-testid="users-icon" />}
        subtitle="Lớp 10A1"
      />
    );
    expect(screen.getByText('Tổng học sinh')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('Lớp 10A1')).toBeInTheDocument();
  });

  it('should render LoadingSkeleton properly', () => {
    const { container } = render(<LoadingSkeleton type="card" count={3} />);
    expect(container.querySelectorAll('.animate-pulse').length).toBe(3);
  });

  it('should render ErrorState with retry button', () => {
    render(<ErrorState title="Lỗi kết nối" message="Không thể tải dữ liệu" />);
    expect(screen.getByText('Lỗi kết nối')).toBeInTheDocument();
    expect(screen.getByText('Không thể tải dữ liệu')).toBeInTheDocument();
  });

  it('should render EmulationRankInsignia for all 17 levels without error', () => {
    for (let lvl = 1; lvl <= 17; lvl++) {
      const { container } = render(<EmulationRankInsignia level={lvl} size="md" />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    }
  });

  it('should render EmulationRankBadge with rank name and points', () => {
    const generalRank = DEFAULT_EMULATION_RANKS[16]!; // Đại tướng
    render(<EmulationRankBadge rank={generalRank} size="lg" showPoints={true} />);
    expect(screen.getByText('Đại tướng')).toBeInTheDocument();
    expect(screen.getByText('(800đ)')).toBeInTheDocument();
  });

  it('should render PromotionCelebrationModal with student congratulation details', () => {
    render(
      <PromotionCelebrationModal
        isOpen={true}
        onClose={() => {}}
        data={{
          studentName: 'Nguyễn Minh Anh',
          fromLevel: 6,
          toLevel: 7,
          rankName: 'Trung úy',
          levelsGained: 1,
        }}
        enableSound={false}
      />
    );

    expect(screen.getByText('Vinh Danh Thăng Cấp Thi Đua')).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Minh Anh')).toBeInTheDocument();
    expect(screen.getByText('Trung úy')).toBeInTheDocument();
    expect(screen.getByText('Thăng +1 Cấp Bậc')).toBeInTheDocument();
  });
});

