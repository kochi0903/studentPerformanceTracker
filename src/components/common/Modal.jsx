/**
 * Modal — reusable portal-based modal primitive.
 *
 * Renders via ReactDOM.createPortal into document.body, which means
 * it is immune to any parent overflow:hidden / transform / stacking context.
 *
 * Props:
 *   isOpen      {boolean}
 *   onClose     {() => void}
 *   maxWidth    {string}  — Tailwind max-w-* class, default "max-w-md"
 *   children    {ReactNode}
 *   closeOnBackdrop {boolean} — default true
 */
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Modal = ({
  isOpen,
  onClose,
  maxWidth = 'max-w-md',
  children,
  closeOnBackdrop = true,
}) => {
  // Lock body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return ReactDOM.createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={closeOnBackdrop ? onClose : undefined}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-[1px] z-[500]"
          />

          {/* Panel — perfectly centered via flex on the viewport */}
          <div className="fixed inset-0 z-[501] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key="modal-panel"
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.15 }}
              className={`w-full ${maxWidth} bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden pointer-events-auto`}
            >
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Modal;
