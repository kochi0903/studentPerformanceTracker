import test from 'node:test';
import assert from 'node:assert/strict';
import { canViewBatch, getVisibleBatchIds } from './accessRules.js';

test('admin can view any batch', () => {
    assert.equal(canViewBatch({ role: 'admin' }, 'batch-1', ['batch-1']), true);
    assert.equal(canViewBatch({ role: 'admin' }, 'batch-2', []), true);
});

test('trainer can view only batches they own', () => {
    assert.equal(canViewBatch({ role: 'trainer', uid: 'u-1' }, 'batch-1', ['batch-1']), true);
    assert.equal(canViewBatch({ role: 'trainer', uid: 'u-1' }, 'batch-2', ['batch-1']), false);
});

test('manager can view only assigned batches', () => {
    const user = { role: 'manager', uid: 'manager-1' };
    assert.equal(canViewBatch(user, 'batch-2', ['batch-2']), true);
    assert.equal(canViewBatch(user, 'batch-3', ['batch-2']), false);
});

test('visible batch ids are resolved from ownership and access grants', () => {
    const user = { role: 'manager', uid: 'manager-1' };
    const batches = [
        { id: 'batch-1', ownerId: 'trainer-1' },
        { id: 'batch-2', ownerId: 'trainer-2' },
    ];
    const access = [
        { managerUid: 'manager-1', batchId: 'batch-2', isActive: true },
    ];

    assert.deepEqual(getVisibleBatchIds(user, batches, access), ['batch-2']);
});
