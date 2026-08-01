import React, { useId } from 'react';

// FitStack Logo — Stacked bars (progress/stack) + Lightning bolt (energy/fit)
// Uses useId() so multiple instances on the same page never conflict on SVG defs

const Logo = ({ size = 'md', showText = true, textSize = 'text-xl' }) => {
  const uid  = useId().replace(/:/g, '');
  const dims = { sm: 32, md: 40, lg: 48, xl: 64 };
  const px   = dims[size] || 40;

  const gBg      = `${uid}_bg`;
  const gAccent  = `${uid}_ac`;
  const gGlow    = `${uid}_gl`;

  return (
    <div className="flex items-center gap-2.5">
      <svg
        width={px}
        height={px}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
        aria-label="FitStack logo"
      >
        <defs>
          {/* Blue background gradient */}
          <linearGradient id={gBg} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>

          {/* White/light icon accent */}
          <linearGradient id={gAccent} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#ffffff" stopOpacity="1"  />
            <stop offset="100%" stopColor="#dbeafe" stopOpacity="0.9"/>
          </linearGradient>

          {/* Soft glow on bolt */}
          <filter id={gGlow} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Rounded square background */}
        <rect width="40" height="40" rx="9" fill={`url(#${gBg})`} />
        {/* Depth overlay */}
        <rect width="40" height="40" rx="9" fill="#0f2040" opacity="0.28" />

        {/* ── 3 ascending stacked bars (left) — the "Stack" ── */}
        <rect x="7"  y="27" width="8" height="4" rx="1.5" fill={`url(#${gAccent})`} opacity="0.50" />
        <rect x="7"  y="20" width="8" height="4" rx="1.5" fill={`url(#${gAccent})`} opacity="0.72" />
        <rect x="7"  y="13" width="8" height="4" rx="1.5" fill={`url(#${gAccent})`} opacity="0.95" />

        {/* ── Lightning bolt (right) — the "Fit" energy ── */}
        <path
          d="M24 8 L16 22 L21.5 22 L16 32 L30 17 L24 17 Z"
          fill={`url(#${gAccent})`}
          filter={`url(#${gGlow})`}
        />
      </svg>

      {showText && (
        <span
          className={`font-black tracking-tight ${textSize} leading-none`}
          style={{ letterSpacing: '-0.03em', color: '#ffffff' }}
        >
          {'Fit'}
          <span style={{ color: '#60a5fa' }}>Stack</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
