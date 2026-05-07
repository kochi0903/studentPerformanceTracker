/**
 * ManualRatingModal — lets a trainer manually rate any student for any week.
 *
 * Props:
 *   student      {Object|null}   — student to rate
 *   batchId      {string}
 *   currentWeek  {number}        — max selectable week
 *   isOpen       {boolean}
 *   onClose      {() => void}
 *   onRated      {(entry) => void} — called with the new entry after save
 */
import React, { useState, useEffect } from 'react';
import { Loader2, Star, Zap } from 'lucide-react';
import Modal from '../common/Modal';
import { studentService } from '../../services/studentService';

const RATING_OPTIONS = [
  {
    value: 1, label: 'Need Support',
    btn:   'border-red-200 bg-red-50 text-red-600 hover:bg-red-100',
    active: 'border-red-500 bg-red-500 text-white',
    dot:   'bg-red-500',
  },
  {
    value: 2, label: 'Average',
    btn:   'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100',
    active: 'border-amber-500 bg-amber-500 text-white',
    dot:   'bg-amber-400',
  },
  {
    value: 3, label: 'Good',
    btn:   'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100',
    active: 'border-blue-500 bg-blue-500 text-white',
    dot:   'bg-blue-500',
  },
  {
    value: 4, label: 'Outstanding',
    btn:   'border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100',
    active: 'border-emerald-500 bg-emerald-500 text-white',
    dot:   'bg-emerald-500',
  },
];

const ManualRatingModal = ({ student, batchId, currentWeek, isOpen, onClose, onRated }) => {
  const [selectedWeek,   setSelectedWeek]   = useState(currentWeek);
  const [selectedRating, setSelectedRating] = useState(null);
  const [notes,          setNotes]          = useState('');
  const [isStarMoment,   setIsStarMoment]   = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState('');

  // Reset form when the modal opens for a new student
  useEffect(() => {
    if (isOpen) {
      setSelectedWeek(currentWeek);
      setSelectedRating(null);
      setNotes('');
      setIsStarMoment(false);
      setError('');
    }
  }, [isOpen, currentWeek]);

  if (!student) return null;

  const initials = student.name.split(' ').map(n => n[0]).join('').toUpperCase();

  const handleSubmit = async () => {
    if (!selectedRating) { setError('Please choose a rating.'); return; }
    setSaving(true);
    setError('');
    try {
      const ratingLabel = RATING_OPTIONS.find(r => r.value === selectedRating)?.label;
      const ratingData  = { rating: ratingLabel, notes: notes.trim(), isStarMoment };
      const entry = await studentService.addWeeklyEntry(batchId, student.id, selectedWeek, ratingData);
      onRated({
        ...ratingData,
        id: entry.id,
        batchId,
        studentId: student.id,
        week: selectedWeek,
        ratedAt: new Date().toISOString(),
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save rating.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-sm" closeOnBackdrop={!saving}>
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm flex-shrink-0">
            {initials}
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">{student.name}</h2>
            <p className="text-[11px] text-gray-400">Manual Evaluation</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Week selector */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
            Week
          </label>
          <select
            value={selectedWeek}
            onChange={e => setSelectedWeek(Number(e.target.value))}
            className="input-field text-sm"
          >
            {Array.from({ length: currentWeek }, (_, i) => i + 1).map(w => (
              <option key={w} value={w}>Week {w}{w === currentWeek ? ' (current)' : ''}</option>
            ))}
          </select>
        </div>

        {/* Rating picker */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
            Rating <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {RATING_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => { setSelectedRating(opt.value); setError(''); }}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border text-sm font-semibold transition-all cursor-pointer ${
                  selectedRating === opt.value ? opt.active : opt.btn
                }`}
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  selectedRating === opt.value ? 'bg-white' : opt.dot
                }`} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Star moment toggle */}
        <button
          onClick={() => setIsStarMoment(p => !p)}
          className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-all cursor-pointer ${
            isStarMoment
              ? 'bg-amber-50 border-amber-300 text-amber-700'
              : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
          }`}
        >
          <Star size={15} fill={isStarMoment ? 'currentColor' : 'none'} />
          Flag as Star Moment
        </button>

        {/* Notes */}
        <div>
          <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2">
            Notes <span className="text-gray-300 font-normal normal-case tracking-normal">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add feedback or observations…"
            className="input-field min-h-[72px] resize-none text-sm"
          />
        </div>

        {error && (
          <p className="text-xs text-red-500 font-medium">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2.5 pt-1">
          <button onClick={onClose} disabled={saving} className="btn-ghost flex-1 disabled:opacity-40">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !selectedRating}
            className="btn-primary flex-[2] flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : <><Zap size={14} /> Save Rating</>}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ManualRatingModal;
