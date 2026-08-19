export const normalizeRole = (user) => (user?.role || 'trainer').toLowerCase();

export function canViewBatch(user, batchId, allowedBatchIds = [], batchRecord = null) {
    if (!user || !batchId) return false;

    const role = normalizeRole(user);
    if (role === 'admin') return true;

    const visibleIds = Array.isArray(allowedBatchIds) ? allowedBatchIds : [];
    if (visibleIds.includes(batchId)) return true;

    if (role === 'trainer') {
        return Boolean(batchRecord && batchRecord.ownerId === user.uid);
    }

    if (role === 'manager') {
        return false;
    }

    return false;
}

export function getVisibleBatchIds(user, batches = [], accessRecords = []) {
    if (!user) return [];

    const role = normalizeRole(user);
    if (role === 'admin') {
        return (batches || []).map((batch) => batch?.id).filter(Boolean);
    }

    if (role === 'trainer') {
        return (batches || [])
            .filter((batch) => batch?.ownerId === user.uid)
            .map((batch) => batch.id)
            .filter(Boolean);
    }

    if (role === 'manager') {
        const granted = (accessRecords || [])
            .filter((entry) => entry?.managerUid === user.uid && entry?.isActive !== false)
            .map((entry) => entry?.batchId)
            .filter(Boolean);

        return [...new Set(granted)];
    }

    return [];
}
