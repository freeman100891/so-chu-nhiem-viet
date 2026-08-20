import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StudentAvatar } from './StudentAvatar';
import type { Student } from '../../core/database/types';

describe('StudentAvatar Component Tests', () => {
  const mockStudent: Student = {
    id: 'st-01',
    studentCode: 'HS20260001',
    fullName: 'Nguyễn Văn An',
    normalizedName: 'nguyen van an',
    gender: 'Nam',
    dateOfBirth: '2015-05-12',
    avatarKey: 'animals/animal-panda',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  it('renders student avatar with avatarKey correctly', () => {
    render(<StudentAvatar student={mockStudent} size="md" />);
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('alt', 'Nguyễn Văn An');
  });

  it('renders custom uploaded image when provided', () => {
    render(
      <StudentAvatar
        name="Trần Thị Bình"
        customAvatar="data:image/png;base64,mockBase64Data"
        size="lg"
      />
    );
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'data:image/png;base64,mockBase64Data');
  });

  it('falls back to default avatar key when student has no avatarKey', () => {
    const studentWithoutAvatar: Student = {
      ...mockStudent,
      avatarKey: undefined,
    };
    render(
      <StudentAvatar
        student={studentWithoutAvatar}
        defaultAvatarKey="default/default-boy"
        size="md"
      />
    );
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
  });
});
