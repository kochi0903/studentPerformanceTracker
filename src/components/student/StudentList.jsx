import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Users, Search, UserPlus, Loader2, Trash2, X,
  TrendingUp, TrendingDown, Star, AlertCircle, CheckCircle2,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { studentService } from '../../services/studentService';
import { setStudents, setEntries, setLoading, setError, removeStudentsFromStore } from '../../store/studentSlice';
import { computeTrend, detectFlags, getCurrentRating } from '../../utils/performance';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import BulkAddModal from './BulkAddModal';
import StudentDetailDrawer from './StudentDetailDrawer';
import ConfirmationModal from '../common/ConfirmationModal';

/* ── Metric chip ────────────────────────────────────── */
const MetricChip = ({ icon: Icon, label, value, accent }) => (
  <div className="card flex items-center gap-3 px-4 py-3 min-w-[150px]">
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${accent}`}>
      <Icon size={15} className="text-white" />
    </div>
    <div>
      <p className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{value}</p>
      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">{label}</p>
    </div>
  </div>
);

const TABS = ['All', 'Outstanding', 'Good', 'Average', 'Need Support'];

const StudentList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { batches, activeBatch, loading: batchLoading } = useSelector((s) => s.batch);
  const { students, entries, loading: studentLoading } = useSelector((s) => s.student);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState('All');
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (activeBatch) loadData();
    setSelectedIds([]);
  }, [activeBatch]);

  const loadData = async () => {
    dispatch(setLoading(true));
    try {
      const [studentsData, entriesData] = await Promise.all([
        studentService.getStudentsByBatch(activeBatch.id),
        studentService.getWeeklyEntries(activeBatch.id),
      ]);
      dispatch(setStudents(studentsData));
      dispatch(setEntries(entriesData));
    } catch (err) {
      dispatch(setError(err.message));
    }
  };

  const studentStats = useMemo(() => students.map(s => {
    const se = entries.filter(e => e.studentId === s.id).sort((a, b) => a.week - b.week);
    return {
      ...s,
      currentRating: getCurrentRating(se, activeBatch?.currentWeek || 1),
      trend: computeTrend(se),
      flags: detectFlags(se),
      // Show the last week they were rated; for new students show the current week
      lastRatedWeek: se.length > 0 ? se[se.length - 1].week : (activeBatch?.currentWeek ?? '—'),
    };
  }), [students, entries, activeBatch]);

  const filteredStudents = useMemo(() => studentStats.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = currentTab === 'All' || s.currentRating === currentTab;
    return matchesSearch && matchesTab;
  }), [studentStats, searchQuery, currentTab]);

  const stats = useMemo(() => ({
    total: students.length,
    stars: studentStats.filter(s => s.flags.includes('Star Student')).length,
    improving: studentStats.filter(s => s.trend === 'Improving').length,
    support: studentStats.filter(s => s.flags.includes('Need Support')).length,
  }), [students, studentStats]);

  const handleToggleSelect = (id) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const handleSelectAll = () =>
    setSelectedIds(selectedIds.length === filteredStudents.length ? [] : filteredStudents.map(s => s.id));

  const handleDeleteSingle = async () => {
    if (!studentToDelete) return;
    dispatch(setLoading(true));
    try {
      await studentService.deleteStudent(studentToDelete.id);
      dispatch(removeStudentsFromStore(studentToDelete.id));
      setStudentToDelete(null);
    } catch (err) { dispatch(setError(err.message)); }
    finally { dispatch(setLoading(false)); }
  };

  const handleDeleteBulk = async () => {
    if (!selectedIds.length) return;
    dispatch(setLoading(true));
    try {
      await studentService.deleteStudentsBulk(selectedIds);
      dispatch(removeStudentsFromStore(selectedIds));
      setSelectedIds([]);
      setIsBulkDeleteOpen(false);
    } catch (err) { dispatch(setError(err.message)); }
    finally { dispatch(setLoading(false)); }
  };

  useKeyboardShortcuts({
    '/': () => searchInputRef.current?.focus(),
    'n': () => setIsBulkAddOpen(true),
    'Escape': () => setSelectedIds([]),
  });

  /* ── Loading / empty states ── */
  if (batchLoading && batches.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-indigo-400 mb-3" size={28} />
        <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">Loading batches…</p>
      </div>
    );
  }

  if (!activeBatch) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 mb-5">
          <Users size={28} />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No batch selected</h2>
        <p className="text-sm text-gray-500 max-w-xs mb-7">
          Select a batch from the sidebar or My Batches to view students.
        </p>
        <button onClick={() => navigate('/batches')} className="btn-primary">
          Go to My Batches
        </button>
      </div>
    );
  }

  const ratingBadge = (rating) => ({
    Outstanding: 'badge-outstanding',
    Good:        'badge-good',
    Average:     'badge-average',
    'Need Support': 'badge-support',
  }[rating] || 'bg-gray-100 text-gray-400');

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto w-full">
      <BulkAddModal isOpen={isBulkAddOpen} onClose={() => setIsBulkAddOpen(false)} batchId={activeBatch.id} />
      <StudentDetailDrawer student={selectedStudent} entries={entries} isOpen={!!selectedStudent} onClose={() => setSelectedStudent(null)} />
      <ConfirmationModal isOpen={!!studentToDelete} onClose={() => setStudentToDelete(null)} onConfirm={handleDeleteSingle}
        title="Delete Student?" message={`Remove ${studentToDelete?.name}?`} confirmLabel="Delete" type="danger" isLoading={studentLoading} />
      <ConfirmationModal isOpen={isBulkDeleteOpen} onClose={() => setIsBulkDeleteOpen(false)} onConfirm={handleDeleteBulk}
        title={`Delete ${selectedIds.length} Students?`} message={`Permanently remove ${selectedIds.length} students. This cannot be undone.`}
        confirmLabel="Delete All" type="danger" isLoading={studentLoading} />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 mb-7">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-display)' }}>Student List</h1>
          <nav className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
            <span>Dashboard</span><span>·</span>
            <span className="text-gray-700">{activeBatch.name}</span><span>·</span>
            <span>Students</span>
          </nav>
        </div>
        <button onClick={() => setIsBulkAddOpen(true)} className="btn-primary flex items-center gap-2">
          <UserPlus size={15} /> Add Students
        </button>
      </div>

      {/* Metrics */}
      <div className="flex flex-wrap gap-3 mb-7 overflow-x-auto pb-1">
        <MetricChip icon={Users}       label="Total"    value={stats.total}    accent="bg-indigo-500" />
        <MetricChip icon={Star}        label="Stars"    value={stats.stars}    accent="bg-emerald-500" />
        <MetricChip icon={TrendingUp}  label="Improving"value={stats.improving}accent="bg-blue-500" />
        <MetricChip icon={AlertCircle} label="Support"  value={stats.support}  accent="bg-red-500" />
      </div>

      {/* Table */}
      <div className="data-table-container mb-24">
        {/* Tabs + Search */}
        <div className="px-5 pt-4 flex flex-col lg:flex-row justify-between items-center gap-4 border-b border-gray-100">
          <div className="flex items-center gap-5 w-full lg:w-auto overflow-x-auto scrollbar-hide">
            {TABS.map(tab => {
              const count = tab === 'All' ? stats.total : studentStats.filter(s => s.currentRating === tab).length;
              return (
                <button
                  key={tab}
                  onClick={() => setCurrentTab(tab)}
                  className={`pb-3 text-xs font-semibold transition-colors duration-150 whitespace-nowrap relative flex items-center gap-1.5 ${
                    currentTab === tab ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab}
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                    currentTab === tab ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-400'
                  }`}>{count}</span>
                  {currentTab === tab && (
                    <motion.div layoutId="student-tab-line" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
                  )}
                </button>
              );
            })}
          </div>
          <div className="relative w-full lg:w-80 group pb-3 lg:pb-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={14} />
            <input
              ref={searchInputRef} type="text"
              placeholder="Search student… (/)"
              className="input-field pl-9 py-2 text-xs"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table header */}
        <div className="data-table-header">
          <div className="w-8">
            <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              checked={selectedIds.length === filteredStudents.length && filteredStudents.length > 0}
              onChange={handleSelectAll} />
          </div>
          <div className="flex-1">Student</div>
          <div className="w-36">Rating</div>
          <div className="w-28">Trend</div>
          <div className="w-20">Week</div>
          <div className="w-12 text-right">—</div>
        </div>

        {/* Table body */}
        <div className="min-h-[360px]">
          {studentLoading && students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="animate-spin text-indigo-400 mb-3" size={28} />
              <p className="text-xs text-gray-400 uppercase tracking-widest">Loading…</p>
            </div>
          ) : filteredStudents.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {filteredStudents.map((student) => (
                <motion.div
                  key={student.id} layout
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className={`data-table-row cursor-pointer group ${selectedIds.includes(student.id) ? 'bg-indigo-50/40' : ''}`}
                  onClick={() => setSelectedStudent(student)}
                >
                  <div className="w-8" onClick={e => e.stopPropagation()}>
                    <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      checked={selectedIds.includes(student.id)} onChange={() => handleToggleSelect(student.id)} />
                  </div>
                  <div className="flex-1 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-[11px] font-semibold text-indigo-700 flex-shrink-0">
                      {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-700 transition-colors">{student.name}</p>
                      <p className="text-[10px] text-gray-400">{student.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="w-36">
                    <span className={`badge-pill ${ratingBadge(student.currentRating)}`}>{student.currentRating}</span>
                  </div>
                  <div className="w-28 flex items-center gap-1.5">
                    {student.trend === 'Improving' ? <TrendingUp size={13} className="text-emerald-500" /> :
                     student.trend === 'Declining' ? <TrendingDown size={13} className="text-red-500" /> :
                     <TrendingUp size={13} className="text-gray-300" />}
                    <span className="text-[11px] text-gray-500 font-medium">{student.trend}</span>
                  </div>
                  <div className="w-20">
                    <span className="text-[11px] font-semibold text-gray-600 px-2 py-0.5 bg-gray-100 rounded">
                      Wk {student.lastRatedWeek}
                    </span>
                  </div>
                  <div className="w-12 text-right" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setStudentToDelete(student)}
                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Filter size={28} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">No results found</p>
            </div>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'tween', duration: 0.18 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-xl"
          >
            <div className="bg-gray-900 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center justify-between gap-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-sm font-semibold">
                  {selectedIds.length}
                </div>
                <p className="text-sm font-medium">Students selected</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setSelectedIds([])} className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer">
                  <X size={13} /> Clear
                </button>
                <button onClick={() => setIsBulkDeleteOpen(true)} className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer">
                  <Trash2 size={13} /> Delete Selected
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudentList;
