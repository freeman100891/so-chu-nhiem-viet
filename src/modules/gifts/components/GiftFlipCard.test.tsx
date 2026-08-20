import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { GiftFlipCard } from './GiftFlipCard';
import type { Gift } from '../../../core/database/types';

describe('GiftFlipCard Component & Accessibility Tests (FEAT-GIFT-002)', () => {
  const mockGift: Gift = {
    id: 'gift-001',
    name: 'Bút chì 2B & Tẩy gôm hình thú',
    normalizedName: 'but chi 2b va tay gom hinh thu',
    description: 'Dụng cụ học tập nắn nót từng nét chữ',
    category: 'STATIONERY',
    pointCost: 15,
    status: 'ACTIVE',
    inventoryMode: 'TRACKED',
    stockOnHand: 10,
    lowStockThreshold: 3,
    displayOrder: 1,
    presentationVisible: true,
    icon: 'PenTool',
    imageRef: 'https://example.com/pencil.png',
    createdAt: '2026-08-17T00:00:00Z',
    updatedAt: '2026-08-17T00:00:00Z',
    deletedAt: null,
  };

  const onFlipChange = vi.fn();
  const onOpenEditModal = vi.fn();
  const onOpenStockModal = vi.fn();
  const onToggleArchive = vi.fn();
  const onUpdateQuantity = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Should render front face by default with accessible trigger and gift details', () => {
    render(
      <GiftFlipCard
        gift={mockGift}
        mode="catalog"
        isFlipped={false}
        onFlipChange={onFlipChange}
        onOpenEditModal={onOpenEditModal}
      />
    );

    // Front content
    expect(screen.getAllByText('Bút chì 2B & Tẩy gôm hình thú').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Dụng cụ học tập nắn nót từng nét chữ')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText(/Còn:/i)).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();

    // Trigger accessibility
    const frontTrigger = screen.getByRole('button', { name: /Xem hình ảnh lớn món quà Bút chì 2B/i });
    expect(frontTrigger).toBeInTheDocument();
    expect(frontTrigger).toHaveAttribute('aria-pressed', 'false');
  });

  it('2. Should call onFlipChange(id, true) when front trigger is clicked', () => {
    render(
      <GiftFlipCard
        gift={mockGift}
        mode="catalog"
        isFlipped={false}
        onFlipChange={onFlipChange}
      />
    );

    const frontTrigger = screen.getByRole('button', { name: /Xem hình ảnh lớn món quà Bút chì 2B/i });
    fireEvent.click(frontTrigger);

    expect(onFlipChange).toHaveBeenCalledWith('gift-001', true);
  });

  it('3. Should render back face when isFlipped is true with large image and flip back button', async () => {
    render(
      <GiftFlipCard
        gift={mockGift}
        mode="catalog"
        isFlipped={true}
        onFlipChange={onFlipChange}
      />
    );

    const backImg = await screen.findByAltText('Hình ảnh minh họa quà tặng Bút chì 2B & Tẩy gôm hình thú');
    expect(backImg).toBeInTheDocument();
    expect(backImg).toHaveAttribute('src', 'https://example.com/pencil.png');

    const backFlipBtn = screen.getByRole('button', { name: /Lật lại/i });
    expect(backFlipBtn).toBeInTheDocument();
    fireEvent.click(backFlipBtn);

    expect(onFlipChange).toHaveBeenCalledWith('gift-001', false);
  });

  it('4. Should toggle flip on Enter and Space key, and close on Escape key', () => {
    const { rerender } = render(
      <GiftFlipCard
        gift={mockGift}
        mode="catalog"
        isFlipped={false}
        onFlipChange={onFlipChange}
      />
    );

    const frontTrigger = screen.getByRole('button', { name: /Xem hình ảnh lớn món quà Bút chì 2B/i });
    fireEvent.keyDown(frontTrigger, { key: 'Enter' });
    expect(onFlipChange).toHaveBeenCalledWith('gift-001', true);

    fireEvent.keyDown(frontTrigger, { key: ' ' });
    expect(onFlipChange).toHaveBeenCalledWith('gift-001', true);

    // Re-render as flipped
    rerender(
      <GiftFlipCard
        gift={mockGift}
        mode="catalog"
        isFlipped={true}
        onFlipChange={onFlipChange}
      />
    );

    const cardArticle = screen.getByTestId('gift-card-gift-001');
    fireEvent.keyDown(cardArticle, { key: 'Escape' });
    expect(onFlipChange).toHaveBeenCalledWith('gift-001', false);
  });

  it('5. Action buttons (Edit, Stock, Archive) should NOT trigger flip', () => {
    render(
      <GiftFlipCard
        gift={mockGift}
        mode="catalog"
        isFlipped={false}
        onFlipChange={onFlipChange}
        onOpenEditModal={onOpenEditModal}
        onOpenStockModal={onOpenStockModal}
        onToggleArchive={onToggleArchive}
      />
    );

    const editBtn = screen.getByRole('button', { name: /Sửa/i });
    fireEvent.click(editBtn);
    expect(onOpenEditModal).toHaveBeenCalledWith(mockGift);
    expect(onFlipChange).not.toHaveBeenCalled();

    const stockBtn = screen.getByRole('button', { name: /Kho/i });
    fireEvent.click(stockBtn);
    expect(onOpenStockModal).toHaveBeenCalledWith(mockGift);
    expect(onFlipChange).not.toHaveBeenCalled();

    const archiveBtn = screen.getByTitle('Lưu trữ quà');
    fireEvent.click(archiveBtn);
    expect(onToggleArchive).toHaveBeenCalledWith(mockGift);
    expect(onFlipChange).not.toHaveBeenCalled();
  });

  it('6. In redemption mode, Add to Cart and quantity buttons should NOT trigger flip', () => {
    const { rerender } = render(
      <GiftFlipCard
        gift={mockGift}
        mode="redemption"
        isFlipped={false}
        onFlipChange={onFlipChange}
        selectedStudentSelected={true}
        currentBalance={50}
        qtyInCart={0}
        onUpdateQuantity={onUpdateQuantity}
      />
    );

    const addBtn = screen.getByRole('button', { name: /Thêm vào giỏ/i });
    fireEvent.click(addBtn);
    expect(onUpdateQuantity).toHaveBeenCalledWith('gift-001', 1);
    expect(onFlipChange).not.toHaveBeenCalled();

    // Rerender with qtyInCart = 1
    rerender(
      <GiftFlipCard
        gift={mockGift}
        mode="redemption"
        isFlipped={false}
        onFlipChange={onFlipChange}
        selectedStudentSelected={true}
        currentBalance={50}
        qtyInCart={1}
        onUpdateQuantity={onUpdateQuantity}
      />
    );

    const plusBtn = screen.getByTitle('Tăng');
    fireEvent.click(plusBtn);
    expect(onUpdateQuantity).toHaveBeenCalledWith('gift-001', 1);
    expect(onFlipChange).not.toHaveBeenCalled();
  });

  it('7. When gift is out of stock or unaffordable, flip trigger still works to view image', () => {
    const outOfStockGift: Gift = {
      ...mockGift,
      stockOnHand: 0,
    };

    render(
      <GiftFlipCard
        gift={outOfStockGift}
        mode="redemption"
        isFlipped={false}
        onFlipChange={onFlipChange}
        selectedStudentSelected={true}
        currentBalance={50}
      />
    );

    // Redeem button is disabled
    const disabledBtn = screen.getByRole('button', { name: /Tạm hết hàng/i });
    expect(disabledBtn).toBeDisabled();

    // Flip trigger remains interactive
    const frontTrigger = screen.getByRole('button', { name: /Xem hình ảnh lớn món quà Bút chì 2B/i });
    fireEvent.click(frontTrigger);
    expect(onFlipChange).toHaveBeenCalledWith('gift-001', true);
  });

  it('8. Fallback illustration should render safely when gift has no imageRef or image fails to load', () => {
    const giftNoImage: Gift = {
      ...mockGift,
      imageRef: undefined,
    };

    render(
      <GiftFlipCard
        gift={giftNoImage}
        mode="catalog"
        isFlipped={true}
        onFlipChange={onFlipChange}
      />
    );

    // Should render category fallback without crashing
    expect(screen.getAllByText('Dụng cụ học tập').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByAltText(/Hình ảnh minh họa quà tặng/i)).not.toBeInTheDocument();
  });

  it('9. Presentation mode should allow flipping and render read-only without write action buttons', () => {
    render(
      <GiftFlipCard
        gift={mockGift}
        mode="presentation"
        isFlipped={false}
        onFlipChange={onFlipChange}
      />
    );

    // No edit or archive buttons in presentation mode
    expect(screen.queryByRole('button', { name: /Sửa/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Kho/i })).not.toBeInTheDocument();

    // Flip trigger works
    const frontTrigger = screen.getByRole('button', { name: /Xem hình ảnh lớn món quà Bút chì 2B/i });
    fireEvent.click(frontTrigger);
    expect(onFlipChange).toHaveBeenCalledWith('gift-001', true);
  });
});
