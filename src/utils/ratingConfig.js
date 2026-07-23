const DEFAULT_RATING_RULES = [
    { key: 'need-support', label: 'Need Support', value: 1, color: '#ef4444', group: 'needs-attention', isActive: true },
    { key: 'average', label: 'Average', value: 2, color: '#f59e0b', group: 'average', isActive: true },
    { key: 'good', label: 'Good', value: 3, color: '#3b82f6', group: 'good', isActive: true },
    { key: 'outstanding', label: 'Outstanding', value: 4, color: '#10b981', group: 'outstanding', isActive: true },
];

export const getDefaultRatingRules = () => DEFAULT_RATING_RULES.map((rule) => ({ ...rule }));

export const normalizeRatingRules = (config) => {
    const sourceRules = config?.ratingRules || config?.rules || [];
    if (!Array.isArray(sourceRules) || sourceRules.length === 0) {
        return getDefaultRatingRules();
    }

    const normalized = sourceRules
        .filter((rule) => rule && typeof rule === 'object')
        .map((rule) => ({
            key: rule.key || `rating-${rule.value || ''}`,
            label: rule.label || 'Untitled',
            value: Number(rule.value ?? 0),
            color: rule.color || '#64748b',
            group: rule.group || 'custom',
            isActive: rule.isActive !== false,
        }))
        .sort((a, b) => a.value - b.value);

    return normalized.length > 0 ? normalized : getDefaultRatingRules();
};

export const getRatingRuleByValue = (rules, value) => rules.find((rule) => rule.value === Number(value));
export const getRatingRuleByKey = (rules, key) => rules.find((rule) => rule.key === key);
export const getRatingRuleByLabel = (rules, label) => rules.find((rule) => rule.label === label || rule.key === label);
export const getRatingGroup = (rules, value) => getRatingRuleByValue(rules, value)?.group || 'custom';
export const getRatingColor = (rules, value) => getRatingRuleByValue(rules, value)?.color || '#64748b';
