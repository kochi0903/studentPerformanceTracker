import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Plus, Loader2 } from 'lucide-react';
import Modal from '../common/Modal';
import { batchService } from '../../services/batchService';
import { addBatch, setLoading, setError } from '../../store/batchSlice';

const CreateBatchModal = ({ isOpen, onClose }) => {
  const [name, setName]               = useState('');
  const [description, setDescription] = useState('');
  const user                          = useSelector((s) => s.auth.user);
  const { loading, error }            = useSelector((s) => s.batch);
  const dispatch                      = useDispatch();

  const handleClose = () => {
    if (loading) return;
    setName('');
    setDescription('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    dispatch(setLoading(true));
    try {
      const newBatch = await batchService.createBatch(user.uid, { name: name.trim(), description: description.trim() });
      dispatch(addBatch(newBatch));
      setName('');
      setDescription('');
      onClose();
    } catch (err) {
      dispatch(setError(err.message));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-md" closeOnBackdrop={!loading}>
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
          onClick={handleClose} disabled={loading}
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
          <button type="button" onClick={handleClose} disabled={loading} className="btn-ghost flex-1 disabled:opacity-40">
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="btn-primary flex-[2] flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : 'Create Batch'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateBatchModal;
