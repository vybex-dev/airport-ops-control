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
 * IMPORTANT: this does NOT remount the DOM node on value change (no
 * `key={...}` swap). The sim clock ticks every 100ms and KPI values can
 * change roughly once a second, so a key-based remount would tear down
 * and rebuild this node repeatedly during normal operation — real DOM
 * churn, not just a visual animation, and enough to show up as extra
 * paint/layout work if a Lighthouse measurement window happens to land
 * on a value change. Instead we toggle a CSS class on the same persistent
 * node, forcing a reflow so the keyframe restarts cleanly each time.
 */
export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  prefix = "",
  suffix = "",
  className = "",
}) => {
  const [isPulsing, setIsPulsing] = useState(false);
  const spanRef = useRef<HTMLSpanElement>(null);
  const isFirstRender = useRef(true);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevValueRef.current = value;
      return;
    }
    if (value === prevValueRef.current) return;
    prevValueRef.current = value;

    // Restart the CSS animation on the same node: toggle the class off,
    // force a synchronous reflow, then toggle it back on. No unmount.
    setIsPulsing(false);
    const el = spanRef.current;
    if (el) {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      void el.offsetWidth; // force reflow so the next class add re-triggers the keyframe
    }
    setIsPulsing(true);
  }, [value]);

  return (
    <span
      ref={spanRef}
      className={`inline-block will-change-transform ${isPulsing ? "animate-value-pulse" : ""} ${className}`}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget) setIsPulsing(false);
      }}
    >
      {prefix}
      {value}
      {suffix}
    </span>
  );
};
