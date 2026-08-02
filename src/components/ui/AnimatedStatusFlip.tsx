import React, { useEffect, useRef, useState } from "react";

export interface AnimatedStatusFlipProps {
  statusKey: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * CSS-only replacement for the previous framer-motion (AnimatePresence)
 * implementation.
 *
 * IMPORTANT: does NOT remount via `key={statusKey}` on the wrapping node.
 * A key-based remount tears down and rebuilds the DOM subtree on every
 * status change, which is more disruptive than the framer-motion version
 * (which animated in place) and can show up as extra paint/layout work or
 * trip accessibility checks if a status happens to flip during a scan.
 * Instead we keep one persistent node and replay the fade+slide-in via a
 * class toggle + forced reflow whenever statusKey changes.
 */
export const AnimatedStatusFlip: React.FC<AnimatedStatusFlipProps> = ({
  statusKey,
  children,
  className = "",
}) => {
  const [isFlipping, setIsFlipping] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  const prevKeyRef = useRef(statusKey);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevKeyRef.current = statusKey;
      return;
    }
    if (statusKey === prevKeyRef.current) return;
    prevKeyRef.current = statusKey;

    setIsFlipping(false);
    const el = nodeRef.current;
    if (el) {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      void el.offsetWidth; // force reflow so re-adding the class restarts the keyframe
    }
    setIsFlipping(true);
  }, [statusKey]);

  return (
    <div
      ref={nodeRef}
      className={`${isFlipping ? "animate-status-flip-in" : ""} ${className}`}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget) setIsFlipping(false);
      }}
    >
      {children}
    </div>
  );
};
