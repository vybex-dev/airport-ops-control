import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PrimaryNav } from './PrimaryNav';

export interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * MobileNavDrawer
 *
 * Split out of AppLayout.tsx so framer-motion (its own ~vendor-motion chunk)
 * is only fetched once someone actually taps the mobile nav toggle, instead
 * of being part of the synchronous dependency graph for the very first paint.
 */
export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({ isOpen, onClose }) => {
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-hidden lg:hidden flex justify-start">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-surface-0/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '0%' }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative z-10 w-72 h-full bg-surface-1 border-r border-line shadow-2xl flex flex-col pt-[53px]"
          >
            <PrimaryNav onItemClick={onClose} className="flex-1 overflow-y-auto" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
