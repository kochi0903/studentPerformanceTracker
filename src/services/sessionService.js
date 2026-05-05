import {
  collection,
  addDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase/firebase-config';
import { serializeDoc } from '../utils/firestore';
import { studentService } from './studentService';

const SESSIONS_COLLECTION = 'sessions';
const ENTRIES_COLLECTION = 'weeklyEntries';

/**
 * Service for managing live session lifecycle and weekly entry writes.
 * @module sessionService
 */
export const sessionService = {
  /**
   * Create a new live session document in Firestore.
   * Sets status to 'active' and records startedAt timestamp.
   * @param {string} batchId
   * @param {string} ownerId
   * @param {number} week - The current week number (from batch.currentWeek)
   * @returns {Promise<{id: string, batchId: string, ownerId: string, week: number, status: string}>}
   */
  createSession: async (batchId, ownerId, week) => {
    try {
      const docRef = await addDoc(collection(db, SESSIONS_COLLECTION), {
        batchId,
        ownerId,
        week,
        status: 'active',
        startedAt: serverTimestamp(),
        endedAt: null,
        schemaVersion: 1
      });
      return { id: docRef.id, batchId, ownerId, week, status: 'active' };
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  },

  /**
   * Mark a session as completed and write endedAt timestamp.
   * @param {string} sessionId
   * @param {'completed'|'stopped'} status
   */
  endSession: async (sessionId, status = 'completed') => {
    try {
      const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId);
      await updateDoc(sessionRef, {
        status,
        endedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  },

  /**
   * Write a weekly performance entry for a student, tagged with the active sessionId.
   * Delegates to studentService.addWeeklyEntry so all entry schema stays in one place.
   * @param {string} batchId
   * @param {string} studentId
   * @param {number} week
   * @param {string} sessionId - ID of the active session (stored on the entry)
   * @param {Object} ratingData - { rating: string, isStarMoment: boolean, feedback: string }
   */
  addWeeklyEntry: async (batchId, studentId, week, sessionId, ratingData) => {
    return studentService.addWeeklyEntry(batchId, studentId, week, {
      ...ratingData,
      sessionId
    });
  },

  /**
   * Subscribe to real-time weekly entries for a batch's current week.
   * Returns an unsubscribe function — call it on component unmount.
   * @param {string} batchId
   * @param {number} week
   * @param {function(Array): void} callback - Called with array of entry objects on every update
   * @returns {function} unsubscribe - Call to stop listening
   */
  getSessionEntriesLive: (batchId, week, callback) => {
    const q = query(
      collection(db, ENTRIES_COLLECTION),
      where('batchId', '==', batchId),
      where('week', '==', week)
    );
    return onSnapshot(
      q,
      (snapshot) => {
        const entries = snapshot.docs.map(d => serializeDoc({ id: d.id, ...d.data() }));
        callback(entries);
      },
      (error) => {
        console.error('Real-time entries listener error:', error);
      }
    );
  }
};
