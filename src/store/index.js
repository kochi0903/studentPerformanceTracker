import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import batchReducer from './batchSlice';
import studentReducer from './studentSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    batch: batchReducer,
    student: studentReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore firebase non-serializable objects if needed
        ignoredActions: ['auth/setUser'],
        ignoredPaths: ['auth.user'],
      },
    }),
});

export default store;
