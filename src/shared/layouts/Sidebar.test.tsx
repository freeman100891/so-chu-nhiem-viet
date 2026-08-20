import { describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar';

describe('Sidebar Navigation & Collapsible Sub-items Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('1. Should render all main navigation items', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar isCollapsed={false} />
      </MemoryRouter>
    );

    expect(screen.getByText('Tổng quan')).toBeInTheDocument();
    expect(screen.getByText('Lớp học')).toBeInTheDocument();
    expect(screen.getByText('Học sinh')).toBeInTheDocument();
    expect(screen.getByText('Điểm danh')).toBeInTheDocument();
    expect(screen.getByText('Thi đua')).toBeInTheDocument();
    expect(screen.getByText('Nhận xét')).toBeInTheDocument();
    expect(screen.getByText('Báo cáo')).toBeInTheDocument();
  });

  it('2. Should render sub-items for Thi đua, Live classroom, and Reports', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar isCollapsed={false} />
      </MemoryRouter>
    );

    // Check sub-items for Thi đua
    expect(screen.getByText('Điểm thi đua')).toBeInTheDocument();
    expect(screen.getByText('Bảng vàng danh hiệu')).toBeInTheDocument();

    // Check sub-items for Reports
    expect(screen.getByText('Báo cáo tổng quan')).toBeInTheDocument();
    expect(screen.getByText('Chuyên cần')).toBeInTheDocument();
    expect(screen.getByText('Điểm & Cấp bậc')).toBeInTheDocument();
  });

  it('3. Should toggle sub-items open/close when clicking the chevron toggle button', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Sidebar isCollapsed={false} />
      </MemoryRouter>
    );

    const toggleReportsBtn = screen.getByRole('button', { name: /Thu gọn Báo cáo/i });
    expect(toggleReportsBtn).toBeInTheDocument();
    expect(toggleReportsBtn).toHaveAttribute('aria-expanded', 'true');

    // Click to collapse
    fireEvent.click(toggleReportsBtn);
    expect(toggleReportsBtn).toHaveAttribute('aria-expanded', 'false');

    // Click to expand again
    fireEvent.click(toggleReportsBtn);
    expect(toggleReportsBtn).toHaveAttribute('aria-expanded', 'true');
  });

  it('4. Should auto-expand section when navigated to active child route', () => {
    // Start with reports collapsed in localStorage
    localStorage.setItem('gvcn_sidebar_expanded_sections', JSON.stringify({ '/reports': false }));

    render(
      <MemoryRouter initialEntries={['/reports/attendance']}>
        <Sidebar isCollapsed={false} />
      </MemoryRouter>
    );

    const toggleReportsBtn = screen.getByRole('button', { name: /Thu gọn Báo cáo/i });
    expect(toggleReportsBtn).toHaveAttribute('aria-expanded', 'true');
  });
});
