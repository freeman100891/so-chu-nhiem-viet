import React, { useState } from 'react';
import { cn } from '../utilities/cn';
import { avatarThemeRegistry } from '../../core/services/avatar-theme-registry';

import type { GlobalAvatarSystemSettings } from '../../core/types/avatar-theme.types';

export type StudentAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'fluid' | number;

export interface StudentAvatarProps {
  student?: {
    id?: string;
    fullName?: string;
    avatar?: string | null;
    avatarKey?: string | null;
    avatarThemeId?: string | null;
  } | null;
  avatarKey?: string | null;
  avatarThemeId?: string | null;
  globalActiveThemeId?: string | null;
  globalSettings?: GlobalAvatarSystemSettings | null;
  uploadedAssetUrls?: Map<string, string>;
  score?: number | null;
  avatarLevel?: 1 | 2 | 3 | 4 | 5 | null;
  rankLevelOrOrder?: number | null;
  customAvatar?: string | null;
  defaultAvatarKey?: string | null;
  name?: string;
  size?: StudentAvatarSize;
  shape?: 'circle' | 'square' | 'rounded';
  className?: string;
  imageClassName?: string;
  alt?: string;
  onClick?: () => void;
  title?: string;
  loading?: 'lazy' | 'eager';
}

const SIZE_CLASSES: Record<string, string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-20 h-20 text-2xl',
  fluid: 'w-[var(--student-avatar-size,3.5rem)] h-[var(--student-avatar-size,3.5rem)] text-lg md:text-xl',
};

const SHAPE_CLASSES: Record<string, string> = {
  circle: 'rounded-full',
  square: 'rounded-none',
  rounded: 'rounded-2xl',
};

export const StudentAvatar: React.FC<StudentAvatarProps> = ({
  student,
  avatarKey,
  avatarThemeId,
  globalActiveThemeId,
  globalSettings,
  uploadedAssetUrls,
  score,
  avatarLevel,
  rankLevelOrOrder,
  customAvatar,
  defaultAvatarKey,
  name,
  size = 'md',
  shape = 'circle',
  className,
  imageClassName,
  alt,
  onClick,
  title,
  loading = 'lazy',
}) => {
  const [hasError, setHasError] = useState(false);

  const effectiveThemeId = avatarThemeId !== undefined ? avatarThemeId : student?.avatarThemeId;
  const effectiveAvatarKey = avatarKey !== undefined ? avatarKey : student?.avatarKey;
  const effectiveCustomAvatar = customAvatar !== undefined ? customAvatar : student?.avatar;
  const effectiveName = name || student?.fullName || 'Học sinh';

  const resolved = avatarThemeRegistry.resolveStudentAvatarViewModel({
    globalActiveThemeId,
    globalSettings,
    uploadedAssetUrls,
    avatarThemeId: effectiveThemeId,
    avatarKey: effectiveAvatarKey,
    customAvatar: effectiveCustomAvatar,
    defaultAvatarKey,
    score,
    avatarLevel,
    rankLevelOrOrder,
  });

  const avatarSrc = resolved.assetUrl;

  const initial = effectiveName.trim().charAt(0).toUpperCase() || 'H';

  const sizeClass = typeof size === 'string' ? SIZE_CLASSES[size] || SIZE_CLASSES.md : '';
  const shapeClass = SHAPE_CLASSES[shape] || SHAPE_CLASSES.circle;

  const customStyle: React.CSSProperties =
    typeof size === 'number'
      ? {
          width: `${size}px`,
          height: `${size}px`,
          fontSize: `${Math.max(10, Math.floor(size * 0.38))}px`,
        }
      : {};

  if (!avatarSrc || hasError) {
    return (
      <div
        onClick={onClick}
        title={title || effectiveName}
        style={customStyle}
        className={cn(
          'shrink-0 flex items-center justify-center font-extrabold select-none transition-transform',
          'bg-gradient-to-br from-blue-100 to-indigo-200 text-blue-800 border-2 border-blue-300 shadow-2xs',
          sizeClass,
          shapeClass,
          onClick && 'cursor-pointer hover:opacity-90 active:scale-95',
          className
        )}
      >
        <span>{initial}</span>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      title={title || effectiveName}
      style={customStyle}
      className={cn(
        'shrink-0 relative overflow-hidden bg-slate-100 flex items-center justify-center select-none transition-transform',
        sizeClass,
        shapeClass,
        onClick && 'cursor-pointer hover:opacity-90 active:scale-95',
        className
      )}
    >
      <img
        src={avatarSrc}
        alt={alt || effectiveName}
        loading={loading}
        onError={() => setHasError(true)}
        className={cn('w-full h-full object-cover', shapeClass, imageClassName)}
      />
    </div>
  );
};
