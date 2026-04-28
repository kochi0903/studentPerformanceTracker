import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';

const ShortcutItem = ({ keys, label }) => (
  <div className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
    <span className="text-sm text-slate-600">{label}</span>
    <div className="flex gap-1.5">
      {keys.map((key) => (
        <kbd 
          key={key}
          className="px-2 py-1 bg-slate-100 border-b-2 border-slate-200 rounded text-[10px] font-bold text-slate-900 min-w-[24px] text-center"
        >
          {key}
        </kbd>
      ))}
    </div>
  </div>
);

const KeyboardShortcutsHelp = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-[2rem] shadow-2xl z-[101] overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-900 rounded-xl">
                  <Keyboard className="text-white" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Keyboard Shortcuts</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Speed up your workflow</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-900"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-1">
              <div className="mb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Navigation</p>
                <ShortcutItem keys={['/']} label="Search students" />
                <ShortcutItem keys={['?']} label="Show keyboard help" />
                <ShortcutItem keys={['Esc']} label="Close modal / Clear search" />
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Live Session</p>
                <ShortcutItem keys={['Space']} label="Spin the wheel" />
                <ShortcutItem keys={['1', '2', '3', '4']} label="Rate student performance" />
                <ShortcutItem keys={['S']} label="Toggle 'Star moment' flag" />
                <ShortcutItem keys={['Enter']} label="Confirm rating & next" />
              </div>
            </div>

            <div className="p-4 bg-slate-50 text-center">
              <p className="text-[10px] text-slate-400 font-medium italic">"Utilitarian elegance means speed at your fingertips."</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default KeyboardShortcutsHelp;
