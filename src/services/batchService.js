import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  doc, 
  updateDoc, 
  serverTimestamp,
  increment,
  runTransaction
} from 'firebase/firestore';
import { db } from '../../firebase/firebase-config';

const BATCHES_COLLECTION = 'batches';

/**
 * Service for managing training batches in Firestore.
 */
export const batchService = {
  /**
   * Create a new batch.
   * @param {string} ownerId - The UID of the trainer.
   * @param {Object} batchData - The batch details (name, description).
   */
  createBatch: async (ownerId, batchData) => {
    try {
      const docRef = await addDoc(collection(db, BATCHES_COLLECTION), {
        ...batchData,
        ownerId,
        currentWeek: 1,
        isArchived: false,
        createdAt: serverTimestamp(),
        schemaVersion: 1
      });
      return { id: docRef.id, ...batchData };
    } catch (error) {
      console.error("Error creating batch:", error);
      throw error;
    }
  },

  /**
   * Fetch all active batches for a trainer.
   * @param {string} ownerId - The UID of the trainer.
   */
 getBatches: async (ownerId) => {
  try {
    // Single-field query (no composite index needed)
    const q = query(
      collection(db, BATCHES_COLLECTION),
      where('ownerId', '==', ownerId)
    );
    
    const querySnapshot = await getDocs(q);
    
    // Filter and Sort client-side to bypass index requirements
    return querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(batch => batch.isArchived !== true)
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA; // Newest first
      });
  } catch (error) {
    console.error("Error fetching batches:", error);
    throw error;
  }
},

  /**
   * Increment the current week of a batch.
   * @param {string} batchId - The ID of the batch.
   */
  incrementWeek: async (batchId) => {
    try {
      const batchRef = doc(db, BATCHES_COLLECTION, batchId);
      await updateDoc(batchRef, {
        currentWeek: increment(1)
      });
    } catch (error) {
      console.error("Error incrementing week:", error);
      throw error;
    }
  },

  /**
   * Archive a batch (soft delete).
   * @param {string} batchId - The ID of the batch.
   */
  archiveBatch: async (batchId) => {
    try {
      const batchRef = doc(db, BATCHES_COLLECTION, batchId);
      await updateDoc(batchRef, {
        isArchived: true
      });
    } catch (error) {
      console.error("Error archiving batch:", error);
      throw error;
    }
  },

  /**
   * Fetch a single batch by ID.
   * @param {string} batchId - The ID of the batch.
   */
  getBatchById: async (batchId) => {
    try {
      const { getDoc } = await import('firebase/firestore');
      const batchRef = doc(db, BATCHES_COLLECTION, batchId);
      const batchSnap = await getDoc(batchRef);
      if (batchSnap.exists()) {
        return { id: batchSnap.id, ...batchSnap.data() };
      }
      return null;
    } catch (error) {
      console.error("Error fetching batch by ID:", error);
      throw error;
    }
  },

  /**
   * Update batch details.
   * @param {string} batchId - The ID of the batch.
   * @param {Object} data - The data to update.
   */
  updateBatch: async (batchId, data) => {
    try {
      const batchRef = doc(db, BATCHES_COLLECTION, batchId);
      await updateDoc(batchRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating batch:", error);
      throw error;
    }
  }
};
