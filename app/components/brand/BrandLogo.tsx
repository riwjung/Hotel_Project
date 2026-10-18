"use client";

import { useId } from "react";

/**
 * Sand & Sky mark — a pale-gold sun with sand ridges, a curling wave in front.
 * Line art redrawn from the brand logo so it stays crisp at any size.
 */
export function BrandMark({ size = 40 }: { size?: number }) {
  const id = useId();
  const sun = `${id}-sun`;
  const clip = `${id}-clip`;

  return (
    <svg
      aria-hidden
      width={size}
      height={size * 0.75}
      viewBox="0 0 64 48"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", flexShrink: 0, overflow: "visible" }}
    >
      <defs>
        <linearGradient id={sun} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--gold-light)" stopOpacity="0.95" />
          <stop offset="1" stopColor="var(--gold-light)" stopOpacity="0.45" />
        </linearGradient>
        <clipPath id={clip}>
          <circle cx="38" cy="19" r="13" />
        </clipPath>
      </defs>

      {/* sun */}
      <circle cx="38" cy="19" r="13" fill={`url(#${sun})`} stroke="var(--gold)" strokeWidth="0.9" />
      {/* sand ridges inside the sun */}
      <g clipPath={`url(#${clip})`} stroke="var(--gold)" strokeWidth="0.8" opacity="0.85">
        <path d="M30 22 C 36 19, 44 19, 52 21" />
        <path d="M31 25.5 C 37 23, 45 23, 52 25" />
        <path d="M32 29 C 38 27, 45 27, 52 28.5" />
      </g>

      <g stroke="var(--gold)" strokeWidth="1.1">
        {/* curling wave */}
        <path d="M3 30 C 12 30, 17 27, 21 22 C 25 16, 31 12.5, 37 14 C 40 14.8, 41.5 17, 40.5 18.6 C 38.6 16.6, 34 16.8, 32 20 C 29.6 24, 32 30, 40 31 C 47 31.8, 52 29, 56 27.5 C 58.5 26.6, 60.5 27, 62 28" />
        {/* wave body */}
        <path d="M9 35 C 15 35, 19 33, 23 29.5 C 25.5 27.2, 27.5 26.5, 29 27" opacity="0.8" />
        {/* shoreline */}
        <path d="M18 40 C 28 40, 36 36.5, 46 35.5 C 52 35, 56 35.6, 59 36.4" opacity="0.7" />
      </g>
    </svg>
  );
}

type LogoProps = {
  /** "inline": mark beside the name (sidebar). "stacked": mark above the name (login). */
  layout?: "inline" | "stacked";
  /** Hide the wordmark — collapsed sidebar rail. */
  markOnly?: boolean;
};

export default function BrandLogo({ layout = "inline", markOnly = false }: LogoProps) {
  const stacked = layout === "stacked";
  const mark = <BrandMark size={stacked ? 96 : 50} />;
  if (markOnly) return mark;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: stacked ? "column" : "row",
        alignItems: "center",
        gap: stacked ? 14 : 10,
        minWidth: 0,
      }}
    >
      {mark}
      <div style={{ minWidth: 0, textAlign: stacked ? "center" : "start", lineHeight: 1.1 }}>
        <div
          style={{
            fontFamily: "var(--font-brand), Georgia, serif",
            fontSize: stacked ? 30 : 19,
            letterSpacing: "0.04em",
            color: "var(--gold-deep)",
            whiteSpace: "nowrap",
          }}
        >
          SAND &amp; SKY
        </div>
        <div
          style={{
            marginTop: stacked ? 6 : 3,
            fontSize: stacked ? 12 : 9.5,
            letterSpacing: "0.42em",
            // letter-spacing pads the right edge; pull it back so the word stays centered
            marginInlineEnd: "-0.42em",
            color: "var(--gold)",
          }}
        >
          HOTEL
        </div>
      </div>
    </div>
  );
}
