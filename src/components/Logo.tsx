import React from "react";

interface LogoProps {
  className?: string;
  size?: number; // Size of the icon
  showText?: boolean;
  textColor?: string;
  textClass?: string;
}

export function Logo({
  className = "",
  size = 36,
  showText = true,
  textColor = "text-stone-900",
  textClass = "font-serif text-lg md:text-xl font-black tracking-tight",
}: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Dynamic 3D Premium G-Logo SVG */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-[0_2px_8px_rgba(255,119,0,0.15)]"
      >
        <defs>
          {/* Main Sky Blue to Deep Blue Premium Gradient */}
          <linearGradient id="govendorLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" /> {/* Sky Blue */}
            <stop offset="60%" stopColor="#2563EB" /> {/* Royal Blue */}
            <stop offset="100%" stopColor="#1D4ED8" /> {/* Deep Blue */}
          </linearGradient>

          {/* Subtly darker blue gradient for the 3D overlap effect */}
          <linearGradient id="govendorShadowGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1E40AF" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>

          {/* Soft drop shadow for overlapping ribbon */}
          <filter id="logoGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="-1" dy="2" stdDeviation="2" floodOpacity="0.25" floodColor="#000" />
          </filter>
        </defs>

        {/* 1. Bottom-Right Ribbon with Arrow Up-Right */}
        <path
          d="M 37.5 76
             C 45 80.5, 54 81.5, 62.5 79.5
             C 75.5 76.5, 85 64.5, 85 50
             C 85 46.5, 84 43.5, 82.5 40.5
             L 52 61
             L 60 61
             L 60 52
             L 42 52
             L 42 61
             C 32.5 67.5, 26 73.5, 23 77.5
             Z"
          fill="url(#govendorShadowGrad)"
          opacity="0.85"
        />

        {/* 2. Main Top-Left Swoosh (G-Body) */}
        {/* Sweeps from top right gap, around the left, down to the speech bubble tail */}
        <path
          d="M 68 32
             C 63 26, 55.5 22, 47 22
             C 31.5 22, 19 34.5, 19 50
             C 19 55.5, 20.5 61, 23.5 65.5
             L 15 76.5
             C 14.5 77.5, 15.5 78.5, 16.5 78
             L 28 71.5
             C 33.5 74.5, 40 76, 47 76
             C 53.5 76, 59.5 74, 64.5 70.5
             L 68.5 67.5
             C 65 65.5, 56.5 61, 47 61
             C 41 61, 36 56, 36 50
             C 36 44, 41 39, 47 39
             C 52.5 39, 57.5 42, 60 47.5
             L 70.5 40
             C 70 37, 69.2 34.5, 68 32 Z"
          fill="url(#govendorLogoGrad)"
          filter="url(#logoGlow)"
        />

        {/* 3. The Stylized Dynamic Rising Arrow (The horizontal & up-right check) */}
        {/* This represents elevation, vendor growth, and premium trusted verification */}
        <path
          d="M 52 52 
             L 72 32 
             L 63 32 
             C 68.5 29, 74 27, 81.5 25.5
             C 80 33, 78.5 38.5, 75.5 44 
             L 75.5 35 
             L 52 61
             Z"
          fill="url(#govendorLogoGrad)"
          filter="url(#logoGlow)"
        />
      </svg>

      {/* Brand Typography */}
      {showText && (
        <span className={`${textClass} ${textColor}`}>
          Go Vendor
        </span>
      )}
    </div>
  );
}
