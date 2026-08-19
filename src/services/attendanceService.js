import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    setDoc,
    where,
    writeBatch,
} from 'firebase/firestore';
import { db } from '../../firebase/firebase-config';

const ATTENDANCE_COLLECTION = 'attendance';

const normalizeDateKey = (rawDate) => {
    if (!rawDate) {
        return new Date().toISOString().slice(0, 10);
    }

    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) {
        return String(rawDate).slice(0, 10);
    }

    return parsed.toISOString().slice(0, 10);
};

export const attendanceService = {
    getAttendanceForDate: async (batchId, date) => {
        const normalizedDate = normalizeDateKey(date);
        const q = query(
            collection(db, ATTENDANCE_COLLECTION),
            where('batchId', '==', batchId),
            where('date', '==', normalizedDate),
        );

        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;

        const record = snapshot.docs[0];
        return {
            id: record.id,
            ...record.data(),
        };
    },

    saveAttendanceForDate: async (batchId, date, records, markedBy) => {
        const normalizedDate = normalizeDateKey(date);
        const recordId = `${batchId}_${normalizedDate}`;
        const attendanceRef = doc(db, ATTENDANCE_COLLECTION, recordId);

        const normalizedRecords = records.map((record) => ({
            studentId: record.studentId,
            studentName: record.studentName || record.name || '',
            status: record.status || 'absent',
            remarks: record.remarks || '',
            markedBy: record.markedBy || markedBy || '',
            markedAt: record.markedAt || new Date().toISOString(),
        }));

        const payload = {
            id: recordId,
            batchId,
            date: normalizedDate,
            records: normalizedRecords,
            summary: {
                present: normalizedRecords.filter((row) => row.status === 'present').length,
                absent: normalizedRecords.filter((row) => row.status === 'absent').length,
                late: normalizedRecords.filter((row) => row.status === 'late').length,
                leave: normalizedRecords.filter((row) => row.status === 'leave').length,
            },
            markedBy: markedBy || '',
            updatedAt: serverTimestamp(),
        };

        await setDoc(attendanceRef, payload, { merge: true });
        return payload;
    },

    getAttendanceByBatch: async (batchId) => {
        const q = query(
            collection(db, ATTENDANCE_COLLECTION),
            where('batchId', '==', batchId),
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    },
};
