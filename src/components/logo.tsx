"use client";

import { useId } from "react";

/**
 * The Splitr mark: a rounded square split by the B→C diagonal into a green
 * triangle (banknote = money) and a black triangle (people = members).
 */
export function Logo({ className }: { className?: string }) {
  const clip = "logo-" + useId().replace(/[^a-zA-Z0-9]/g, "");

  return (
    <svg
      viewBox="0 0 512 512"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Splitr"
    >
      <defs>
        <clipPath id={clip}>
          <rect width="512" height="512" rx="112" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <polygon points="0,0 512,0 0,512" fill="#059669" />
        <polygon points="512,0 512,512 0,512" fill="#0a0a0a" />
        <line x1="512" y1="0" x2="0" y2="512" stroke="#ffffff" strokeWidth="6" strokeOpacity="0.5" />
        <g transform="translate(95 95) scale(6.25)" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <circle cx="12" cy="12" r="2" />
          <path d="M6 12h.01" />
          <path d="M18 12h.01" />
        </g>
        <g transform="translate(266 266) scale(6.25)" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </g>
      </g>
    </svg>
  );
}
