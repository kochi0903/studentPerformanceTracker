import { createSlice } from "@reduxjs/toolkit";

const studentSlice = createSlice({
  name: "student",
  initialState: {
    students: [],
    entries: [],
    loading: false,
    error: null,
  },
  reducers: {
    setStudents: (state, action) => {
      state.students = action.payload;
      state.loading = false;
      state.error = null;
    },
    setEntries: (state, action) => {
      state.entries = action.payload;
    },
    addStudentsToStore: (state, action) => {
      // action.payload is an array of new students
      state.students = [...state.students, ...action.payload].sort((a, b) =>
        a.name.localeCompare(b.name),
      );
    },
    updateStudentInStore: (state, action) => {
      const { id, ...data } = action.payload;
      const index = state.students.findIndex((s) => s.id === id);
      if (index !== -1) {
        state.students[index] = { ...state.students[index], ...data };
      }
    },
    removeStudentsFromStore: (state, action) => {
      const idsToRemove = Array.isArray(action.payload)
        ? action.payload
        : [action.payload];
      state.students = state.students.filter(
        (s) => !idsToRemove.includes(s.id),
      );
      state.entries = state.entries.filter(
        (e) => !idsToRemove.includes(e.studentId),
      );
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
  setStudents,
  setEntries,
  addStudentsToStore,
  updateStudentInStore,
  removeStudentsFromStore,
  setLoading,
  setError,
} = studentSlice.actions;

export default studentSlice.reducer;
