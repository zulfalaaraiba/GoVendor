import React from "react";

export function BatikDecor() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-15">
      {/* Top Left Corner Traditional Ornament */}
      <svg
        className="absolute top-0 left-0 w-32 h-32 md:w-48 md:h-48 text-secondary"
        viewBox="0 0 100 100"
        fill="currentColor"
      >
        <path d="M0,0 L100,0 C80,20 60,30 50,50 C40,70 20,80 0,100 Z" opacity="0.3" />
        <circle cx="20" cy="20" r="4" />
        <circle cx="35" cy="15" r="3" />
        <circle cx="15" cy="35" r="3" />
        <path d="M0,0 Q50,10 50,50 Q10,50 0,100" fill="none" stroke="currentColor" strokeWidth="1" />
        <path d="M0,0 Q30,5 30,30 Q5,30 0,60" fill="none" stroke="currentColor" strokeWidth="0.5" />
      </svg>

      {/* Top Right Corner Ornament */}
      <svg
        className="absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48 text-secondary transform rotate-90"
        viewBox="0 0 100 100"
        fill="currentColor"
      >
        <path d="M0,0 L100,0 C80,20 60,30 50,50 C40,70 20,80 0,100 Z" opacity="0.3" />
        <circle cx="20" cy="20" r="4" />
        <path d="M0,0 Q50,10 50,50 Q10,50 0,100" fill="none" stroke="currentColor" strokeWidth="1" />
      </svg>

      {/* Bottom Left Corner Ornament */}
      <svg
        className="absolute bottom-0 left-0 w-32 h-32 md:w-48 md:h-48 text-secondary transform -rotate-90"
        viewBox="0 0 100 100"
        fill="currentColor"
      >
        <path d="M0,0 L100,0 C80,20 60,30 50,50 C40,70 20,80 0,100 Z" opacity="0.3" />
        <circle cx="20" cy="20" r="4" />
        <path d="M0,0 Q50,10 50,50 Q10,50 0,100" fill="none" stroke="currentColor" strokeWidth="1" />
      </svg>

      {/* Bottom Right Corner Ornament */}
      <svg
        className="absolute bottom-0 right-0 w-32 h-32 md:w-48 md:h-48 text-secondary transform rotate-180"
        viewBox="0 0 100 100"
        fill="currentColor"
      >
        <path d="M0,0 L100,0 C80,20 60,30 50,50 C40,70 20,80 0,100 Z" opacity="0.3" />
        <circle cx="20" cy="20" r="4" />
        <path d="M0,0 Q50,10 50,50 Q10,50 0,100" fill="none" stroke="currentColor" strokeWidth="1" />
      </svg>
    </div>
  );
}
