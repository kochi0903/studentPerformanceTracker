import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { CalendarDays, Download, Loader2, Save, ArrowLeft } from "lucide-react";
import { batchService } from "../../services/batchService";
import { studentService } from "../../services/studentService";
import { attendanceService } from "../../services/attendanceService";
import { downloadAttendanceSheet } from "../../utils/attendanceExport";

const STATUS_OPTIONS = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "late", label: "Late" },
  { value: "leave", label: "Leave" },
];

const AttendancePage = () => {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [batch, setBatch] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadAttendance = async () => {
      if (!batchId) return;

      try {
        const [batchData, studentData] = await Promise.all([
          batchService.getBatchById(batchId),
          studentService.getStudentsByBatch(batchId),
        ]);

        setBatch(batchData);
        setStudents(studentData);

        const attendanceEntry = await attendanceService.getAttendanceForDate(
          batchId,
          selectedDate,
        );
        const loadedRows = studentData.map((student) => {
          const record = attendanceEntry?.records?.find(
            (row) => row.studentId === student.id,
          ) || {
            studentId: student.id,
            studentName: student.name,
            status: "absent",
            remarks: "",
            markedBy: user?.uid || "",
          };

          return {
            id: student.id,
            studentId: student.id,
            studentName: student.name,
            status: record.status || "absent",
            remarks: record.remarks || "",
            markedBy: record.markedBy || user?.uid || "",
          };
        });

        setAttendance(loadedRows);
      } catch (error) {
        console.error("Failed to load attendance page", error);
      } finally {
        setLoading(false);
      }
    };

    loadAttendance();
  }, [batchId, selectedDate, user?.uid]);

  const attendanceSummary = useMemo(() => {
    const counts = { present: 0, absent: 0, late: 0, leave: 0 };
    attendance.forEach((record) => {
      counts[record.status] = (counts[record.status] || 0) + 1;
    });
    return counts;
  }, [attendance]);

  const updateStatus = (studentId, nextStatus) => {
    setAttendance((prev) =>
      prev.map((row) =>
        row.studentId === studentId ? { ...row, status: nextStatus } : row,
      ),
    );
  };

  const updateRemarks = (studentId, value) => {
    setAttendance((prev) =>
      prev.map((row) =>
        row.studentId === studentId ? { ...row, remarks: value } : row,
      ),
    );
  };

  const handleSave = async () => {
    if (!batchId || !user?.uid) return;

    setSaving(true);
    try {
      await attendanceService.saveAttendanceForDate(
        batchId,
        selectedDate,
        attendance,
        user.uid,
      );
    } catch (error) {
      console.error("Save attendance failed", error);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    if (!batch) return;
    downloadAttendanceSheet({
      batchName: batch.name,
      date: selectedDate,
      attendanceRows: attendance,
      fileName: `${batch.name.replace(/\s+/g, "-").toLowerCase()}-${selectedDate}`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500 mb-3" size={28} />
        <p className="text-xs text-gray-500 uppercase tracking-widest font-medium">
          Loading attendance
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-indigo-500">
              Batch attendance
            </p>
            <h1 className="text-2xl font-semibold text-gray-900 mt-2">
              {batch?.name || "Attendance"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="btn-secondary flex items-center gap-2"
          >
            <Download size={15} /> Export XLS
          </button>
          <button
            onClick={handleSave}
            className="btn-primary flex items-center gap-2"
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="animate-spin" size={15} />
            ) : (
              <Save size={15} />
            )}
            Save Attendance
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-3 mb-6">
        {STATUS_OPTIONS.map((option) => (
          <div key={option.value} className="card px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">
              {option.label}
            </p>
            <p className="text-2xl font-semibold text-gray-900 mt-2">
              {attendanceSummary[option.value] || 0}
            </p>
          </div>
        ))}
      </div>

      <div className="card p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-gray-600">
            <CalendarDays size={17} className="text-indigo-500" />
            <label className="text-sm font-medium">Attendance date</label>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="input-field max-w-xs"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase tracking-[0.2em] text-gray-400">
                <th className="py-3 pr-4">Student</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((row) => (
                <tr
                  key={row.studentId}
                  className="border-b border-gray-100 align-top"
                >
                  <td className="py-4 pr-4 font-medium text-gray-800">
                    {row.studentName}
                  </td>
                  <td className="py-4 pr-4">
                    <select
                      value={row.status}
                      onChange={(event) =>
                        updateStatus(row.studentId, event.target.value)
                      }
                      className="input-field min-w-[140px]"
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-4">
                    <input
                      type="text"
                      value={row.remarks}
                      onChange={(event) =>
                        updateRemarks(row.studentId, event.target.value)
                      }
                      className="input-field min-w-[220px]"
                      placeholder="Optional note"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
