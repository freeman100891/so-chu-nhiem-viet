import React from 'react';
import type { ThemeId } from '../../../core/services/theme.service';

export interface ThemeMascotSVGProps {
  themeId?: ThemeId;
  className?: string;
}

export const ThemeMascotSVG: React.FC<ThemeMascotSVGProps> = ({
  themeId = 'military',
  className = 'w-24 h-24 sm:w-28 sm:h-28',
}) => {
  // 1. THEME 1: Hành quân tri thức (Military) - Chú bộ đội nhí đáng yêu & Ngôi sao vàng
  if (themeId === 'military') {
    return (
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Mascot Hành Quân Tri Thức"
      >
        {/* Glow / Halo */}
        <circle cx="60" cy="60" r="54" fill="#2D5A27" fillOpacity="0.12" />
        <circle cx="60" cy="60" r="46" fill="#FDE047" fillOpacity="0.2" />

        {/* Mũ cối nhí màu xanh lá */}
        <ellipse cx="60" cy="40" rx="32" ry="18" fill="#2D5A27" />
        <ellipse cx="60" cy="38" rx="28" ry="14" fill="#3F7A38" />
        {/* Ngôi sao vàng trên mũ */}
        <circle cx="60" cy="36" r="7" fill="#DC2626" />
        <polygon
          points="60,31 62,35 66,35 63,38 64,42 60,39 56,42 57,38 54,35 58,35"
          fill="#FDE047"
        />

        {/* Khuôn mặt tươi vui */}
        <circle cx="60" cy="62" r="24" fill="#FFE3D1" />
        {/* Má hồng */}
        <circle cx="46" cy="67" r="4" fill="#FCA5A5" fillOpacity="0.7" />
        <circle cx="74" cy="67" r="4" fill="#FCA5A5" fillOpacity="0.7" />
        {/* Đôi mắt tinh anh */}
        <circle cx="51" cy="59" r="3" fill="#1E293B" />
        <circle cx="52" cy="58" r="1" fill="#FFFFFF" />
        <circle cx="69" cy="59" r="3" fill="#1E293B" />
        <circle cx="70" cy="58" r="1" fill="#FFFFFF" />
        {/* Nụ cười rạng rỡ */}
        <path d="M54 67C56 71 64 71 66 67" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />

        {/* Cổ áo & Khăn quàng đỏ */}
        <path d="M42 84L60 98L78 84L72 78H48L42 84Z" fill="#DC2626" />
        <polygon points="60,86 54,98 60,110 66,98" fill="#EF4444" />

        {/* Ngôi sao nhỏ trang trí lấp lánh */}
        <polygon points="98,28 100,34 106,34 101,38 103,44 98,40 93,44 95,38 90,34 96,34" fill="#F59E0B" />
        <polygon points="20,70 22,74 26,74 23,77 24,81 20,78 16,81 17,77 14,74 18,74" fill="#F59E0B" opacity="0.8" />
      </svg>
    );
  }

  // 2. THEME 2: Sắc màu 54 dân tộc (Ethnic) - Bạn nhỏ trang phục truyền thống & Họa tiết thổ cẩm
  if (themeId === 'ethnic') {
    return (
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Mascot Sắc Màu 54 Dân Tộc"
      >
        {/* Vòng nền hoa văn thổ cẩm */}
        <circle cx="60" cy="60" r="54" fill="#1E3A8A" fillOpacity="0.1" />
        <circle cx="60" cy="60" r="46" fill="#D97706" fillOpacity="0.15" />

        {/* Khăn quấn đầu thổ cẩm */}
        <path d="M30 46C30 30 43 22 60 22C77 22 90 30 90 46H30Z" fill="#1E3A8A" />
        <path d="M32 40H88" stroke="#D97706" strokeWidth="4" strokeDasharray="3 3" />
        <circle cx="60" cy="28" r="5" fill="#EF4444" />

        {/* Khuôn mặt dễ thương */}
        <circle cx="60" cy="62" r="24" fill="#FFE4D6" />
        {/* Má hồng */}
        <circle cx="47" cy="67" r="4" fill="#F87171" fillOpacity="0.6" />
        <circle cx="73" cy="67" r="4" fill="#F87171" fillOpacity="0.6" />
        {/* Mắt to tròn */}
        <circle cx="51" cy="59" r="3" fill="#1E293B" />
        <circle cx="52" cy="58" r="1" fill="#FFFFFF" />
        <circle cx="69" cy="59" r="3" fill="#1E293B" />
        <circle cx="70" cy="58" r="1" fill="#FFFFFF" />
        {/* Nụ cười */}
        <path d="M54 67C56 71 64 71 66 67" stroke="#991B1B" strokeWidth="2.5" strokeLinecap="round" />

        {/* Áo hoa văn dân tộc */}
        <path d="M38 84C38 84 48 80 60 80C72 80 82 84 82 84L88 110H32L38 84Z" fill="#1E3A8A" />
        <path d="M42 90L60 102L78 90" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
        <circle cx="60" cy="92" r="3" fill="#EF4444" />

        {/* Họa tiết lấp lánh */}
        <polygon points="100,32 103,38 109,38 104,42 106,48 100,44 94,48 96,42 91,38 97,38" fill="#D97706" />
      </svg>
    );
  }

  // 3. THEME 3: Đất nước ba miền (Regions) - Chim bồ câu & Nón lá xanh non thanh bình
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Mascot Đất Nước Ba Miền"
    >
      {/* Vòng sáng xanh mướt thanh bình */}
      <circle cx="60" cy="60" r="54" fill="#059669" fillOpacity="0.12" />
      <circle cx="60" cy="60" r="46" fill="#34D399" fillOpacity="0.2" />

      {/* Chiếc nón lá truyền thống */}
      <polygon points="60,20 24,52 96,52" fill="#FEF08A" />
      <polygon points="60,20 26,50 94,50" stroke="#CA8A04" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M40 38C50 42 70 42 80 38" stroke="#CA8A04" strokeWidth="1.5" />

      {/* Khuôn mặt em bé hồn nhiên */}
      <circle cx="60" cy="66" r="23" fill="#FFE7D6" />
      {/* Má hồng */}
      <circle cx="47" cy="71" r="4" fill="#FB7185" fillOpacity="0.7" />
      <circle cx="73" cy="71" r="4" fill="#FB7185" fillOpacity="0.7" />
      {/* Đôi mắt trong sáng */}
      <circle cx="51" cy="63" r="3" fill="#1E293B" />
      <circle cx="52" cy="62" r="1" fill="#FFFFFF" />
      <circle cx="69" cy="63" r="3" fill="#1E293B" />
      <circle cx="70" cy="62" r="1" fill="#FFFFFF" />
      {/* Nụ cười vui tươi */}
      <path d="M54 71C56 75 64 75 66 71" stroke="#E11D48" strokeWidth="2.5" strokeLinecap="round" />

      {/* Quai nón lụa mềm & Khăn quàng */}
      <path d="M38 52C42 66 48 82 60 84C72 82 78 66 82 52" stroke="#EC4899" strokeWidth="2" fill="none" />
      <path d="M44 86L60 98L76 86L70 82H50L44 86Z" fill="#DC2626" />

      {/* Cánh chim bồ câu biểu tượng hòa bình */}
      <path
        d="M96 24C102 24 108 28 108 34C108 37 105 40 100 42C106 42 110 45 110 48C110 52 104 55 96 55C90 55 86 50 86 42C86 32 90 24 96 24Z"
        fill="#FFFFFF"
        stroke="#059669"
        strokeWidth="1.5"
      />
    </svg>
  );
};
