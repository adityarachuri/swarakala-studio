import React, {useId} from 'react';

interface BrandLogoProps {
  size?: number;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({size = 30, className = ''}) => {
  const uid = useId().replace(/:/g, '');
  const bgId = `sk-bg-${uid}`;
  const goldId = `sk-gold-${uid}`;
  const emeraldId = `sk-emerald-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <radialGradient id={bgId} cx="35%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#1A2233" />
          <stop offset="65%" stopColor="#0E131C" />
          <stop offset="100%" stopColor="#080B10" />
        </radialGradient>
        <linearGradient id={goldId} x1="112" y1="112" x2="400" y2="400" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="48%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <linearGradient id={emeraldId} x1="160" y1="320" x2="352" y2="192" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>

      <rect width="512" height="512" rx="124" fill={`url(#${bgId})`} />
      <rect
        x="14"
        y="14"
        width="484"
        height="484"
        rx="110"
        stroke="#F59E0B"
        strokeOpacity="0.24"
        strokeWidth="4"
      />
      <circle cx="256" cy="256" r="184" stroke="#334155" strokeWidth="5" />

      <g stroke="#F59E0B" strokeLinecap="round">
        <line x1="256" y1="58" x2="256" y2="78" strokeWidth="10" />
        <line x1="396" y1="116" x2="382" y2="130" strokeWidth="7" strokeOpacity="0.85" />
        <line x1="454" y1="256" x2="434" y2="256" strokeWidth="7" strokeOpacity="0.7" />
        <line x1="396" y1="396" x2="382" y2="382" strokeWidth="7" strokeOpacity="0.55" />
        <line x1="256" y1="454" x2="256" y2="434" strokeWidth="7" strokeOpacity="0.55" />
        <line x1="116" y1="396" x2="130" y2="382" strokeWidth="7" strokeOpacity="0.55" />
        <line x1="58" y1="256" x2="78" y2="256" strokeWidth="7" strokeOpacity="0.7" />
        <line x1="116" y1="116" x2="130" y2="130" strokeWidth="7" strokeOpacity="0.85" />
      </g>

      <circle cx="256" cy="256" r="142" stroke={`url(#${goldId})`} strokeWidth="12" />

      <g stroke="#64748B" strokeOpacity="0.48" strokeWidth="3">
        <line x1="212" y1="128" x2="212" y2="384" />
        <line x1="241" y1="120" x2="241" y2="392" />
        <line x1="271" y1="120" x2="271" y2="392" />
        <line x1="300" y1="128" x2="300" y2="384" />
      </g>

      <path
        d="M138 264C168 184 202 184 232 256C262 328 296 328 326 248C342 204 358 198 374 226"
        stroke={`url(#${goldId})`}
        strokeWidth="24"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M158 292C186 246 218 248 256 284C294 320 326 292 354 240"
        stroke={`url(#${emeraldId})`}
        strokeWidth="10"
        strokeLinecap="round"
        strokeOpacity="0.85"
      />

      <circle cx="256" cy="114" r="16" fill="#FDE68A" stroke="#0B0E14" strokeWidth="6" />
      <circle cx="256" cy="398" r="12" fill="#F59E0B" />
    </svg>
  );
};
