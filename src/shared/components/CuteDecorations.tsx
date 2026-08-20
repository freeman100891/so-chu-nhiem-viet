import React from 'react';

export const CuteCloudSVG: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M46 44H18C12.477 44 8 39.523 8 34C8 28.796 11.97 24.52 17.03 24.072C18.498 17.18 24.636 12 32 12C40.006 12 46.602 18.064 47.784 25.86C52.41 26.686 56 30.732 56 35.6C56 40.24 51.523 44 46 44Z"
      fill="#70D7C4"
      fillOpacity="0.4"
      stroke="#4F8EF7"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="26" cy="30" r="2.5" fill="#24324A" />
    <circle cx="38" cy="30" r="2.5" fill="#24324A" />
    <path d="M29 35C30.5 36.5 33.5 36.5 35 35" stroke="#FF7B7B" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const CuteStarSVG: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M16 2L20.326 10.764L30 12.176L23 19L24.652 28.648L16 24.1L7.348 28.648L9 19L2 12.176L11.674 10.764L16 2Z"
      fill="#FFD166"
      stroke="#F59E0B"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

export const CutePencilSVG: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M6 26L10 25L25 10L21 6L6 21L6 26Z" fill="#FF7B7B" stroke="#24324A" strokeWidth="2" strokeLinejoin="round" />
    <path d="M21 6L25 10L27 8L23 4L21 6Z" fill="#9B8AFB" stroke="#24324A" strokeWidth="2" strokeLinejoin="round" />
    <path d="M6 26L9 23" stroke="#24324A" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const CuteRainbowSVG: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 64 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M8 36C8 22.745 18.745 12 32 12C45.255 12 56 22.745 56 36" stroke="#FF7B7B" strokeWidth="6" strokeLinecap="round" />
    <path d="M16 36C16 27.163 23.163 20 32 20C40.837 20 48 27.163 48 36" stroke="#FFD166" strokeWidth="6" strokeLinecap="round" />
    <path d="M24 36C24 31.582 27.582 28 32 28C36.418 28 40 31.582 40 36" stroke="#70D7C4" strokeWidth="6" strokeLinecap="round" />
  </svg>
);
