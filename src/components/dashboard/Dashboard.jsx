import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bell,
  Plus,
  Play,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  User,
  CheckCircle2,
  Layers,
  Loader2,
  BarChart2,
  CalendarDays,
  ListChecks,
} from "lucide-react";
import { batchService } from "../../services/batchService";
import { studentService } from "../../services/studentService";
import {
  updateBatchInStore,
  setLoading as setBatchLoading,
  setError as setBatchError,
} from "../../store/batchSlice";
import {
  setStudents,
  setEntries,
  setLoading as setStudentLoading,
} from "../../store/studentSlice";
import {
  computeTrend,
  detectFlags,
  getCurrentRating,
} from "../../utils/performance";
import { normalizeRatingRules } from "../../utils/ratingConfig";
import ConfirmationModal from "../common/ConfirmationModal";
import CreateBatchModal from "../batch/CreateBatchModal";

/* ── Sub-components ──────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, accent }) => (
  <div className="stat-card flex items-center gap-4">
    <div
      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${accent}`}
    >
      {Icon && <Icon size={18} className="text-white" />}
    </div>
    <div>
      <p
        className="text-2xl font-semibold text-gray-900"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value ?? "0"}
      </p>
      <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium mt-0.5">
        {label}
      </p>
    </div>
  </div>
);

const StudentAttentionRow = ({ name, flags, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors duration-150 cursor-pointer group text-left"
  >
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-semibold flex-shrink-0">
        {name
          .split(" ")
          .map((n) => n[0])
          .join("")}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-700 transition-colors">
          {name}
        </p>
        <div className="flex gap-1.5 mt-0.5">
          {flags.slice(0, 2).map((f, i) => (
            <span key={i} className="badge-pill badge-support">
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
    <ChevronRight
      size={14}
      className="text-gray-300 group-hover:text-indigo-400 transition-colors flex-shrink-0"
    />
  </button>
);

/* ── Main Dashboard ──────────────────────────────────────────── */
const Dashboard = () => {
  const user = useSelector((s) => s.auth.user);
  const {
    activeBatch,
    batches,
    loading: batchLoading,
  } = useSelector((s) => s.batch);
  const {
    students,
    entries,
    loading: studentLoading,
  } = useSelector((s) => s.student);
  const { config } = useSelector((s) => s.settings);
  const ratingRules = useMemo(() => normalizeRatingRules(config), [config]);
  const ratingLabels = useMemo(
    () => ratingRules.filter((rule) => rule.isActive).map((rule) => rule.label),
    [ratingRules],
  );
  const topRatingLabel = useMemo(
    () =>
      ratingRules.reduce(
        (current, rule) => (rule.value > current.value ? rule : current),
        ratingRules[0] || { value: 0, label: "Outstanding" },
      ).label,
    [ratingRules],
  );
  const supportRatingLabel = useMemo(
    () =>
      ratingRules.reduce(
        (current, rule) => (rule.value < current.value ? rule : current),
        ratingRules[0] || { value: 0, label: "Need Support" },
      ).label,
    [ratingRules],
  );
  const DIST_META = useMemo(
    () =>
      ratingLabels.map((label, index) => ({
        key: label,
        color:
          index === 0
            ? "bg-red-500"
            : index === 1
              ? "bg-amber-400"
              : index === 2
                ? "bg-blue-500"
                : "bg-emerald-500",
        textColor:
          index === 0
            ? "text-red-600"
            : index === 1
              ? "text-amber-600"
              : index === 2
                ? "text-blue-600"
                : "text-emerald-600",
        bg:
          index === 0
            ? "bg-red-50"
            : index === 1
              ? "bg-amber-50"
              : index === 2
                ? "bg-blue-50"
                : "bg-emerald-50",
      })),
    [ratingLabels],
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isConfirmWeekOpen, setIsConfirmWeekOpen] = useState(false);
  const [isCreateBatchOpen, setIsCreateBatchOpen] = useState(false);
  // Multi-select week filter — defaults to current week
  const [selectedWeeks, setSelectedWeeks] = useState([]);
  const [reportView, setReportView] = useState("week");

  /* ── Data loading ──────────────────────────────────────────── */
  const loadData = useCallback(
    async (batchId) => {
      dispatch(setStudentLoading(true));
      try {
        const [studentsData, entriesData] = await Promise.all([
          studentService.getStudentsByBatch(batchId),
          studentService.getWeeklyEntries(batchId),
        ]);
        dispatch(setStudents(studentsData));
        dispatch(setEntries(entriesData));
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        dispatch(setStudentLoading(false));
      }
    },
    [dispatch],
  );

  useEffect(() => {
    if (!activeBatch) return;
    // Reset week filter to current week whenever the active batch changes
    setSelectedWeeks([activeBatch.currentWeek]);
    loadData(activeBatch.id);
  }, [activeBatch?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Derived: available weeks from real entries ────────────── */
  const availableWeeks = useMemo(() => {
    const weeks = [...new Set(entries.map((e) => e.week))].filter(Boolean);
    return weeks.sort((a, b) => a - b);
  }, [entries]);

  /* ── Derived: attention list (always current week) ─────────── */
  const { stats, attentionList } = useMemo(() => {
    if (!activeBatch)
      return {
        stats: { total: 0, outstanding: 0, needSupport: 0, improving: 0 },
        attentionList: [],
      };
    const cw = activeBatch.currentWeek;
    const sp = students.map((s) => {
      const se = entries
        .filter((e) => e.studentId === s.id)
        .sort((a, b) => a.week - b.week);
      return {
        ...s,
        rating: getCurrentRating(se, cw),
        trend: computeTrend(se, ratingRules),
        flags: detectFlags(se, ratingRules),
      };
    });
    return {
      stats: {
        total: students.length,
        outstanding: sp.filter((p) => p.rating === topRatingLabel).length,
        needSupport: sp.filter((p) => p.flags.includes("Need Support")).length,
        improving: sp.filter((p) => p.trend === "Improving").length,
      },
      attentionList: sp
        .filter((p) => p.flags.includes("Need Support"))
        .slice(0, 6),
    };
  }, [students, entries, activeBatch, ratingRules, topRatingLabel]);

  /* ── Derived: distribution for selected weeks ──────────────── */
  const weeksToUse = useMemo(() => {
    if (selectedWeeks.length > 0) return selectedWeeks;
    if (activeBatch) return [activeBatch.currentWeek];
    return [];
  }, [selectedWeeks, activeBatch]);

  const weekDistribution = useMemo(() => {
    const counts = Object.fromEntries(ratingLabels.map((label) => [label, 0]));
    let totalDataPoints = 0;

    weeksToUse.forEach((week) => {
      students.forEach((student) => {
        const weekEntries = entries.filter(
          (e) => e.studentId === student.id && e.week === week,
        );
        if (weekEntries.length === 0) return;
        const latest = [...weekEntries].sort(
          (a, b) => new Date(b.ratedAt || 0) - new Date(a.ratedAt || 0),
        )[0];
        if (counts[latest.rating] !== undefined) {
          counts[latest.rating]++;
          totalDataPoints++;
        }
      });
    });

    return { counts, totalDataPoints };
  }, [students, entries, weeksToUse, ratingLabels]);

  const studentLookup = useMemo(
    () => Object.fromEntries(students.map((student) => [student.id, student])),
    [students],
  );

  const weekReportData = useMemo(() => {
    return weeksToUse.map((week) => {
      const weekEntries = entries.filter((entry) => entry.week === week);
      const latestByStudent = new Map();

      weekEntries.forEach((entry) => {
        const current = latestByStudent.get(entry.studentId);
        if (
          !current ||
          new Date(entry.ratedAt || 0) > new Date(current.ratedAt || 0)
        ) {
          latestByStudent.set(entry.studentId, entry);
        }
      });

      const counts = Object.fromEntries(
        ratingLabels.map((label) => [label, 0]),
      );
      let total = 0;

      latestByStudent.forEach((entry) => {
        if (counts[entry.rating] !== undefined) {
          counts[entry.rating] += 1;
          total += 1;
        }
      });

      const topLabel = ratingLabels.reduce(
        (best, label) => (counts[label] > counts[best] ? label : best),
        ratingLabels[0] || "",
      );

      return { week, total, counts, topLabel };
    });
  }, [entries, weeksToUse, ratingLabels]);

  const dayReportData = useMemo(() => {
    const dayBuckets = new Map();
    const seenEntries = new Set();

    entries
      .filter((entry) => weeksToUse.includes(entry.week))
      .forEach((entry) => {
        const dateKey = entry.ratedAt
          ? new Date(entry.ratedAt).toISOString().split("T")[0]
          : `week-${entry.week}`;
        const studentDayKey = `${entry.studentId}-${dateKey}`;
        if (seenEntries.has(studentDayKey)) return;
        seenEntries.add(studentDayKey);

        if (!dayBuckets.has(dateKey)) {
          dayBuckets.set(dateKey, {
            dateKey,
            label: new Date(dateKey).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            }),
            total: 0,
            counts: Object.fromEntries(ratingLabels.map((label) => [label, 0])),
            students: [],
          });
        }

        const bucket = dayBuckets.get(dateKey);
        bucket.total += 1;
        if (bucket.counts[entry.rating] !== undefined) {
          bucket.counts[entry.rating] += 1;
        }
        bucket.students.push({
          name: studentLookup[entry.studentId]?.name || "Unknown student",
          rating: entry.rating,
          week: entry.week,
        });
      });

    return Array.from(dayBuckets.values()).sort((a, b) =>
      a.dateKey.localeCompare(b.dateKey),
    );
  }, [entries, weeksToUse, ratingLabels, studentLookup]);

  /* ── Week filter helpers ───────────────────────────────────── */
  const toggleWeek = (week) => {
    setSelectedWeeks((prev) =>
      prev.includes(week) ? prev.filter((w) => w !== week) : [...prev, week],
    );
  };

  const selectAllWeeks = () => setSelectedWeeks([...availableWeeks]);
  const isAllSelected =
    availableWeeks.length > 0 && selectedWeeks.length === availableWeeks.length;

  /* ── Next week handler ─────────────────────────────────────── */
  const handleStartNewWeek = async () => {
    if (!activeBatch) return;
    dispatch(setBatchLoading(true));
    try {
      const nextWeek = activeBatch.currentWeek + 1;
      await batchService.updateBatch(activeBatch.id, { currentWeek: nextWeek });
      dispatch(
        updateBatchInStore({ id: activeBatch.id, currentWeek: nextWeek }),
      );
      setIsConfirmWeekOpen(false);
    } catch (err) {
      dispatch(setBatchError(err.message));
    } finally {
      dispatch(setBatchLoading(false));
    }
  };

  /* ── No-batch empty state ──────────────────────────────────── */
  if (batches.length === 0 && !batchLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 mb-5">
          <Layers size={28} />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          No batches yet
        </h2>
        <p className="text-sm text-gray-500 max-w-xs mb-7">
          Create your first training batch to start tracking student
          performance.
        </p>
        <button
          onClick={() => setIsCreateBatchOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> Create First Batch
        </button>
        <CreateBatchModal
          isOpen={isCreateBatchOpen}
          onClose={() => setIsCreateBatchOpen(false)}
        />
      </div>
    );
  }

  /* ── Render ────────────────────────────────────────────────── */
  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto w-full">
      <ConfirmationModal
        isOpen={isConfirmWeekOpen}
        onClose={() => setIsConfirmWeekOpen(false)}
        onConfirm={handleStartNewWeek}
        title={`Start Week ${activeBatch ? activeBatch.currentWeek + 1 : ""}?`}
        message={`All students in ${activeBatch?.name} will be unrated for the new week.`}
        confirmLabel="Start New Week"
        type="primary"
      />
      <CreateBatchModal
        isOpen={isCreateBatchOpen}
        onClose={() => setIsCreateBatchOpen(false)}
      />

      {/* Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start gap-5 mb-8">
        <div>
          <h1
            className="text-2xl font-semibold text-gray-900 mb-1"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Welcome, {user?.name?.split(" ")[0] || "Trainer"}
          </h1>
          <p className="text-sm text-gray-500">
            {activeBatch
              ? `Managing ${activeBatch.name}`
              : "Select a batch to begin"}
            {" · "}
            <span className="text-indigo-600 font-medium">
              {batches.length} batch{batches.length !== 1 ? "es" : ""}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            onClick={() => navigate(`/live/${activeBatch?.id}`)}
            disabled={!activeBatch}
            className="btn-primary flex items-center gap-2 flex-1 sm:flex-none justify-center disabled:opacity-30"
          >
            <Play size={14} fill="currentColor" /> Start Session
          </button>
          <button
            onClick={() => setIsCreateBatchOpen(true)}
            className="btn-ghost flex items-center gap-2 flex-1 sm:flex-none justify-center"
          >
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
            <p className="text-sm text-gray-500 hidden sm:block truncate max-w-xs">
              {activeBatch.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span
              className="text-xs font-medium text-gray-700"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Week {activeBatch?.currentWeek || 1}
            </span>
          </div>
          <button
            onClick={() => setIsConfirmWeekOpen(true)}
            disabled={!activeBatch || batchLoading}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next Week →
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={User}
          label="Total Students"
          value={stats.total}
          accent="bg-slate-600"
        />
        <StatCard
          icon={TrendingUp}
          label={topRatingLabel}
          value={stats.outstanding}
          accent="bg-emerald-500"
        />
        <StatCard
          icon={AlertCircle}
          label={supportRatingLabel}
          value={stats.needSupport}
          accent="bg-red-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Improving"
          value={stats.improving}
          accent="bg-indigo-500"
        />
      </div>

      {!activeBatch && (
        <div className="card p-16 text-center">
          <Layers className="mx-auto text-gray-200 mb-4" size={36} />
          <p className="text-sm text-gray-400">
            Select a batch to see analytics
          </p>
        </div>
      )}

      {activeBatch && (
        /* 1 : 2 ratio — Attention (1 col) + Distribution (2 cols) */
        <div className="grid grid-cols-3 gap-5">
          {/* ── Needs Attention (col-span-1) ── */}
          <section className="card p-6 col-span-1 flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <AlertCircle size={16} className="text-indigo-500" />
                <h2 className="text-sm font-semibold text-gray-900">
                  Needs Attention
                </h2>
              </div>
              <button
                onClick={() => navigate("/students")}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer flex items-center gap-1"
              >
                View all <ChevronRight size={12} />
              </button>
            </div>
            <div className="flex-1">
              {studentLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="animate-spin text-gray-300" size={24} />
                </div>
              ) : attentionList.length > 0 ? (
                <div className="space-y-1">
                  {attentionList.map((s) => (
                    <StudentAttentionRow
                      key={s.id}
                      name={s.name}
                      flags={s.flags}
                      onClick={() => navigate("/students")}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10">
                  <CheckCircle2 size={28} className="mb-3 text-emerald-400" />
                  <p className="text-sm text-gray-500">
                    All students performing well
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ── Reporting Panel (col-span-2) ── */}
          <section className="card p-6 col-span-2 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <BarChart2 size={16} className="text-indigo-500" />
                <h2 className="text-sm font-semibold text-gray-900">
                  Reporting View
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setReportView("week")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    reportView === "week"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  Week-wise
                </button>
                <button
                  onClick={() => setReportView("day")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    reportView === "day"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  Day-wise
                </button>
              </div>
            </div>

            {availableWeeks.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-5 pb-4 border-b border-gray-100">
                <button
                  onClick={selectAllWeeks}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    isAllSelected
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  All
                </button>
                {availableWeeks.map((w) => (
                  <button
                    key={w}
                    onClick={() => toggleWeek(w)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                      selectedWeeks.includes(w)
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    Wk {w}
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1">
              {studentLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="animate-spin text-gray-300" size={24} />
                </div>
              ) : weekDistribution.totalDataPoints > 0 ? (
                <div className="space-y-5">
                  {reportView === "week" ? (
                    <div className="grid gap-3">
                      {weekReportData.map((item) => (
                        <div
                          key={item.week}
                          className="rounded-xl border border-gray-100 p-3 bg-gray-50/70"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                              <CalendarDays
                                size={14}
                                className="text-indigo-500"
                              />
                              Week {item.week}
                            </div>
                            <span className="text-[11px] text-gray-500">
                              {item.total} student{item.total === 1 ? "" : "s"}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-600">
                            {ratingLabels.map((label) => (
                              <div
                                key={label}
                                className="rounded-lg bg-white px-2.5 py-2 border border-gray-100"
                              >
                                <div className="font-semibold text-gray-700">
                                  {label}
                                </div>
                                <div className="text-[11px] text-gray-500">
                                  {item.counts[label] || 0}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 text-[11px] text-gray-500">
                            Leading label:{" "}
                            <span className="font-semibold text-gray-700">
                              {item.topLabel || "—"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {dayReportData.map((item) => (
                        <div
                          key={item.dateKey}
                          className="rounded-xl border border-gray-100 p-3 bg-gray-50/70"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                              <ListChecks
                                size={14}
                                className="text-indigo-500"
                              />
                              {item.label}
                            </div>
                            <span className="text-[11px] text-gray-500">
                              {item.total} rating{item.total === 1 ? "" : "s"}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-600">
                            {ratingLabels.map((label) => (
                              <div
                                key={label}
                                className="rounded-lg bg-white px-2.5 py-2 border border-gray-100"
                              >
                                <div className="font-semibold text-gray-700">
                                  {label}
                                </div>
                                <div className="text-[11px] text-gray-500">
                                  {item.counts[label] || 0}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {item.students.slice(0, 4).map((student, index) => (
                              <span
                                key={`${student.name}-${index}`}
                                className="rounded-full bg-white px-2.5 py-1 text-[11px] text-gray-600 border border-gray-100"
                              >
                                {student.name}: {student.rating}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <BarChart2 size={28} className="mb-3 opacity-30" />
                  <p className="text-sm font-medium">
                    {availableWeeks.length === 0
                      ? "No ratings yet — start a live session"
                      : selectedWeeks.length === 0
                        ? "Select a week above to see distribution"
                        : "No data for selected weeks"}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
