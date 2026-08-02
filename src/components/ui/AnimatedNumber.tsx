import React, { useEffect, useRef, useState } from "react";

export interface AnimatedNumberProps {
  value: number | string;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * CSS-only replacement for the previous framer-motion implementation.
 * Renders on first paint for every KPI card on Overview, so pulling in
 * framer-motion here put the whole vendor-motion chunk back on the
 * critical path even after AlertsPanelDrawer was lazy-loaded elsewhere.
 *
 * A plain CSS keyframe (`.animate-value-pulse`, see index.css) restarted
 * via a remount key gives the same brief scale+opacity pulse on value
 * change, handled by the browser compositor with no JS on the animation
 * frame. prefers-reduced-motion is handled globally in index.css
 * (animation-duration: 0.01ms !important), so no per-component check
 * is needed here.
 */
export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  prefix = "",
  suffix = "",
  className = "",
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [pulseKey, setPulseKey] = useState(0);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (value !== displayValue) {
      setDisplayValue(value);
      setPulseKey((k) => k + 1);
    }
  }, [value, displayValue]);

  return (
    <span
      key={pulseKey}
      className={`inline-block will-change-transform animate-value-pulse ${className}`}
    >
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
};
