import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase-config';

const SETTINGS_DOC_ID = 'workspace';

export const settingsService = {
    getAppSettings: async () => {
        const ref = doc(db, 'appSettings', SETTINGS_DOC_ID);
        const snap = await getDoc(ref);
        if (!snap.exists()) return { ratingRules: [] };
        return snap.data();
    },

    updateAppSettings: async (config) => {
        const ref = doc(db, 'appSettings', SETTINGS_DOC_ID);
        await setDoc(ref, {
            ...config,
            updatedAt: serverTimestamp(),
        }, { merge: true });
        return { ...config };
    },
};
