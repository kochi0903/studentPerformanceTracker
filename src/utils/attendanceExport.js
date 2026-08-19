const escapeCell = (value) => {
    const normalized = value == null ? '' : String(value);
    return `"${normalized.replace(/"/g, '""')}"`;
};

export function buildAttendanceSheetRows({ batchName, date, attendanceRows = [] }) {
    const headers = ['Batch', 'Date', 'Student Name', 'Status', 'Remarks', 'Marked By'];

    const rows = attendanceRows.map((row) => [
        batchName || '',
        date || '',
        row.studentName || '',
        row.status || 'absent',
        row.remarks || '',
        row.markedBy || '',
    ]);

    return [headers, ...rows].map((line) => line.map(escapeCell).join(',')).join('\n');
}

export function downloadAttendanceSheet({ batchName, date, attendanceRows = [], fileName }) {
    const csvContent = buildAttendanceSheetRows({ batchName, date, attendanceRows });
    const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName || 'attendance-sheet'}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return csvContent;
}
