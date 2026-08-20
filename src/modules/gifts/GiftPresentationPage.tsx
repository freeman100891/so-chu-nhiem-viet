import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../core/database/db';
import type { Gift } from '../../core/database/types';
import { giftSeedService } from '../../core/services/gift-seed.service';
import { Button } from '../../shared/components/Button';
import { GiftFlipCard } from './components/GiftFlipCard';
import {
  ArrowLeft,
  Gift as GiftIcon,
  Maximize2,
  Minimize2,
} from 'lucide-react';

export const GiftPresentationPage: React.FC = () => {
  const navigate = useNavigate();
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [flippedGiftId, setFlippedGiftId] = useState<string | null>(null);

  useEffect(() => {
    const loadGifts = async () => {
      try {
        setLoading(true);
        await giftSeedService.seedDefaultGifts();
        const activeGifts = await db.gifts
          .filter((g) => !g.deletedAt && g.status === 'ACTIVE' && g.presentationVisible === true)
          .sortBy('displayOrder');
        setGifts(activeGifts);
      } catch (err) {
        console.error('Failed to load presentation gifts:', err);
      } finally {
        setLoading(false);
      }
    };
    loadGifts();
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const filteredGifts = gifts.filter((g) => {
    if (selectedCategory !== 'ALL' && g.category !== selectedCategory) return false;
    return true;
  });

  // Auto reset flipped state when category changes
  useEffect(() => {
    if (flippedGiftId && !filteredGifts.some((g) => g.id === flippedGiftId)) {
      setFlippedGiftId(null);
    }
  }, [filteredGifts, flippedGiftId]);

  const handleFlipChange = (giftId: string, nextFlipped: boolean) => {
    if (nextFlipped) {
      setFlippedGiftId(giftId);
    } else {
      if (flippedGiftId === giftId) {
        setFlippedGiftId(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-8 flex flex-col justify-between">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-4 pb-6 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            className="text-slate-300 border-slate-700 hover:bg-slate-800"
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/gifts')}
          >
            Quay lại
          </Button>

          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold flex items-center gap-2.5 text-amber-400">
              <GiftIcon className="w-7 h-7 text-amber-400 animate-bounce" />
              <span>Thư Viện Quà Tặng & Đổi Điểm Tích Lũy</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Tích lũy điểm thi đua để đổi những phần quà và đặc quyền lớp học hấp dẫn! (Chạm thẻ để xem ảnh 3D)
            </p>
          </div>
        </div>

        {/* Fullscreen Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="md"
            className="bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
            leftIcon={isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            onClick={toggleFullscreen}
          >
            {isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
          </Button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="py-4 flex items-center gap-2.5 flex-wrap overflow-x-auto">
        {[
          { key: 'ALL', label: '🌟 Tất cả quà tặng' },
          { key: 'STATIONERY', label: '✏️ Dụng cụ học tập' },
          { key: 'BOOK', label: '📚 Sách truyện' },
          { key: 'PRIVILEGE', label: '👑 Đặc quyền lớp học' },
          { key: 'TOY', label: '🎁 Đồ chơi & Lưu niệm' },
          { key: 'SNACK', label: '🍬 Bánh kẹo' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSelectedCategory(tab.key)}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              selectedCategory === tab.key
                ? 'bg-amber-400 text-slate-950 shadow-lg scale-105'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Presentation Cards Grid */}
      <div className="flex-1 py-4">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-72 bg-slate-800/60 rounded-3xl border border-slate-700" />
            ))}
          </div>
        ) : filteredGifts.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <GiftIcon className="w-16 h-16 text-slate-600 mx-auto" />
            <h3 className="text-lg font-bold text-slate-300">Không có món quà nào trong danh mục này</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGifts.map((gift) => (
              <GiftFlipCard
                key={gift.id}
                gift={gift}
                mode="presentation"
                isFlipped={flippedGiftId === gift.id}
                onFlipChange={handleFlipChange}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer Encouragement Quote */}
      <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-500">
        ⭐ Hãy chăm chỉ phát biểu, tích cực thi đua và rèn luyện nề nếp mỗi ngày để tích lũy điểm đổi quà nhé các em! ⭐
      </div>
    </div>
  );
};
