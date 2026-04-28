import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Layers, Search, Trash2, Calendar, Users, Plus,
  Zap, CheckCircle2, AlertCircle, ArrowRight, Clock, Filter, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { batchService } from '../../services/batchService';
import { removeBatchFromStore, setActiveBatch, setLoading, setError } from '../../store/batchSlice';
import ConfirmationModal from '../common/ConfirmationModal';
import CreateBatchModal from './CreateBatchModal';

/* ── Summary metric chip ────────────────────────────── */
const MetricChip = ({ icon: Icon, label, value, accent }) => (
  <div className="card flex items-center gap-3 px-4 py-3 min-w-[160px]">
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${accent}`}>
      <Icon size={15} className="text-white" />
    </div>
    <div>
      <p className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>{value}</p>
      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">{label}</p>
    </div>
  </div>
);

const BatchList = () => {
  const { batches, activeBatch, loading } = useSelector((s) => s.batch);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState('Active');
  const [batchToDelete, setBatchToDelete] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredBatches = useMemo(() => batches.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = currentTab === 'All' || (currentTab === 'Active' && !b.isArchived);
    return matchesSearch && matchesTab;
  }), [batches, searchQuery, currentTab]);

  const stats = useMemo(() => ({
    total: batches.length,
    active: batches.filter(b => !b.isArchived).length,
    weeks: batches.reduce((acc, b) => acc + (b.currentWeek || 0), 0),
  }), [batches]);

  const handleDeleteBatch = async () => {
    if (!batchToDelete) return;
    dispatch(setLoading(true));
    try {
      await batchService.archiveBatch(batchToDelete.id);
      dispatch(removeBatchFromStore(batchToDelete.id));
      setBatchToDelete(null);
    } catch (err) {
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto w-full">
      <ConfirmationModal
        isOpen={!!batchToDelete} onClose={() => setBatchToDelete(null)}
        onConfirm={handleDeleteBatch}
        title="Delete Batch?"
        message={`Are you sure you want to delete "${batchToDelete?.name}"? This cannot be undone.`}
        confirmLabel="Delete Batch" type="danger" isLoading={loading}
      />
      <CreateBatchModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 mb-7">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1" style={{ fontFamily: 'var(--font-display)' }}>My Batches</h1>
          <nav className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400">
            <span>Dashboard</span><span>·</span>
            <span className="text-gray-700">Batches</span>
          </nav>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={15} /> Create New Batch
        </button>
      </div>

      {/* Metrics */}
      <div className="flex flex-wrap gap-3 mb-7 overflow-x-auto pb-1">
        <MetricChip icon={Layers}     label="Total Batches"  value={stats.total}  accent="bg-indigo-500" />
        <MetricChip icon={CheckCircle2} label="Active"       value={stats.active} accent="bg-emerald-500" />
        <MetricChip icon={Clock}      label="Total Weeks"    value={stats.weeks}  accent="bg-amber-500" />
      </div>

      {/* Table card */}
      <div className="data-table-container">

        {/* Tabs + Search */}
        <div className="px-5 pt-4 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-gray-100">
          <div className="flex items-center gap-6 w-full md:w-auto">
            {['Active', 'All'].map(tab => (
              <button
                key={tab}
                onClick={() => setCurrentTab(tab)}
                className={`pb-3 text-xs font-semibold transition-colors duration-150 relative ${
                  currentTab === tab ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab}
                <span className={`ml-1.5 px-1.5 py-0.5 rounded text-[10px] ${
                  currentTab === tab ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-400'
                }`}>
                  {tab === 'All' ? stats.total : stats.active}
                </span>
                {currentTab === tab && (
                  <motion.div layoutId="batch-tab-line" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
                )}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72 pb-3 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={14} />
            <input
              type="text" placeholder="Search batches..."
              className="input-field pl-9 py-2 text-xs"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table header */}
        <div className="data-table-header">
          <div className="w-8">
            <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
          </div>
          <div className="flex-1">Batch</div>
          <div className="w-28">Status</div>
          <div className="w-28">Week</div>
          <div className="w-40 text-right">Actions</div>
        </div>

        {/* Table body */}
        <div className="min-h-[280px]">
          {loading && batches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="animate-spin text-indigo-400 mb-3" size={28} />
              <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">Loading…</p>
            </div>
          ) : filteredBatches.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {filteredBatches.map((batch) => (
                <motion.div
                  key={batch.id} layout
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className={`data-table-row cursor-pointer group ${activeBatch?.id === batch.id ? 'bg-indigo-50/40' : ''}`}
                  onClick={() => dispatch(setActiveBatch(batch))}
                >
                  <div className="w-8" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  </div>
                  <div className="flex-1 flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      activeBatch?.id === batch.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <Layers size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-700 transition-colors">{batch.name}</p>
                      <p className="text-[11px] text-gray-400 truncate max-w-[200px]">
                        {batch.description || 'No description'}
                      </p>
                    </div>
                  </div>
                  <div className="w-28">
                    <span className={`badge-pill ${batch.isArchived ? 'bg-gray-100 text-gray-500' : 'badge-outstanding'}`}>
                      {batch.isArchived ? 'Archived' : 'Active'}
                    </span>
                  </div>
                  <div className="w-28">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-gray-300" />
                      <span className="text-xs font-medium text-gray-600">Week {batch.currentWeek}</span>
                    </div>
                  </div>
                  <div className="w-40 text-right flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => navigate(`/live/${batch.id}`)} title="Live Session"
                      className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors duration-150 cursor-pointer"
                    >
                      <Zap size={15} />
                    </button>
                    <button
                      onClick={() => { dispatch(setActiveBatch(batch)); navigate('/students'); }} title="View Students"
                      className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors duration-150 cursor-pointer"
                    >
                      <Users size={15} />
                    </button>
                    <button
                      onClick={() => setBatchToDelete(batch)} title="Delete"
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-150 opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Filter size={28} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">No batches found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchList;
