import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bell, Plus, Play, ChevronRight, AlertCircle,
  TrendingUp, User, History, CheckCircle2, Layers, Loader2,
} from "lucide-react";
import { batchService } from "../../services/batchService";
import { studentService } from "../../services/studentService";
import { updateBatchInStore, setLoading as setBatchLoading, setError as setBatchError } from "../../store/batchSlice";
import { setStudents, setEntries, setLoading as setStudentLoading } from "../../store/studentSlice";
import { computeTrend, detectFlags, getCurrentRating } from "../../utils/performance";
import ConfirmationModal from "../common/ConfirmationModal";
import CreateBatchModal from "../batch/CreateBatchModal";

const StatCard = ({ icon: Icon, label, value, accent }) => (
  <div className="stat-card flex items-center gap-4">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${accent}`}>
      {Icon && <Icon size={18} className="text-white" />}
    </div>
    <div>
      <p className="text-2xl font-semibold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>
        {value ?? "0"}
      </p>
      <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium mt-0.5">{label}</p>
    </div>
  </div>
);

const StudentAttentionRow = ({ name, rating, flags, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors duration-150 cursor-pointer group text-left"
  >
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-semibold flex-shrink-0">
        {name.split(" ").map((n) => n[0]).join("")}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-700 transition-colors">{name}</p>
        <div className="flex gap-1.5 mt-0.5">
          {flags.slice(0, 2).map((f, i) => (
            <span key={i} className="badge-pill badge-support">{f}</span>
          ))}
        </div>
      </div>
    </div>
    <ChevronRight size={14} className="text-gray-300 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
  </button>
);

const Section = ({ title, icon: Icon, action, children }) => (
  <section className="card p-6 h-full flex flex-col">
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2.5">
        <Icon size={16} className="text-indigo-500" />
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>
      {action}
    </div>
    <div className="flex-1">{children}</div>
  </section>
);

const Dashboard = () => {
  const user = useSelector((s) => s.auth.user);
  const { activeBatch, batches, loading: batchLoading } = useSelector((s) => s.batch);
  const { students, entries, loading: studentLoading } = useSelector((s) => s.student);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isConfirmWeekOpen, setIsConfirmWeekOpen] = useState(false);
  const [isCreateBatchOpen, setIsCreateBatchOpen] = useState(false);

  const loadData = async () => {
    dispatch(setStudentLoading(true));
    try {
      const [studentsData, entriesData] = await Promise.all([
        studentService.getStudentsByBatch(activeBatch.id),
        studentService.getWeeklyEntries(activeBatch.id),
      ]);
      dispatch(setStudents(studentsData));
      dispatch(setEntries(entriesData));
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      dispatch(setStudentLoading(false));
    }
  };

  useEffect(() => { if (activeBatch) loadData(); }, [loadData, activeBatch]);

  const dashboardData = useMemo(() => {
    if (!activeBatch)
      return { stats: { total: 0, outstanding: 0, needSupport: 0, improving: 0 }, attentionList: [], distribution: {} };

    const currentWeek = activeBatch.currentWeek;
    const sp = students.map((s) => {
      const se = entries.filter((e) => e.studentId === s.id).sort((a, b) => a.week - b.week);
      return { ...s, rating: getCurrentRating(se, currentWeek), trend: computeTrend(se), flags: detectFlags(se) };
    });

    return {
      stats: {
        total: students.length,
        outstanding: sp.filter((p) => p.rating === "Outstanding").length,
        needSupport: sp.filter((p) => p.flags.includes("Need Support")).length,
        improving: sp.filter((p) => p.trend === "Improving").length,
      },
      attentionList: sp.filter((p) => p.flags.includes("Need Support")).slice(0, 5),
      distribution: {
        Outstanding: sp.filter((p) => p.rating === "Outstanding").length,
        Good: sp.filter((p) => p.rating === "Good").length,
        Average: sp.filter((p) => p.rating === "Average").length,
        "Need Support": sp.filter((p) => p.rating === "Need Support").length,
      },
    };
  }, [students, entries, activeBatch]);

  const handleStartNewWeek = async () => {
    if (!activeBatch) return;
    dispatch(setBatchLoading(true));
    try {
      const nextWeek = activeBatch.currentWeek + 1;
      await batchService.updateBatch(activeBatch.id, { currentWeek: nextWeek });
      dispatch(updateBatchInStore({ id: activeBatch.id, currentWeek: nextWeek }));
      setIsConfirmWeekOpen(false);
    } catch (err) {
      dispatch(setBatchError(err.message));
    } finally {
      dispatch(setBatchLoading(false));
    }
  };

  if (batches.length === 0 && !batchLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 mb-5">
          <Layers size={28} />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No batches yet</h2>
        <p className="text-sm text-gray-500 max-w-xs mb-7">
          Create your first training batch to start tracking student performance.
        </p>
        <button onClick={() => setIsCreateBatchOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Create First Batch
        </button>
        <CreateBatchModal isOpen={isCreateBatchOpen} onClose={() => setIsCreateBatchOpen(false)} />
      </div>
    );
  }

  const distRows = [
    { label: "Outstanding",  count: dashboardData.distribution["Outstanding"],  color: "bg-emerald-500" },
    { label: "Good",         count: dashboardData.distribution["Good"],         color: "bg-blue-500" },
    { label: "Average",      count: dashboardData.distribution["Average"],      color: "bg-amber-400" },
    { label: "Need Support", count: dashboardData.distribution["Need Support"], color: "bg-red-500" },
  ];

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto w-full">
      <ConfirmationModal
        isOpen={isConfirmWeekOpen} onClose={() => setIsConfirmWeekOpen(false)}
        onConfirm={handleStartNewWeek}
        title={`Start Week ${activeBatch ? activeBatch.currentWeek + 1 : ""}?`}
        message={`All students in ${activeBatch?.name} will be unrated for the new week.`}
        confirmLabel="Start New Week" type="primary"
      />
      <CreateBatchModal isOpen={isCreateBatchOpen} onClose={() => setIsCreateBatchOpen(false)} />

      {/* Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start gap-5 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1" style={{ fontFamily: "var(--font-display)" }}>
            Welcome, {user?.name?.split(" ")[0] || "Trainer"}
          </h1>
          <p className="text-sm text-gray-500">
            {activeBatch ? `Managing ${activeBatch.name}` : "Select a batch to begin"}
            {" · "}<span className="text-indigo-600 font-medium">{batches.length} batches</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button onClick={() => navigate(`/live/${activeBatch?.id}`)} disabled={!activeBatch}
            className="btn-primary flex items-center gap-2 flex-1 sm:flex-none justify-center disabled:opacity-30">
            <Play size={14} fill="currentColor" /> Start Session
          </button>
          <button onClick={() => setIsCreateBatchOpen(true)} className="btn-ghost flex items-center gap-2 flex-1 sm:flex-none justify-center">
            <Plus size={14} /> New Batch
          </button>
          <button className="btn-ghost flex items-center gap-2 flex-1 sm:flex-none justify-center">
            <Bell size={14} /> Alerts
          </button>
        </div>
      </header>

      {/* Batch bar */}
      <div className="card px-5 py-3.5 mb-7 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-md text-xs font-medium">
            <Layers size={12} /> {activeBatch?.name || "No Batch Selected"}
          </div>
          {activeBatch?.description && (
            <p className="text-sm text-gray-500 hidden sm:block truncate max-w-xs">{activeBatch.description}</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-gray-700" style={{ fontFamily: "var(--font-display)" }}>
              Week {activeBatch?.currentWeek || 1}
            </span>
          </div>
          <button onClick={() => setIsConfirmWeekOpen(true)} disabled={!activeBatch || batchLoading}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
            Next Week →
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={User}        label="Total Students" value={dashboardData.stats.total}       accent="bg-slate-600" />
        <StatCard icon={TrendingUp}  label="Outstanding"    value={dashboardData.stats.outstanding} accent="bg-emerald-500" />
        <StatCard icon={AlertCircle} label="Need Support"   value={dashboardData.stats.needSupport} accent="bg-red-500" />
        <StatCard icon={TrendingUp}  label="Improving"      value={dashboardData.stats.improving}   accent="bg-indigo-500" />
      </div>

      {!activeBatch && (
        <div className="card p-16 text-center">
          <Layers className="mx-auto text-gray-200 mb-4" size={36} />
          <p className="text-sm text-gray-400">Select a batch to see analytics</p>
        </div>
      )}

      {activeBatch && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Attention */}
          <Section title="Needs Attention" icon={AlertCircle}
            action={
              <button onClick={() => navigate("/students")} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer flex items-center gap-1">
                View all <ChevronRight size={12} />
              </button>
            }>
            {studentLoading ? (
              <div className="flex items-center justify-center py-10"><Loader2 className="animate-spin text-gray-300" size={24} /></div>
            ) : dashboardData.attentionList.length > 0 ? (
              <div className="space-y-1">
                {dashboardData.attentionList.map((s) => (
                  <StudentAttentionRow key={s.id} name={s.name} rating={s.rating} flags={s.flags} onClick={() => navigate("/students")} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10">
                <CheckCircle2 size={28} className="mb-3 text-emerald-400" />
                <p className="text-sm text-gray-500">All students performing well</p>
              </div>
            )}
          </Section>

          {/* Sessions */}
          <Section title="Recent Sessions" icon={History}>
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <Play size={28} className="mb-3 opacity-30" />
              <p className="text-sm">No sessions recorded yet.</p>
            </div>
          </Section>

          {/* Distribution */}
          <Section title={`Week ${activeBatch.currentWeek} Distribution`} icon={TrendingUp}>
            {studentLoading ? (
              <div className="flex items-center justify-center py-10"><Loader2 className="animate-spin text-gray-300" size={24} /></div>
            ) : dashboardData.stats.total > 0 && Object.values(dashboardData.distribution).some((v) => v > 0) ? (
              <div className="space-y-5">
                {distRows.map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs font-medium text-gray-600 mb-1.5">
                      <span>{item.label}</span>
                      <span className="text-gray-900 font-semibold">{item.count}</span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${dashboardData.stats.total > 0 ? (item.count / dashboardData.stats.total) * 100 : 0}%` }}
                        transition={{ duration: 0.7, delay: i * 0.1 }}
                        className={`h-full ${item.color} rounded-full`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <p className="text-sm">No ratings yet</p>
                <p className="text-xs mt-1">Start a live session to see data.</p>
              </div>
            )}
          </Section>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
