import { createSlice } from '@reduxjs/toolkit';

// Helper to get persisted batch ID
const getPersistedBatchId = () => localStorage.getItem('activeBatchId');
const persistBatchId = (id) => id ? localStorage.setItem('activeBatchId', id) : localStorage.removeItem('activeBatchId');

const batchSlice = createSlice({
  name: 'batch',
  initialState: {
    batches: [],
    activeBatch: null,
    loading: false,
    error: null,
  },
  reducers: {
    setBatches: (state, action) => {
      state.batches = action.payload;
      state.loading = false;
      state.error = null;
      
      // Handle auto-selection with persistence
      const persistedId = getPersistedBatchId();
      if (persistedId) {
        const found = action.payload.find(b => b.id === persistedId);
        if (found) {
          state.activeBatch = found;
          return;
        }
      }

      // Fallback: If no active batch is set, set it to the first one
      if (!state.activeBatch && action.payload.length > 0) {
        state.activeBatch = action.payload[0];
        persistBatchId(state.activeBatch.id);
      }
    },
    setActiveBatch: (state, action) => {
      state.activeBatch = action.payload;
      persistBatchId(action.payload?.id);
    },
    addBatch: (state, action) => {
      state.batches = [action.payload, ...state.batches];
      state.activeBatch = action.payload;
      persistBatchId(action.payload?.id);
    },
    updateBatchInStore: (state, action) => {
      const { id, ...data } = action.payload;
      const index = state.batches.findIndex(b => b.id === id);
      if (index !== -1) {
        state.batches[index] = { ...state.batches[index], ...data };
        if (state.activeBatch?.id === id) {
          state.activeBatch = { ...state.activeBatch, ...data };
        }
      }
    },
    removeBatchFromStore: (state, action) => {
      state.batches = state.batches.filter(b => b.id !== action.payload);
      if (state.activeBatch?.id === action.payload) {
        state.activeBatch = state.batches.length > 0 ? state.batches[0] : null;
        persistBatchId(state.activeBatch?.id);
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { 
  setBatches, 
  setActiveBatch, 
  addBatch, 
  updateBatchInStore, 
  removeBatchFromStore,
  setLoading, 
  setError 
} = batchSlice.actions;

export default batchSlice.reducer;
