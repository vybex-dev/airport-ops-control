import React from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';

export interface AnimatedStatusFlipProps {
  statusKey: string;
  children: React.ReactNode;
  className?: string;
}

export const AnimatedStatusFlip: React.FC<AnimatedStatusFlipProps> = ({
  statusKey,
  children,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={statusKey}
        initial={{ opacity: 0, y: -4, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 4, scale: 0.98 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
