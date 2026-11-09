import React from 'react';

export default function GaloraLogo({ size = 36, className = '' }) {
  const uid = React.useId ? React.useId().replace(/:/g, '') : 'galora';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        flexShrink: 0,
        filter: 'drop-shadow(0 6px 16px rgba(99, 102, 241, 0.35))'
      }}
      aria-label="Galora AI Logo"
    >
      <defs>
        <linearGradient id={`galoraBg-${uid}`} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="50%" stopColor="#1e1b4b" />
          <stop offset="100%" stopColor="#090d16" />
        </linearGradient>
        <linearGradient id={`galoraStroke-${uid}`} x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
        <linearGradient id={`galoraG-${uid}`} x1="14" y1="12" x2="50" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="45%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#e879f9" />
        </linearGradient>
        <linearGradient id={`galoraAccent-${uid}`} x1="26" y1="22" x2="50" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>

      {/* Outer Rounded Squircle Badge */}
      <rect
        x="3"
        y="3"
        width="58"
        height="58"
        rx="16"
        fill={`url(#galoraBg-${uid})`}
        stroke={`url(#galoraStroke-${uid})`}
        strokeWidth="2.6"
      />

      {/* Subtle Inner Orbital Ring */}
      <circle
        cx="32"
        cy="32"
        r="21"
        stroke={`url(#galoraStroke-${uid})`}
        strokeOpacity="0.18"
        strokeWidth="1.2"
        strokeDasharray="3 3"
      />

      {/* Geometric 'G' Arc */}
      <path
        d="M43.5 21.5C40.6 18.4 36.5 16.5 32 16.5C23.44 16.5 16.5 23.44 16.5 32C16.5 40.56 23.44 47.5 32 47.5C39.85 47.5 46.33 41.66 47.36 34H33"
        stroke={`url(#galoraG-${uid})`}
        strokeWidth="5.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Ascending Quantum Alpha Trend Arrow Inside the G */}
      <path
        d="M24.5 36.5L30.5 30.5L35 34L44.5 24.5"
        stroke={`url(#galoraAccent-${uid})`}
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M39.5 24.5H44.5V29.5"
        stroke={`url(#galoraAccent-${uid})`}
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* AI Neural Spark Star at Top Right */}
      <path
        d="M48 13L49.4 16.6L53 18L49.4 19.4L48 23L46.6 19.4L43 18L46.6 16.6L48 13Z"
        fill="#38bdf8"
      />
    </svg>
  );
}
