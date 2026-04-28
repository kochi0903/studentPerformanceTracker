import React, { useState, useMemo } from 'react';
import { X, UserPlus, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { studentService } from '../../services/studentService';
import { useDispatch, useSelector } from 'react-redux';
import { addStudentsToStore, setError } from '../../store/studentSlice';

const BulkAddModal = ({ isOpen, onClose, batchId }) => {
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useDispatch();
  const existingStudents = useSelector(s => s.student.students);

  const parsedNames = useMemo(() => {
    if (!inputText.trim()) return [];
    return inputText
      .split(/[\n,]/)
      .map(n => n.trim())
      .filter(n => n.length > 0)
      .filter((n, i, arr) => arr.indexOf(n) === i);
  }, [inputText]);

  const duplicates = useMemo(() => {
    const existing = new Set(existingStudents.map(s => s.name.toLowerCase()));
    return parsedNames.filter(n => existing.has(n.toLowerCase()));
  }, [parsedNames, existingStudents]);

  const handleAdd = async () => {
    if (parsedNames.length === 0 || isSubmitting) return;
    const namesToAdd = parsedNames.filter(n => !duplicates.some(d => d.toLowerCase() === n.toLowerCase()));
    if (namesToAdd.length === 0) return;
    setIsSubmitting(true);
    try {
      const newStudents = await studentService.addStudentsBulk(batchId, namesToAdd);
      dispatch(addStudentsToStore(newStudents));
      setInputText('');
      onClose();
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const toAdd = parsedNames.length - duplicates.length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-gray-900/40"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.15 }}
          className="relative bg-white w-full max-w-lg rounded-xl border border-gray-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
                <UserPlus size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Bulk Add Students</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">One name per line, or comma-separated</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-700 cursor-pointer">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 flex-1 overflow-y-auto space-y-5">
            <div>
              <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-2 block">
                Student Names
              </label>
              <textarea
                autoFocus value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={"John Doe\nJane Smith, Michael Scott"}
                className="input-field h-44 resize-none leading-relaxed"
              />
            </div>

            {parsedNames.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
                    Preview — {parsedNames.length} name{parsedNames.length !== 1 ? 's' : ''}
                  </span>
                  {duplicates.length > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      <AlertCircle size={10} /> {duplicates.length} duplicate{duplicates.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {parsedNames.map((name, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border ${
                        duplicates.includes(name)
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                    >
                      {name}
                    </motion.span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
            <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button
              disabled={toAdd === 0 || isSubmitting}
              onClick={handleAdd}
              className="btn-primary flex-[2] flex items-center justify-center gap-2"
            >
              {isSubmitting
                ? <Loader2 size={16} className="animate-spin" />
                : <><CheckCircle2 size={16} /> Add {toAdd > 0 ? toAdd : parsedNames.length} Students</>
              }
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BulkAddModal;
