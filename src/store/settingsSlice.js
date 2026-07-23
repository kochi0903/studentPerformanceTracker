import { createSlice } from '@reduxjs/toolkit';
import { getDefaultRatingRules } from '../utils/ratingConfig';

const settingsSlice = createSlice({
    name: 'settings',
    initialState: {
        config: { ratingRules: getDefaultRatingRules() },
        loading: false,
        error: null,
    },
    reducers: {
        setConfig: (state, action) => {
            state.config = action.payload || { ratingRules: getDefaultRatingRules() };
            state.loading = false;
            state.error = null;
        },
        setConfigLoading: (state, action) => {
            state.loading = action.payload;
        },
        setConfigError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        },
    },
});

export const { setConfig, setConfigLoading, setConfigError } = settingsSlice.actions;
export default settingsSlice.reducer;
