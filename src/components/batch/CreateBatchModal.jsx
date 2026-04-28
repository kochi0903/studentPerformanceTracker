import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Loader2 } from 'lucide-react';
import { batchService } from '../../services/batchService';
import { addBatch, setLoading, setError } from '../../store/batchSlice';

const CreateBatchModal = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const user = useSelector((s) => s.auth.user);
  const { loading, error } = useSelector((s) => s.batch);
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    dispatch(setLoading(true));
    try {
      const newBatch = await batchService.createBatch(user.uid, { name, description });
      dispatch(addBatch(newBatch));
      setName('');
      setDescription('');
      onClose();
    } catch (err) {
      dispatch(setError(err.message));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={loading ? null : onClose}
            className="fixed inset-0 bg-gray-900/40 z-[200]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.15 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl border border-gray-200 shadow-xl z-[201] overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Plus className="text-white" size={18} />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">New Batch</h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">Set up your next cohort</p>
                </div>
              </div>
              <button
                onClick={onClose} disabled={loading}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-700 cursor-pointer disabled:opacity-40"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                  Batch Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text" required autoFocus
                  className="input-field"
                  placeholder="e.g. MERN Stack 2024 — Batch A"
                  value={name} onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                  Description <span className="text-gray-300 font-normal normal-case tracking-normal">(optional)</span>
                </label>
                <textarea
                  className="input-field min-h-[90px] resize-none"
                  placeholder="Schedule, tech stack, or any notes…"
                  value={description} onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-2.5 pt-1">
                <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="btn-primary flex-[2] flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : 'Create Batch'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreateBatchModal;
