import React from 'react';

// FitStack Logo — Exact recreation of the bold italic "F" mark
// Transparent background, white shape — matches reference image exactly
// size: 'sm' (28px) | 'md' (36px) | 'lg' (44px) | 'xl' (56px)

const Logo = ({ size = 'md', showText = true, textSize = 'text-xl' }) => {
  const dims = { sm: 28, md: 36, lg: 44, xl: 56 };
  const px = dims[size] || 36;

  return (
    <div className="flex items-center gap-2.5">
      {/*
        SVG viewBox 0 0 100 100, transparent background
        Recreating the exact F from reference:
        - Top horizontal bar: wide, italic slant on both ends
        - Bottom section: italic vertical stem + shorter middle crossbar
        Both parts have the same italic/forward-lean angle (~15deg)
      */}
      <svg
        width={px}
        height={px}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
        aria-label="FitStack"
      >
        {/* ── TOP BAR ──
            Left edge: diagonal (bottom-left to top-right lean)
            Right edge: same diagonal cut
            Wide bar roughly top 30% of mark
        */}
        <polygon
          points="22,20  80,20  74,38  16,38"
          fill="white"
        />

        {/* ── BOTTOM SECTION ──
            Vertical stem (left side, italic — leans right going up)
            + Middle crossbar branching right
            Combined as one shape
        */}
        <polygon
          points="
            16,44
            74,44
            68,58
            36,58
            30,80
            16,80
          "
          fill="white"
        />
      </svg>

      {showText && (
        <span
          className={`font-black tracking-tight ${textSize} leading-none text-white`}
          style={{ letterSpacing: '-0.02em' }}
        >
          FitStack
        </span>
      )}
    </div>
  );
};

export default Logo;
