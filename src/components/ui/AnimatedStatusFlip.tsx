import React from "react";

export interface AnimatedStatusFlipProps {
  statusKey: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * CSS-only replacement for the previous framer-motion (AnimatePresence)
 * implementation. Framer Motion's exit-then-enter crossfade needs two DOM
 * nodes mounted briefly at once — not worth the dependency weight for a
 * status badge flip. This does a fade+slide-in on key change instead
 * (`.animate-status-flip-in`, see index.css), which reads almost
 * identically at the 0.2s duration used here.
 *
 * prefers-reduced-motion is handled globally in index.css
 * (animation-duration: 0.01ms !important), so no per-component check
 * is needed here.
 */
export const AnimatedStatusFlip: React.FC<AnimatedStatusFlipProps> = ({
  statusKey,
  children,
  className = "",
}) => {
  return (
    <div key={statusKey} className={`animate-status-flip-in ${className}`}>
      {children}
    </div>
  );
};
