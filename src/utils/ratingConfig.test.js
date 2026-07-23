import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRatingRules, getRatingRuleByValue, getRatingRuleByKey } from './ratingConfig.js';

test('normalizes a missing config to the default rating rules', () => {
    const rules = normalizeRatingRules(null);
    assert.equal(rules[0].label, 'Need Support');
    assert.equal(rules[3].label, 'Outstanding');
});

test('applies admin-defined labels and values from a config payload', () => {
    const customRules = [
        { key: 'need-attention', label: 'Need Attention', value: 1, color: '#ef4444', group: 'needs-attention', isActive: true },
        { key: 'average', label: 'Average', value: 2, color: '#f59e0b', group: 'average', isActive: true },
        { key: 'good', label: 'Good', value: 3, color: '#3b82f6', group: 'good', isActive: true },
        { key: 'outstanding', label: 'Outstanding', value: 4, color: '#10b981', group: 'outstanding', isActive: true },
    ];

    const rules = normalizeRatingRules({ ratingRules: customRules });
    assert.equal(getRatingRuleByValue(rules, 1)?.label, 'Need Attention');
    assert.equal(getRatingRuleByKey(rules, 'good')?.value, 3);
});
