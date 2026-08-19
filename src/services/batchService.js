import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  serverTimestamp,
  increment,
  getDoc,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../../firebase/firebase-config';
import { serializeDoc } from '../utils/firestore';

const BATCHES_COLLECTION = 'batches';
const BATCH_ACCESS_COLLECTION = 'batchAccess';

const serializeBatchDocs = (documents) =>
  documents
    .filter((docSnap) => docSnap && docSnap.exists && docSnap.exists())
    .map((docSnap) => serializeDoc({ id: docSnap.id, ...docSnap.data() }))
    .filter((batch) => batch.isArchived !== true)
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB - dateA;
    });

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
      // Return all fields so the Redux store is immediately consistent
      // without requiring a refetch. createdAt uses Date.now() as a
      // serializable stand-in (serverTimestamp() is a sentinel, not a value).
      return {
        id: docRef.id,
        ...batchData,
        ownerId,
        currentWeek: 1,
        isArchived: false,
        createdAt: Date.now(),
        schemaVersion: 1
      };
    } catch (error) {
      console.error("Error creating batch:", error);
      throw error;
    }
  },

  /**
   * Fetch all active batches for a trainer.
   * @param {string} ownerId - The UID of the trainer.
   */
  getAllBatches: async () => {
    try {
      const snapshot = await getDocs(collection(db, BATCHES_COLLECTION));
      return serializeBatchDocs(snapshot.docs);
    } catch (error) {
      console.error('Error fetching all batches:', error);
      throw error;
    }
  },

  getBatches: async (userOrOwnerId) => {
    try {
      const user = typeof userOrOwnerId === 'object' ? userOrOwnerId : null;
      const ownerId = user?.uid || userOrOwnerId;
      const role = user?.role || 'trainer';

      if (role === 'admin') {
        return batchService.getAllBatches();
      }

      if (role === 'manager') {
        const accessSnap = await getDocs(
          query(
            collection(db, BATCH_ACCESS_COLLECTION),
            where('managerUid', '==', ownerId),
            where('isActive', '==', true),
          )
        );

        const batchIds = accessSnap.docs
          .map((docSnap) => docSnap.data().batchId)
          .filter(Boolean);

        if (!batchIds.length) return [];

        const batches = await Promise.all(
          batchIds.map(async (batchId) => {
            const ref = doc(db, BATCHES_COLLECTION, batchId);
            const snap = await getDoc(ref);
            return snap.exists() ? serializeDoc({ id: snap.id, ...snap.data() }) : null;
          }),
        );

        return batches
          .filter(Boolean)
          .filter((batch) => batch.isArchived !== true)
          .sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
            return dateB - dateA;
          });
      }

      const q = query(
        collection(db, BATCHES_COLLECTION),
        where('ownerId', '==', ownerId)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map((docSnap) => serializeDoc({ id: docSnap.id, ...docSnap.data() }))
        .filter((batch) => batch.isArchived !== true)
        .sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
          const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
          return dateB - dateA;
        });
    } catch (error) {
      console.error('Error fetching batches:', error);
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
        return serializeDoc({ id: batchSnap.id, ...batchSnap.data() });
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
  },

  addBatchAccess: async (managerUid, batchId, grantedBy) => {
    try {
      const accessRef = doc(db, BATCH_ACCESS_COLLECTION, `${managerUid}_${batchId}`);
      await setDoc(accessRef, {
        managerUid,
        batchId,
        grantedBy,
        isActive: true,
        grantedAt: serverTimestamp(),
      }, { merge: true });
      return { managerUid, batchId, grantedBy, isActive: true };
    } catch (error) {
      console.error('Error granting batch access:', error);
      throw error;
    }
  },

  removeBatchAccess: async (managerUid, batchId) => {
    try {
      const accessRef = doc(db, BATCH_ACCESS_COLLECTION, `${managerUid}_${batchId}`);
      await deleteDoc(accessRef);
    } catch (error) {
      console.error('Error removing batch access:', error);
      throw error;
    }
  },

  getBatchAccessByManager: async (managerUid) => {
    try {
      const q = query(
        collection(db, BATCH_ACCESS_COLLECTION),
        where('managerUid', '==', managerUid),
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    } catch (error) {
      console.error('Error fetching manager batch access:', error);
      throw error;
    }
  },

  getAllBatchAccess: async () => {
    try {
      const snapshot = await getDocs(collection(db, BATCH_ACCESS_COLLECTION));
      return snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    } catch (error) {
      console.error('Error fetching all batch access:', error);
      throw error;
    }
  }
};
