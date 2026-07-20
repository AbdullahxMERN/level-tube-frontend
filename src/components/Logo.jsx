import React from "react";

/**
 * LevelTube logo — a single flat shield/badge silhouette with a play
 * triangle cut from its center as negative space. "Shield" nods to
 * levelling up / achievement, the cutout reads as video/play. One
 * shape, one color, no container box or gradient — closer to how
 * marks like Apple's or Microsoft's are built than a boxed monogram.
 */
export default function Logo({ size = "default" }) {
  const isCompact = size === "compact";

  return (
    <div className="flex items-center gap-2.5">
      <svg
        viewBox="0 0 28 28"
        fill="none"
        className={isCompact ? "w-[26px] h-[26px]" : "w-[30px] h-[30px]"}
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M14 1.5L25.5 8V20L14 26.5L2.5 20V8L14 1.5Z
             M11 9.5V18.5L19.5 14L11 9.5Z"
          fill="#f4f4f5"
        />
      </svg>

      <span
        className={`font-extrabold tracking-tight leading-none ${
          isCompact ? "text-lg" : "text-xl"
        }`}
      >
        <span className="text-zinc-100">Level</span>
        <span className="text-indigo-400">Tube</span>
      </span>
    </div>
  );
}
