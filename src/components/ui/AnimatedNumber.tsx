import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface AnimatedNumberProps {
  value: number | string;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  prefix = '',
  suffix = '',
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(value);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    if (value !== displayValue) {
      setIsChanging(true);
      setDisplayValue(value);
      const timer = setTimeout(() => setIsChanging(false), 300);
      return () => clearTimeout(timer);
    }
  }, [value, displayValue]);

  if (shouldReduceMotion) {
    return (
      <span className={className}>
        {prefix}
        {value}
        {suffix}
      </span>
    );
  }

  return (
    <motion.span
      className={`inline-block ${className}`}
      animate={{
        scale: isChanging ? [1, 1.06, 1] : 1,
        opacity: isChanging ? [1, 0.8, 1] : 1,
      }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {prefix}
      {value}
      {suffix}
    </motion.span>
  );
};
