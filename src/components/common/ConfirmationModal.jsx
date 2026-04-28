import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

const ConfirmationModal = ({
  isOpen, onClose, onConfirm,
  title, message,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  type = 'primary', isLoading = false
}) => {
  const styles = {
    primary: { icon: 'bg-indigo-50 text-indigo-600', btn: 'btn-primary' },
    danger:  { icon: 'bg-red-50   text-red-600',    btn: 'btn-danger'  },
    warning: { icon: 'bg-amber-50 text-amber-600',  btn: 'bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm rounded-lg px-5 py-2.5 cursor-pointer transition-colors duration-150' },
  };
  const s = styles[type] || styles.primary;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={isLoading ? null : onClose}
            className="fixed inset-0 bg-gray-900/40 z-[200]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.15 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-xl border border-gray-200 shadow-xl z-[201] overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-5">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${s.icon}`}>
                  <AlertTriangle size={20} />
                </div>
                <button
                  onClick={onClose} disabled={isLoading}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-700 cursor-pointer disabled:opacity-40"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="mb-6">
                <h2 className="text-base font-semibold text-gray-900 mb-1.5">{title}</h2>
                <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
              </div>

              <div className="flex gap-2.5">
                <button
                  onClick={onClose} disabled={isLoading}
                  className="btn-ghost flex-1 disabled:opacity-40"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={onConfirm} disabled={isLoading}
                  className={`${s.btn} flex-1 flex items-center justify-center gap-2`}
                >
                  {isLoading ? <Loader2 className="animate-spin" size={16} /> : confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;
