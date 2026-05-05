/**
 * ConfirmationModal — reusable confirm/alert dialog built on the Modal primitive.
 *
 * Props:
 *   isOpen        {boolean}
 *   onClose       {() => void}
 *   onConfirm     {() => void | Promise<void>}
 *   title         {string}
 *   message       {string | ReactNode}
 *   confirmLabel  {string}  default "Confirm"
 *   cancelLabel   {string}  default "Cancel"
 *   type          {"primary" | "danger" | "warning"}
 *   isLoading     {boolean}
 */
import React from 'react';
import { AlertTriangle, Info, CheckCircle, X, Loader2 } from 'lucide-react';
import Modal from './Modal';

const TYPE_STYLES = {
  primary: {
    iconWrap: 'bg-indigo-50 text-indigo-600',
    Icon: Info,
    btn: 'btn-primary',
  },
  danger: {
    iconWrap: 'bg-red-50 text-red-600',
    Icon: AlertTriangle,
    btn: 'btn-danger',
  },
  warning: {
    iconWrap: 'bg-amber-50 text-amber-600',
    Icon: AlertTriangle,
    btn: 'bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm rounded-lg px-5 py-2.5 cursor-pointer transition-colors duration-150',
  },
  success: {
    iconWrap: 'bg-emerald-50 text-emerald-600',
    Icon: CheckCircle,
    btn: 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg px-5 py-2.5 cursor-pointer transition-colors duration-150',
  },
};

const ConfirmationModal = ({
  isOpen, onClose, onConfirm,
  title, message,
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  type         = 'primary',
  isLoading    = false,
}) => {
  const s = TYPE_STYLES[type] || TYPE_STYLES.primary;
  const Icon = s.Icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-sm" closeOnBackdrop={!isLoading}>
      <div className="p-6">
        {/* Icon + close */}
        <div className="flex items-start justify-between mb-5">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${s.iconWrap}`}>
            <Icon size={20} />
          </div>
          <button
            onClick={onClose} disabled={isLoading}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-700 cursor-pointer disabled:opacity-40"
          >
            <X size={16} />
          </button>
        </div>

        {/* Text */}
        <div className="mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1.5">{title}</h2>
          <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5">
          <button onClick={onClose} disabled={isLoading} className="btn-ghost flex-1 disabled:opacity-40">
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
    </Modal>
  );
};

export default ConfirmationModal;
