/**
 * Utility functions for computing student performance trends and flags.
 */
import { normalizeRatingRules } from './ratingConfig';

const getOrdinalMap = (rules) => {
  const normalizedRules = normalizeRatingRules({ ratingRules: rules });
  return normalizedRules.reduce((acc, rule) => {
    acc[rule.label] = rule.value;
    return acc;
  }, {});
};

const getRatingOrdinal = (entryRating, rules) => {
  const ordinalMap = getOrdinalMap(rules);
  return ordinalMap[entryRating] || 0;
};

/**
 * Compute the performance trend for a student.
 * @param {Array} entries - Historical entries for the student (sorted by week asc).
 * @param {Array} rules - Optional rating configuration rules.
 * @returns {string} - 'Improving', 'Declining', 'Consistent', 'Variable', 'Recovering', or 'New'.
 */
export const computeTrend = (entries, rules) => {
  if (!entries || entries.length < 3) return 'New';

  const ordinals = entries.map((entry) => getRatingOrdinal(entry.rating, rules));
  const last3 = ordinals.slice(-3);
  const supportThreshold = Math.min(...ordinals.slice(0, -1).filter(Boolean), 2);
  const wasNeedSupport = ordinals.slice(0, -1).some((value) => value <= supportThreshold);
  const nowGoodOrAbove = last3[2] >= 3;

  if (wasNeedSupport && nowGoodOrAbove) return 'Recovering';

  if (last3[2] > last3[1] && last3[1] > last3[0]) return 'Improving';
  if (last3[2] < last3[1] && last3[1] < last3[0]) return 'Declining';
  if (last3[0] === last3[1] && last3[1] === last3[2]) return 'Consistent';

  return 'Variable';
};

/**
 * Detect performance flags for a student.
 * @param {Array} entries - Historical entries for the student (sorted by week asc).
 * @param {Array} rules - Optional rating configuration rules.
 * @returns {Array<string>} - Array of active flags.
 */
export const detectFlags = (entries, rules) => {
  if (!entries || entries.length === 0) return ['New'];

  const flags = [];
  const ordinals = entries.map((entry) => getRatingOrdinal(entry.rating, rules));
  const latest = ordinals[ordinals.length - 1];
  const previous = ordinals[ordinals.length - 2];

  if (entries.length < 3) flags.push('New');

  if (ordinals.length >= 2) {
    const last2 = ordinals.slice(-2);
    if (last2.every((value) => value <= 2)) flags.push('Need Support');
  }

  if (ordinals.length >= 2) {
    const last2 = ordinals.slice(-2);
    const topValue = Math.max(...ordinals.map((value) => value));
    if (last2.every((value) => value === topValue)) flags.push('Star Student');
  }

  if (ordinals.length >= 2) {
    const diff = Math.abs(latest - previous);
    if (diff >= 2) flags.push('Inconsistent');
  }

  if (ordinals.length >= 2) {
    if (previous <= 1 && latest >= 3) flags.push('Recovering');
  }

  return [...new Set(flags)];
};

/**
 * Get current week's rating display.
 */
export const getCurrentRating = (entries, currentWeek) => {
  const entry = entries.find((item) => item.week === currentWeek);
  return entry ? entry.rating : 'Unrated';
};
