import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  updateDoc, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../../firebase/firebase-config';
import { serializeDoc } from '../utils/firestore';

const STUDENTS_COLLECTION = 'students';
const ENTRIES_COLLECTION = 'weeklyEntries';

/**
 * Service for managing student records and performance history.
 */
export const studentService = {
  /**
   * Bulk add students to a batch.
   * @param {string} batchId - The ID of the batch.
   * @param {string[]} names - Array of student names.
   */
  addStudentsBulk: async (batchId, names) => {
    try {
      const batch = writeBatch(db);
      const studentRefs = [];

      names.forEach(name => {
        const studentRef = doc(collection(db, STUDENTS_COLLECTION));
        batch.set(studentRef, {
          batchId,
          name: name.trim(),
          addedOn: serverTimestamp(),
          tags: [],
          schemaVersion: 1
        });
        studentRefs.push({ id: studentRef.id, name: name.trim() });
      });

      await batch.commit();
      return studentRefs;
    } catch (error) {
      console.error("Error bulk adding students:", error);
      throw error;
    }
  },

  /**
   * Fetch all students for a specific batch.
   * @param {string} batchId - The ID of the batch.
   */
  getStudentsByBatch: async (batchId) => {
    try {
      // Use simple query to avoid index requirements
      const q = query(
        collection(db, STUDENTS_COLLECTION),
        where('batchId', '==', batchId)
      );
      const querySnapshot = await getDocs(q);
      
      // Sort client-side by name
      return querySnapshot.docs
        .map(doc => serializeDoc({ id: doc.id, ...doc.data() }))
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error("Error fetching students:", error);
      throw error;
    }
  },

  /**
   * Fetch all weekly entries for a batch.
   * Used for computing trends and dashboard stats.
   */
  getWeeklyEntries: async (batchId) => {
    try {
      // Single-field query only — no composite index required.
      // Sorting is handled client-side below.
      const q = query(
        collection(db, ENTRIES_COLLECTION),
        where('batchId', '==', batchId)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map(doc => serializeDoc({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.week - a.week) || (new Date(b.ratedAt || 0) - new Date(a.ratedAt || 0)));
    } catch (error) {
      console.error('Error fetching weekly entries:', error);
      throw error;
    }
  },

  /**
   * Delete a student and their entries.
   */
  deleteStudent: async (studentId) => {
    try {
      const batch = writeBatch(db);
      
      // Delete student document
      const studentRef = doc(db, STUDENTS_COLLECTION, studentId);
      batch.delete(studentRef);
      
      // Also delete their entries (we should fetch them first or use a cloud function, 
      // but here we'll just delete the student for now to keep it simple, 
      // or we can query and batch delete entries if there aren't thousands)
      const entriesQuery = query(collection(db, ENTRIES_COLLECTION), where('studentId', '==', studentId));
      const entriesSnap = await getDocs(entriesQuery);
      entriesSnap.forEach(eDoc => batch.delete(eDoc.ref));
      
      await batch.commit();
    } catch (error) {
      console.error("Error deleting student:", error);
      throw error;
    }
  },

  /**
   * Bulk delete students.
   */
  deleteStudentsBulk: async (studentIds) => {
    try {
      // Collect all weekly entry refs for every student being deleted
      const entryRefs = [];
      for (const id of studentIds) {
        const entriesSnap = await getDocs(
          query(collection(db, ENTRIES_COLLECTION), where('studentId', '==', id))
        );
        entriesSnap.forEach(eDoc => entryRefs.push(eDoc.ref));
      }

      // Build the full delete list: student docs + their entry docs
      const studentRefs = studentIds.map(id => doc(db, STUDENTS_COLLECTION, id));
      const allRefs = [...studentRefs, ...entryRefs];

      // Commit in chunks of 499 to stay under Firestore's 500-op limit
      const CHUNK_SIZE = 499;
      for (let i = 0; i < allRefs.length; i += CHUNK_SIZE) {
        const batch = writeBatch(db);
        allRefs.slice(i, i + CHUNK_SIZE).forEach(ref => batch.delete(ref));
        await batch.commit();
      }
    } catch (error) {
      console.error("Error bulk deleting students:", error);
      throw error;
    }
  },

  /**
   * Add a performance entry for a student for a specific week.
   */
  addWeeklyEntry: async (batchId, studentId, week, ratingData) => {
    try {
      const docRef = await addDoc(collection(db, ENTRIES_COLLECTION), {
        batchId,
        studentId,
        week,
        ...ratingData,
        ratedAt: serverTimestamp()
      });
      return { id: docRef.id, ...ratingData };
    } catch (error) {
      console.error("Error adding weekly entry:", error);
      throw error;
    }
  },

  /**
   * Update student details (tags, name).
   */
  updateStudent: async (studentId, data) => {
    try {
      const studentRef = doc(db, STUDENTS_COLLECTION, studentId);
      await updateDoc(studentRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating student:", error);
      throw error;
    }
  }
};
