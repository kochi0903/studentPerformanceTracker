import React, { useMemo } from 'react';
import {
  X, TrendingUp, Tag, Zap, MessageSquare, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RATING_ORDINALS } from '../../utils/performance';

/* ── Rating colour map ──────────────────────────────── */
const RATING_STYLES = {
  Outstanding:  'bg-emerald-100 text-emerald-700',
  Good:         'bg-blue-100   text-blue-700',
  Average:      'bg-amber-100  text-amber-700',
  'Need Support':'bg-red-100   text-red-700',
};
const RATING_DOT = {
  Outstanding:  'bg-emerald-500',
  Good:         'bg-blue-500',
  Average:      'bg-amber-400',
  'Need Support':'bg-red-500',
};

/* ── Week timeline item ─────────────────────────────── */
const WeekTimelineItem = ({ entry, isLast }) => {
  const dot = RATING_DOT[entry.rating] || 'bg-gray-200';
  return (
    <div className="flex flex-col items-center gap-2 min-w-[100px]">
      <div className="relative flex items-center justify-center w-full">
        {!isLast && (
          <div className="absolute left-[50%] right-[-50%] top-[50%] h-px bg-gray-100 -z-10" />
        )}
        <div className={`w-9 h-9 rounded-lg ${dot} flex items-center justify-center text-white font-semibold text-sm z-10`}
          style={{ fontFamily: 'var(--font-display)' }}>
          {RATING_ORDINALS[entry.rating] || '—'}
        </div>
      </div>
      <div className="text-center">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Wk {entry.week}</p>
        <p className="text-[11px] font-medium text-gray-700 truncate max-w-[88px]">{entry.rating}</p>
      </div>
    </div>
  );
};

/* ── Drawer section ─────────────────────────────────── */
const DrawerSection = ({ icon: Icon, title, children }) => (
  <section>
    <div className="flex items-center gap-2 mb-4">
      <Icon size={15} className="text-indigo-500" />
      <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{title}</h3>
    </div>
    {children}
  </section>
);

/* ── Main component ─────────────────────────────────── */
const StudentDetailDrawer = ({ student, entries, isOpen, onClose }) => {
  const studentEntries = useMemo(() => {
    return entries
      .filter(e => e.studentId === student?.id)
      .sort((a, b) => a.week - b.week);
  }, [entries, student]);

  if (!student) return null;

  const initials = student.name.split(' ').map(n => n[0]).join('').toUpperCase();
  const enrolledDate = student.addedOn
    ? new Date(student.addedOn).toLocaleDateString()
    : 'Recently';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-gray-900/30 z-[150]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.22 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white border-l border-gray-200 shadow-2xl z-[200] flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm flex-shrink-0">
                  {initials}
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">{student.name}</h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">Enrolled {enrolledDate}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

              {/* Performance timeline */}
              <DrawerSection icon={TrendingUp} title="Performance Journey">
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  {studentEntries.length > 0 ? (
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                      {studentEntries.map((entry, i) => (
                        <WeekTimelineItem key={entry.id} entry={entry} isLast={i === studentEntries.length - 1} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Zap className="mx-auto text-gray-200 mb-2" size={24} />
                      <p className="text-xs text-gray-400 font-medium">No history yet</p>
                    </div>
                  )}
                </div>
              </DrawerSection>

              {/* Tags */}
              <DrawerSection icon={Tag} title="Student Tags">
                <div className="flex flex-wrap gap-2">
                  {student.tags?.map((tag, i) => (
                    <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-medium border border-indigo-100">
                      {tag}
                      <X size={11} className="cursor-pointer hover:text-indigo-900" />
                    </span>
                  ))}
                  <button className="px-3 py-1.5 bg-gray-50 text-gray-400 rounded-lg text-xs font-medium border border-dashed border-gray-200 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer flex items-center gap-1.5">
                    <Tag size={11} /> Add Tag
                  </button>
                </div>
              </DrawerSection>

              {/* Feedback notes */}
              <DrawerSection icon={MessageSquare} title="Weekly Feedback">
                <div className="space-y-3">
                  {studentEntries.filter(e => e.notes).length > 0 ? (
                    studentEntries.filter(e => e.notes).reverse().map((entry, i) => (
                      <div key={i} className="p-4 bg-white border border-gray-100 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Week {entry.week}</span>
                          <span className={`badge-pill ${RATING_STYLES[entry.rating] || 'bg-gray-100 text-gray-500'}`}>
                            {entry.rating}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">"{entry.notes}"</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400">No notes recorded for this student.</p>
                  )}
                </div>
              </DrawerSection>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button className="btn-ghost flex-1 flex items-center justify-center gap-2">
                <History size={15} /> Full History
              </button>
              <button className="btn-primary flex-1 flex items-center justify-center gap-2">
                <Zap size={15} /> Rate Now
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default StudentDetailDrawer;
